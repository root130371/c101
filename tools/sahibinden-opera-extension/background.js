const STORE_KEYS = {
  batch: "batch",
  queue: "queue",
  running: "running",
};

async function getState() {
  const state = await chrome.storage.local.get(STORE_KEYS);
  return {
    batch: Array.isArray(state.batch) ? state.batch : [],
    queue: Array.isArray(state.queue) ? state.queue : [],
    running: Boolean(state.running),
  };
}

async function setState(next) {
  await chrome.storage.local.set(next);
}

async function addItem(item) {
  const state = await getState();
  const batch = state.batch.filter((row) => row.source_url !== item.source_url);
  batch.push(item);
  await setState({ batch });
  return batch;
}

async function openNextQueuedUrl() {
  const state = await getState();
  if (!state.running || !state.queue.length) return null;

  const [nextUrl, ...remaining] = state.queue;
  await setState({ queue: remaining });
  const tab = await chrome.tabs.create({ active: true, url: nextUrl });
  return tab;
}

async function extractFromActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("Aktif sekme bulunamadi.");

  const response = await chrome.tabs.sendMessage(tab.id, {
    source: "c101-sahibinden-content",
    type: "extract-current-listing",
  });

  if (response?.error) throw new Error(response.error);
  if (!response?.item) throw new Error("Ilan verisi alinamadi.");
  const batch = await addItem(response.item);
  return { batch, item: response.item };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (message?.type === "get-state") {
      sendResponse(await getState());
      return;
    }

    if (message?.type === "save-queue") {
      const queue = String(message.urls || "")
        .split(/\s+/)
        .map((url) => url.trim())
        .filter((url) => /^https?:\/\/([^/]+\.)?sahibinden\.com\//i.test(url));
      await setState({ queue });
      sendResponse(await getState());
      return;
    }

    if (message?.type === "set-running") {
      await setState({ running: Boolean(message.running) });
      sendResponse(await getState());
      return;
    }

    if (message?.type === "open-next") {
      await setState({ running: true });
      const tab = await openNextQueuedUrl();
      sendResponse({ ...(await getState()), opened: Boolean(tab) });
      return;
    }

    if (message?.type === "extract-active") {
      const result = await extractFromActiveTab();
      sendResponse({ ...(await getState()), item: result.item });
      return;
    }

    if (message?.type === "extract-active-and-next") {
      const result = await extractFromActiveTab();
      const tab = await openNextQueuedUrl();
      sendResponse({ ...(await getState()), item: result.item, opened: Boolean(tab) });
      return;
    }

    if (message?.type === "clear-batch") {
      await setState({ batch: [] });
      sendResponse(await getState());
      return;
    }

    if (message?.type === "clear-all") {
      await setState({ batch: [], queue: [], running: false });
      sendResponse(await getState());
    }
  })().catch((error) => {
    sendResponse({ error: error instanceof Error ? error.message : String(error) });
  });
  return true;
});
