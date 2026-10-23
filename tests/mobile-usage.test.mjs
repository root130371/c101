import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

// The production helper has no native dependencies. Execute its actual code in
// Node without changing the mobile project's Metro/module configuration.
const source = await readFile(new URL("../c101-mobile/src/services/billingUsage.ts", import.meta.url), "utf8");
const { readUsageSnapshot, usageDisplay, usagePeriods } = await import(
  `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString("base64")}`
);
const now = new Date("2026-10-23T10:00:00Z");
const row = (metric, date, used, limit = 5) => ({ metric, period_start: date, used_count: used, limit_count: limit });
const read = (data, date = now) => readUsageSnapshot(async () => ({ data, error: null }), date);

test("query errors are unavailable and never display full unused allowance", async () => {
  const snapshot = await readUsageSnapshot(async () => ({ data: [], error: Error("offline") }), now);
  assert.equal(snapshot.state, "unavailable");
  assert.equal(usageDisplay(snapshot, "chat_messages", 5, now), null);
});
test("network exceptions are unavailable rather than unhandled rejections", async () => {
  assert.equal((await readUsageSnapshot(async () => { throw Error("network"); }, now)).state, "unavailable");
});
test("a successful empty lookup can display zero usage", async () => {
  const snapshot = await read([]);
  assert.deepEqual(usageDisplay(snapshot, "chat_messages", 5, now), { used: 0, limit: 5, remaining: 5 });
});
test("old first-of-month chat rows cannot overwrite today's daily usage", async () => {
  const snapshot = await read([
    row("chat_messages", "2026-10-23", 2), row("chat_messages", "2026-10-01", 5),
    row("contract_analyses", "2026-10-01", 1), row("evidence_analyses", "2026-10-23", 99),
  ]);
  assert.deepEqual(usageDisplay(snapshot, "chat_messages", 5, now), { used: 2, limit: 5, remaining: 3 });
  assert.deepEqual(usageDisplay(snapshot, "contract_analyses", 1, now), { used: 1, limit: 1, remaining: 0 });
  assert.equal(snapshot.counters.length, 2);
});
test("daily and monthly metrics remain distinct on the first day", async () => {
  const date = new Date("2026-11-01T01:00:00Z");
  const snapshot = await read([row("chat_messages", "2026-11-01", 2), row("contract_analyses", "2026-11-01", 1)], date);
  assert.equal(usageDisplay(snapshot, "chat_messages", 5, date).used, 2);
  assert.equal(usageDisplay(snapshot, "contract_analyses", 10, date).used, 1);
});
test("upgrade uses the verified plan limit instead of the counter's old Free limit", async () => {
  const snapshot = await read([row("chat_messages", "2026-10-23", 5, 5)]);
  assert.deepEqual(usageDisplay(snapshot, "chat_messages", 50, now), { used: 5, limit: 50, remaining: 45 });
});
test("expired Plus uses Free limits and never displays negative remaining usage", async () => {
  const snapshot = await read([row("chat_messages", "2026-10-23", 20, 50)]);
  assert.deepEqual(usageDisplay(snapshot, "chat_messages", 5, now), { used: 20, limit: 5, remaining: 0 });
});
test("unverified entitlement and loading state never claim numerical allowance", async () => {
  const snapshot = await read([]);
  assert.equal(usageDisplay(snapshot, "chat_messages", null, now), null);
  assert.equal(usageDisplay({ ...snapshot, state: "loading" }, "chat_messages", 5, now), null);
});
test("malformed or duplicate current-period counters fail closed", async () => {
  for (const data of [null, {}, [null], [row("chat_messages", "2026-10-23", -1)],
    [row("chat_messages", "2026-10-23", "3")], [row("chat_messages", "2026-10-23", 1), row("chat_messages", "2026-10-23", 2)]]) {
    assert.equal((await read(data)).state, "unavailable");
  }
});
test("yesterday's snapshot is unavailable for chat but remains valid for this month's documents", async () => {
  const snapshot = await read([row("chat_messages", "2026-10-23", 2), row("contract_analyses", "2026-10-01", 1)]);
  const tomorrow = new Date("2026-10-24T00:00:00Z");
  assert.equal(usageDisplay(snapshot, "chat_messages", 5, tomorrow), null);
  assert.equal(usageDisplay(snapshot, "contract_analyses", 1, tomorrow).used, 1);
});
test("empty snapshots also expire at the period boundary", async () => {
  const snapshot = await read([]);
  assert.equal(usageDisplay(snapshot, "contract_analyses", 1, new Date("2026-11-01T00:00:00Z")), null);
});
test("periods use UTC across local dates and year boundaries", () => {
  assert.deepEqual(usagePeriods(new Date("2026-12-31T23:30:00-03:00")), { daily: "2027-01-01", monthly: "2027-01-01" });
});
