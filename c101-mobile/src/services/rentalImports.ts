import { supabase, supabaseAnonKey, supabaseUrl } from "../lib/supabase";
import { safeNumber } from "./rentCalculator";

export type RentalImportStatus = "approved" | "pending" | "rejected";

export type RentalImportDraft = {
  address?: string | null;
  building_age?: number | null;
  city?: string;
  deposit?: number | null;
  description?: string | null;
  district?: string;
  floor?: string | null;
  heating?: string | null;
  image_urls?: string[];
  neighborhood?: string | null;
  proof?: string | null;
  raw_json?: Record<string, unknown>;
  rent: number;
  rooms?: string | null;
  size?: number | null;
  source?: string | null;
  source_url?: string | null;
  title: string;
};

export type RentalImportItem = RentalImportDraft & {
  approved_listing_id: string | null;
  created_at: string;
  id: string;
  status: RentalImportStatus;
};

const DEFAULT_CITY = "İzmir";
const DEFAULT_DISTRICT = "Narlıdere";

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();
}

function optionalText(value: unknown) {
  const clean = cleanText(value);
  return clean ? clean : null;
}

function numericOrNull(value: unknown) {
  const raw = cleanText(value)
    .replace(/[^\d.,]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const parsed = safeNumber(raw);
  return parsed > 0 ? parsed : null;
}

function normalizeHeader(header: string) {
  const clean = cleanText(header).toLowerCase();
  const aliases: Record<string, string> = {
    "açıklama": "description",
    "adres": "address",
    "alan": "size",
    "baslik": "title",
    "başlık": "title",
    "depozito": "deposit",
    "fiyat": "rent",
    "il": "city",
    "ilçe": "district",
    "ilce": "district",
    "ilan": "title",
    "ilan linki": "source_url",
    "ilan url": "source_url",
    "kira": "rent",
    "kaynak": "source",
    "link": "source_url",
    "mahalle": "neighborhood",
    "m2": "size",
    "metrekare": "size",
    "oda": "rooms",
    "url": "source_url",
  };
  return aliases[clean] || clean.replace(/\s+/g, "_");
}

function parseDelimitedLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if ((char === "," || char === "\t" || char === ";") && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

export function parseRentalImportText(input: string): RentalImportDraft[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    return rows.map(normalizeDraft).filter(Boolean) as RentalImportDraft[];
  } catch {
    // Fall back to CSV/TSV-style parsing.
  }

  const lines = trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];

  const headers = parseDelimitedLine(lines[0]).map(normalizeHeader);
  const hasHeader = headers.some((header) => ["title", "rent", "price", "district", "source_url"].includes(header));
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines
    .map((line) => {
      const cells = parseDelimitedLine(line);
      const row: Record<string, unknown> = {};
      if (hasHeader) {
        headers.forEach((header, index) => {
          row[header] = cells[index];
        });
      } else {
        [
          "title",
          "rent",
          "size",
          "city",
          "district",
          "neighborhood",
          "address",
          "source",
          "source_url",
          "description",
        ].forEach((header, index) => {
          row[header] = cells[index];
        });
      }
      return normalizeDraft(row);
    })
    .filter(Boolean) as RentalImportDraft[];
}

export function parseSahibindenBrowserText(input: string, sourceUrl: string): RentalImportDraft[] {
  const raw = cleanText(input);
  if (!raw) return [];

  const directRows = parseRentalImportText(raw);
  if (directRows.length) return directRows;

  const plain = stripHtml(raw)
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const lines = plain.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const compact = lines.join("\n");
  const rent = firstNumber([
    /([\d.,]{4,12})\s*(?:TL|TRY|₺)/i,
    /(?:Fiyat|Kira|Price)[^\d]{0,40}([\d.,]{4,12})/i,
  ], compact);
  if (!rent) return [];

  const details = labelMap(compact);
  const location = detectLocation(compact);
  const title = detectTitle(lines, rent) || details["baslik"] || "Sahibinden kira ilani";
  const size = numberFromDetails(details, ["m2 brut", "m2 net", "metrekare", "alan"]) || firstNumber([
    /m\s*[²2]\s*\(Brüt\)\s*([\d.,]{2,5})/i,
    /m\s*[²2]\s*\(Net\)\s*([\d.,]{2,5})/i,
    /([\d.,]{2,5})\s*m\s*[²2]/i,
  ], compact);

  return [
    {
      address: location.address,
      building_age: numberFromDetails(details, ["bina yasi", "bina yaşı"]),
      city: location.city || DEFAULT_CITY,
      deposit: numberFromDetails(details, ["depozito"]),
      description: trimText(detectDescription(compact), 1200),
      district: location.district || DEFAULT_DISTRICT,
      floor: details["bulundugu kat"] || details["bulunduğu kat"] || details["kat"] || null,
      heating: details["isitma"] || details["ısıtma"] || null,
      image_urls: [],
      neighborhood: location.neighborhood,
      proof: optionalText(sourceUrl),
      raw_json: {
        parser: "sahibinden_browser_text_v1",
        source_url: sourceUrl,
        text_sample: trimText(compact, 1500),
      },
      rent,
      rooms: details["oda sayisi"] || details["oda sayısı"] || /\b(\d+\s*\+\s*\d+)\b/.exec(compact)?.[1]?.replace(/\s+/g, "") || null,
      size,
      source: "sahibinden.com",
      source_url: optionalText(sourceUrl),
      title,
    },
  ];
}

function normalizeDraft(row: Record<string, unknown>) {
  const title = cleanText(row.title || row.baslik || row.name);
  const rent = numericOrNull(row.rent || row.price || row.kira || row.fiyat);
  if (!title || !rent) return null;

  const rawImages = row.image_urls || row.images || row.photos;
  const imageUrls = Array.isArray(rawImages)
    ? rawImages.map(cleanText).filter(Boolean)
    : cleanText(rawImages).split(/[|,]/).map((url) => url.trim()).filter(Boolean);

  return {
    address: optionalText(row.address || row.adres),
    building_age: numericOrNull(row.building_age || row.age || row.bina_yasi),
    city: cleanText(row.city || row.il) || DEFAULT_CITY,
    deposit: numericOrNull(row.deposit || row.depozito),
    description: optionalText(row.description || row.aciklama),
    district: cleanText(row.district || row.ilce) || DEFAULT_DISTRICT,
    floor: optionalText(row.floor || row.kat),
    heating: optionalText(row.heating || row.isitma),
    image_urls: imageUrls,
    neighborhood: optionalText(row.neighborhood || row.mahalle),
    proof: optionalText(row.proof || row.kanit),
    raw_json: row,
    rent,
    rooms: optionalText(row.rooms || row.oda),
    size: numericOrNull(row.size || row.m2 || row.area),
    source: optionalText(row.source || row.kaynak),
    source_url: optionalText(row.source_url || row.url || row.link),
    title,
  } satisfies RentalImportDraft;
}

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function trimText(value: string | null, max: number) {
  if (!value) return null;
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}...` : clean;
}

function firstNumber(patterns: RegExp[], text: string) {
  for (const pattern of patterns) {
    const value = numericOrNull(pattern.exec(text)?.[1]);
    if (value) return value;
  }
  return null;
}

function simplifyKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[ıİ]/g, "i")
    .replace(/[şŞ]/g, "s")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c")
    .replace(/²/g, "2")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function labelMap(text: string) {
  const details: Record<string, string> = {};
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const knownLabels = [
    "m2 brut",
    "m2 net",
    "oda sayisi",
    "bina yasi",
    "bulundugu kat",
    "isitma",
    "depozito",
    "kat sayisi",
    "site icerisinde",
  ];

  for (let index = 0; index < lines.length; index += 1) {
    const key = simplifyKey(lines[index]);
    if (knownLabels.includes(key) && lines[index + 1]) {
      details[key] = lines[index + 1].trim();
    }
    const inline = /^(.*?):\s*(.+)$/.exec(lines[index]);
    if (inline) details[simplifyKey(inline[1])] = inline[2].trim();
  }
  return details;
}

function numberFromDetails(details: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = numericOrNull(details[simplifyKey(key)]);
    if (value) return value;
  }
  return null;
}

function detectTitle(lines: string[], rent: number) {
  const rentText = String(rent);
  const skip = /sahibinden|favori|mesaj|ara|harita|ilan no|detay|emlak|konut|kiralik|satilik/i;
  const candidates = lines
    .filter((line) => line.length >= 12 && line.length <= 160)
    .filter((line) => !line.replace(/\D/g, "").includes(rentText))
    .filter((line) => !skip.test(line));
  return candidates[0] || null;
}

function detectLocation(text: string) {
  const cityNames = ["Istanbul", "İstanbul", "Izmir", "İzmir", "Ankara", "Antalya", "Bursa", "Muğla", "Mugla"];
  const slashMatch = new RegExp(`(${cityNames.join("|")})\\s*[/›>]\\s*([^\\n/›>]{2,40})(?:\\s*[/›>]\\s*([^\\n/›>]{2,60}))?`, "i").exec(text);
  const city = slashMatch?.[1] || cityNames.find((name) => new RegExp(`\\b${name}\\b`, "i").test(text)) || null;
  const district = slashMatch?.[2]?.trim() || null;
  const neighborhood = slashMatch?.[3]?.replace(/\bMh\.?\b|\bMahallesi\b/gi, "").trim() || null;
  return {
    address: [neighborhood, district, city].filter(Boolean).join(", ") || null,
    city,
    district,
    neighborhood,
  };
}

function detectDescription(text: string) {
  const match = /(?:Açıklama|Aciklama|İlan Açıklaması|Ilan Aciklamasi)\s*\n([\s\S]{80,2500})/i.exec(text);
  if (!match) return null;
  return match[1].split(/\n(?:Konum|Özellikler|Ilan Bilgileri|İlan Bilgileri|Benzer)/i)[0]?.trim() || null;
}

export async function loadRentalImports() {
  const { data, error } = await supabase
    .from("rental_imports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data || []) as RentalImportItem[];
}

export async function createRentalImports(rows: RentalImportDraft[]) {
  if (!rows.length) return [];
  const { data, error } = await supabase
    .from("rental_imports")
    .insert(rows)
    .select("*");

  if (error) throw new Error(error.message);
  return (data || []) as RentalImportItem[];
}

export async function stageRentalImportFromUrl(url: string) {
  const cleanUrl = url.trim();
  if (!cleanUrl) throw new Error("Missing listing URL.");

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Please sign in as admin before fetching a listing URL.");

  const response = await fetch(`${supabaseUrl}/functions/v1/scrape-rental-listing`, {
    body: JSON.stringify({ url: cleanUrl }),
    headers: {
      apikey: supabaseAnonKey,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    method: "POST",
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(String(data?.error || `Listing fetch failed with HTTP ${response.status}.`));
  }
  if (data?.error) throw new Error(String(data.error));
  return {
    duplicate: Boolean(data?.duplicate),
    item: data?.item as RentalImportItem,
  };
}

export async function approveRentalImport(item: RentalImportItem) {
  const listingPayload = {
    address: item.address,
    building_age: item.building_age,
    city: item.city || DEFAULT_CITY,
    district: item.district || DEFAULT_DISTRICT,
    neighborhood: item.neighborhood,
    proof: item.source_url || item.proof,
    rent: item.rent,
    size: item.size,
    source: item.source || "import",
    title: item.title,
  };

  const { data: listing, error: listingError } = await supabase
    .from("rent_listings")
    .insert(listingPayload)
    .select("id")
    .single();

  if (listingError) throw new Error(listingError.message);

  const { error: updateError } = await supabase
    .from("rental_imports")
    .update({
      approved_listing_id: listing.id,
      reviewed_at: new Date().toISOString(),
      status: "approved",
    })
    .eq("id", item.id);

  if (updateError) throw new Error(updateError.message);
  return listing.id as string;
}

export async function rejectRentalImport(id: string) {
  const { error } = await supabase
    .from("rental_imports")
    .update({
      reviewed_at: new Date().toISOString(),
      status: "rejected",
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
