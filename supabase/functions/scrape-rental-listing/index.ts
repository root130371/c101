type ScrapeRentalListingRequest = {
  url?: string;
};

type ExtractedListing = {
  address: string | null;
  building_age: number | null;
  city: string;
  deposit: number | null;
  description: string | null;
  district: string;
  floor: string | null;
  heating: string | null;
  image_urls: string[];
  neighborhood: string | null;
  proof: string | null;
  raw_json: Record<string, unknown>;
  rent: number;
  rooms: string | null;
  size: number | null;
  source: string;
  source_url: string;
  title: string;
};

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS"
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json({ error: "Supabase function environment is incomplete." }, 500);
  }

  let body: ScrapeRentalListingRequest;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const sourceUrl = normalizeUrl(body.url);
  if (!sourceUrl) return json({ error: "Missing or invalid URL." }, 400);

  const authHeader = request.headers.get("authorization") || "";
  const user = await getUser(supabaseUrl, anonKey, authHeader);
  if (!user?.id) return json({ error: "Authentication required" }, 401);

  const isAdmin = await userIsAdmin(supabaseUrl, serviceRoleKey, user.id);
  if (!isAdmin) return json({ error: "Admin role required." }, 403);

  try {
    const existing = await findExistingImport(supabaseUrl, serviceRoleKey, sourceUrl);
    if (existing) return json({ item: existing, duplicate: true });
    await assertRobotsAllowed(sourceUrl);
    const html = await fetchListingHtml(sourceUrl);
    const extracted = extractListing(sourceUrl, html);
    const item = await insertRentalImport(supabaseUrl, serviceRoleKey, {
      ...extracted,
      created_by: user.id,
      status: "pending"
    });
    return json({ item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Listing fetch failed.";
    return json({ error: message }, 502);
  }
});

function normalizeUrl(input: unknown) {
  const raw = String(input || "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function getUser(supabaseUrl: string, anonKey: string, authHeader: string) {
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      authorization: authHeader
    }
  });
  if (!response.ok) return null;
  return await response.json();
}

async function userIsAdmin(supabaseUrl: string, serviceRoleKey: string, userId: string) {
  const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=role&limit=1`;
  const response = await fetch(url, { headers: serviceHeaders(serviceRoleKey) });
  if (!response.ok) return false;
  const rows = await response.json();
  return rows?.[0]?.role === "admin";
}

async function fetchListingHtml(url: string) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "accept-language": "tr-TR,tr;q=0.9,en;q=0.6",
      "cache-control": "no-cache",
      "upgrade-insecure-requests": "1",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    }
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const title = titleTag(body);
    const detail = title ? ` Page title: ${trimTo(title, 120)}` : "";
    if (host.includes("sahibinden.com") && [401, 403, 406, 429].includes(response.status)) {
      throw new Error(`Sahibinden blocked the server-side fetch with HTTP ${response.status}.${detail} This is an access block, not an app parsing error. Use manual paste import for this listing, or add a browser-assisted import flow.`);
    }
    throw new Error(`Listing URL returned HTTP ${response.status}.${detail}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
    throw new Error("Listing URL did not return HTML.");
  }

  const html = await response.text();
  if (html.length < 200) throw new Error("Listing page was too small to parse.");
  if (html.length > 2_000_000) return html.slice(0, 2_000_000);
  return html;
}

async function assertRobotsAllowed(url: string) {
  const parsed = new URL(url);
  const robotsUrl = `${parsed.origin}/robots.txt`;
  try {
    const response = await fetch(robotsUrl, {
      headers: {
        "user-agent": "KiraciKalkaniListingImporter/0.1"
      }
    });
    if (!response.ok) return;
    const robots = await response.text();
    if (!robotsAllowsPath(robots, parsed.pathname || "/")) {
      throw new Error("This site's robots.txt disallows fetching that listing path.");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("robots.txt disallows")) throw error;
  }
}

function robotsAllowsPath(robots: string, path: string) {
  const lines = robots.split(/\r?\n/);
  let applies = false;
  let allowMatch = "";
  let disallowMatch = "";

  for (const rawLine of lines) {
    const line = rawLine.replace(/#.*/, "").trim();
    if (!line) continue;
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (key === "user-agent") {
      const agent = value.toLowerCase();
      applies = agent === "*" || agent.includes("kiracikalkani");
      continue;
    }
    if (!applies) continue;
    if (key === "allow" && path.startsWith(value) && value.length > allowMatch.length) {
      allowMatch = value;
    }
    if (key === "disallow" && value && path.startsWith(value) && value.length > disallowMatch.length) {
      disallowMatch = value;
    }
  }

  if (!disallowMatch) return true;
  return allowMatch.length >= disallowMatch.length;
}

function extractListing(sourceUrl: string, html: string): ExtractedListing {
  const host = new URL(sourceUrl).hostname.replace(/^www\./, "");
  if (host.includes("sahibinden.com")) {
    return extractSahibindenListing(sourceUrl, html);
  }

  const jsonLd = extractJsonLdObjects(html);
  const bestJson = jsonLd.find((item) => looksLikeListing(item)) || jsonLd[0] || {};
  const title =
    textFromJson(bestJson, ["name", "headline"]) ||
    metaContent(html, "property", "og:title") ||
    titleTag(html) ||
    "Imported rental listing";
  const description =
    textFromJson(bestJson, ["description"]) ||
    metaContent(html, "property", "og:description") ||
    metaContent(html, "name", "description");
  const combinedText = stripHtml(`${title}\n${description || ""}\n${html.slice(0, 120_000)}`);
  const rent = numberFromJson(bestJson, ["price", "rent", "lowPrice"]) || extractRent(combinedText);
  if (!rent) throw new Error("Could not detect listing rent/price.");

  const images = imageUrlsFromJson(bestJson).concat(metaContent(html, "property", "og:image") || []);
  const area = numberFromJson(bestJson, ["floorSize", "size", "area"]) || extractArea(combinedText);
  const addressText = addressFromJson(bestJson);
  const location = extractLocation(combinedText, addressText);

  return {
    address: addressText,
    building_age: extractLabelNumber(combinedText, ["bina yaşı", "bina yasi", "building age"]),
    city: location.city || "İzmir",
    deposit: extractLabelNumber(combinedText, ["depozito", "deposit"]),
    description: trimTo(description, 1200),
    district: location.district || "Narlıdere",
    floor: extractLabelText(combinedText, ["bulunduğu kat", "bulundugu kat", "kat", "floor"]),
    heating: extractLabelText(combinedText, ["ısıtma", "isitma", "heating"]),
    image_urls: uniqueStrings(images).slice(0, 8),
    neighborhood: location.neighborhood,
    proof: sourceUrl,
    raw_json: {
      json_ld_count: jsonLd.length,
      json_ld_sample: bestJson,
      parser: "generic_meta_jsonld_v1",
      parsed_at: new Date().toISOString()
    },
    rent,
    rooms: extractRooms(combinedText),
    size: area,
    source: host,
    source_url: sourceUrl,
    title: trimTo(stripHtml(title), 180) || "Imported rental listing"
  };
}

function extractSahibindenListing(sourceUrl: string, html: string): ExtractedListing {
  const host = new URL(sourceUrl).hostname.replace(/^www\./, "");
  const title =
    textBetween(html, /<h1[^>]*class=["'][^"']*classifiedTitle[^"']*["'][^>]*>/i, /<\/h1>/i) ||
    metaContent(html, "property", "og:title") ||
    titleTag(html) ||
    "Sahibinden rental listing";
  const description =
    textBetween(html, /<div[^>]*id=["']classifiedDescription["'][^>]*>/i, /<\/div>/i) ||
    metaContent(html, "property", "og:description") ||
    metaContent(html, "name", "description");
  const combinedText = stripHtml(`${title}\n${description || ""}\n${html.slice(0, 160_000)}`);
  const details = extractSahibindenDetails(html);
  const rent = extractSahibindenPrice(html) || extractRent(combinedText);
  if (!rent) throw new Error("Could not detect Sahibinden listing rent/price.");

  const location = extractSahibindenLocation(html, combinedText);
  const images = extractSahibindenImages(html).concat(metaContent(html, "property", "og:image") || []);

  return {
    address: location.address,
    building_age: numericValue(details["Bina Yaşı"] || details["Bina Yasi"] || details["Building Age"]),
    city: location.city || "Ä°zmir",
    deposit: extractLabelNumber(combinedText, ["depozito", "deposit"]),
    description: trimTo(description, 1200),
    district: location.district || "NarlÄ±dere",
    floor: details["Bulunduğu Kat"] || details["Bulundugu Kat"] || details["Kat"] || null,
    heating: details["Isıtma"] || details["Isitma"] || null,
    image_urls: uniqueStrings(images).slice(0, 8),
    neighborhood: location.neighborhood,
    proof: sourceUrl,
    raw_json: {
      details,
      parser: "sahibinden_listing_v1",
      parsed_at: new Date().toISOString()
    },
    rent,
    rooms: details["Oda Sayısı"] || details["Oda Sayisi"] || extractRooms(combinedText),
    size: numericValue(details["m² (Brüt)"] || details["m2 (Brüt)"] || details["m² (Net)"] || details["m2 (Net)"]) || extractArea(combinedText),
    source: host,
    source_url: sourceUrl,
    title: trimTo(stripHtml(title), 180) || "Sahibinden rental listing"
  };
}

function extractSahibindenPrice(html: string) {
  const priceBlock =
    textBetween(html, /<div[^>]*class=["'][^"']*classifiedInfo[^"']*["'][^>]*>/i, /<\/div>/i) ||
    textBetween(html, /<h3[^>]*class=["'][^"']*classifiedInfo[^"']*["'][^>]*>/i, /<\/h3>/i) ||
    "";
  return extractRent(stripHtml(priceBlock)) || extractRent(stripHtml(html.slice(0, 80_000)));
}

function extractSahibindenDetails(html: string) {
  const details: Record<string, string> = {};
  const listMatch = /<ul[^>]*class=["'][^"']*classifiedInfoList[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i.exec(html);
  const source = listMatch?.[1] || html.slice(0, 160_000);
  const itemRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  for (const match of source.matchAll(itemRegex)) {
    const raw = match[1];
    const strong = textBetween(raw, /<strong[^>]*>/i, /<\/strong>/i);
    const span = textBetween(raw, /<span[^>]*>/i, /<\/span>/i);
    const key = stripHtml(strong || "").replace(/\s+/g, " ").trim();
    const value = stripHtml(span || raw.replace(/<strong[\s\S]*?<\/strong>/i, "")).replace(/\s+/g, " ").trim();
    if (key && value) details[key] = value;
  }
  return details;
}

function extractSahibindenLocation(html: string, text: string) {
  const locationBlock =
    textBetween(html, /<div[^>]*class=["'][^"']*classifiedInfo[^"']*["'][^>]*>/i, /<\/div>/i) ||
    textBetween(html, /<h2[^>]*>/i, /<\/h2>/i) ||
    "";
  const crumbs = Array.from(locationBlock.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi))
    .map((match) => stripHtml(match[1]))
    .filter(Boolean);
  const knownCities = ["İstanbul", "Istanbul", "İzmir", "Izmir", "Ankara", "Antalya", "Bursa", "Muğla", "Mugla"];
  const cityIndex = crumbs.findIndex((item) => knownCities.some((city) => city.toLowerCase() === item.toLowerCase()));
  const city = cityIndex >= 0 ? crumbs[cityIndex] : extractLocation(text, null).city;
  const district = cityIndex >= 0 ? crumbs[cityIndex + 1] || null : extractLocation(text, null).district;
  const neighborhood = cityIndex >= 0 ? crumbs[cityIndex + 2] || null : extractLocation(text, null).neighborhood;
  const address = [neighborhood, district, city].filter(Boolean).join(", ") || null;
  return { address, city, district, neighborhood };
}

function extractSahibindenImages(html: string) {
  const urls = Array.from(html.matchAll(/(?:data-src|src)=["'](https?:\/\/[^"']+sahibinden\.com[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi))
    .map((match) => decodeEntities(match[1]));
  return urls;
}

function extractJsonLdObjects(html: string) {
  const matches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  const items: Record<string, unknown>[] = [];
  for (const match of matches) {
    try {
      const parsed = JSON.parse(decodeEntities(match[1].trim()));
      const array = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of array) {
        if (item && typeof item === "object") items.push(item as Record<string, unknown>);
        const graph = (item as Record<string, unknown>)?.["@graph"];
        if (Array.isArray(graph)) {
          for (const graphItem of graph) {
            if (graphItem && typeof graphItem === "object") items.push(graphItem as Record<string, unknown>);
          }
        }
      }
    } catch {
      // Ignore invalid JSON-LD blocks.
    }
  }
  return items;
}

function looksLikeListing(item: Record<string, unknown>) {
  const type = String(item["@type"] || "").toLowerCase();
  return /apartment|house|residence|realestate|offer|product|listing/.test(type);
}

function textFromJson(item: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (value && typeof value === "object") {
      const nested = value as Record<string, unknown>;
      if (typeof nested.name === "string") return nested.name.trim();
      if (typeof nested.value === "string") return nested.value.trim();
    }
  }
  const offers = item.offers as Record<string, unknown> | undefined;
  if (offers) return textFromJson(offers, keys);
  return null;
}

function numberFromJson(item: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = item[key];
    const parsed = numericValue(value);
    if (parsed) return parsed;
    if (value && typeof value === "object") {
      const nested = value as Record<string, unknown>;
      const nestedParsed = numericValue(nested.value || nested.price);
      if (nestedParsed) return nestedParsed;
    }
  }
  const offers = item.offers as Record<string, unknown> | undefined;
  if (offers) return numberFromJson(offers, keys);
  return null;
}

function imageUrlsFromJson(item: Record<string, unknown>) {
  const raw = item.image || item.images || item.photo;
  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return values
    .map((value) => typeof value === "string" ? value : (value as Record<string, unknown>)?.url)
    .filter((value): value is string => typeof value === "string" && value.startsWith("http"));
}

function addressFromJson(item: Record<string, unknown>) {
  const raw = item.address;
  if (typeof raw === "string") return raw.trim();
  if (raw && typeof raw === "object") {
    const address = raw as Record<string, unknown>;
    return [
      address.streetAddress,
      address.addressLocality,
      address.addressRegion,
      address.addressCountry
    ].map((part) => typeof part === "string" ? part.trim() : "").filter(Boolean).join(", ") || null;
  }
  return null;
}

function metaContent(html: string, attr: "name" | "property", key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`<meta[^>]+${attr}=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
  return decodeEntities(regex.exec(html)?.[1] || "").trim() || null;
}

function titleTag(html: string) {
  return decodeEntities(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] || "").trim() || null;
}

function extractRent(text: string) {
  const patterns = [
    /([\d.,]{4,12})\s*(?:tl|try|₺)\b/i,
    /(?:tl|try|₺)\s*([\d.,]{4,12})\b/i,
    /(?:kira|fiyat|price)[^\d]{0,20}([\d.,]{4,12})/i
  ];
  for (const pattern of patterns) {
    const value = numericValue(pattern.exec(text)?.[1]);
    if (value && value >= 1000) return value;
  }
  return null;
}

function extractArea(text: string) {
  const patterns = [
    /([\d.,]{2,5})\s*(?:m2|m²|metrekare)\b/i,
    /(?:brüt|brut|net|alan)[^\d]{0,20}([\d.,]{2,5})/i
  ];
  for (const pattern of patterns) {
    const value = numericValue(pattern.exec(text)?.[1]);
    if (value && value >= 10 && value <= 1000) return value;
  }
  return null;
}

function extractRooms(text: string) {
  return /\b(\d+\s*\+\s*\d+)\b/.exec(text)?.[1]?.replace(/\s+/g, "") || null;
}

function extractLocation(text: string, address: string | null) {
  const combined = `${address || ""}\n${text}`;
  const knownCities = ["İstanbul", "Istanbul", "İzmir", "Izmir", "Ankara", "Antalya", "Bursa", "Muğla", "Mugla"];
  const city = knownCities.find((item) => new RegExp(`\\b${item}\\b`, "i").test(combined)) || null;
  const districtMatch = /(?:ilçe|ilce|district)\s*[:\-]?\s*([A-Za-zÇĞİÖŞÜçğıöşü\s]{3,40})/i.exec(combined);
  const neighborhoodMatch = /([A-Za-zÇĞİÖŞÜçğıöşü\s]{3,40})\s+(?:mah\.|mahallesi)/i.exec(combined);
  return {
    city,
    district: districtMatch?.[1]?.trim() || null,
    neighborhood: neighborhoodMatch?.[1]?.trim() || null
  };
}

function extractLabelNumber(text: string, labels: string[]) {
  for (const label of labels) {
    const match = new RegExp(`${label}\\s*[:\\-]?\\s*([\\d.,]+)`, "i").exec(text);
    const value = numericValue(match?.[1]);
    if (value) return value;
  }
  return null;
}

function extractLabelText(text: string, labels: string[]) {
  for (const label of labels) {
    const match = new RegExp(`${label}\\s*[:\\-]?\\s*([^\\n|,]{2,60})`, "i").exec(text);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function numericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  const raw = String(value || "").trim();
  if (!raw) return null;
  const normalized = raw
    .replace(/[^\d.,]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

async function insertRentalImport(supabaseUrl: string, serviceRoleKey: string, payload: Record<string, unknown>) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rental_imports?select=*`, {
    method: "POST",
    headers: serviceHeaders(serviceRoleKey, true),
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Rental import save failed: ${await response.text()}`);
  const rows = await response.json();
  return rows?.[0];
}

async function findExistingImport(supabaseUrl: string, serviceRoleKey: string, sourceUrl: string) {
  const url = `${supabaseUrl}/rest/v1/rental_imports?source_url=eq.${encodeURIComponent(sourceUrl)}&select=*&limit=1`;
  const response = await fetch(url, { headers: serviceHeaders(serviceRoleKey) });
  if (!response.ok) return null;
  const rows = await response.json();
  return rows?.[0] || null;
}

function serviceHeaders(serviceRoleKey: string, preferRepresentation = false) {
  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
    ...(preferRepresentation ? { prefer: "return=representation" } : {})
  };
}

function stripHtml(value: string) {
  return decodeEntities(value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function textBetween(value: string, start: RegExp, end: RegExp) {
  const startMatch = start.exec(value);
  if (!startMatch?.index && startMatch?.index !== 0) return null;
  const from = startMatch.index + startMatch[0].length;
  const rest = value.slice(from);
  const endMatch = end.exec(rest);
  if (!endMatch?.index && endMatch?.index !== 0) return null;
  return decodeEntities(rest.slice(0, endMatch.index)).trim() || null;
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function uniqueStrings(values: (string | null | undefined)[]) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function trimTo(value: string | null, max: number) {
  if (!value) return null;
  const clean = stripHtml(value);
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json; charset=utf-8"
    }
  });
}
