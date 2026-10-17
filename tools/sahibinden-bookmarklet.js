(function () {
  const STORE_KEY = "c101_sahibinden_batch";

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function numberValue(value) {
    const normalized = String(value || "")
      .replace(/[^\d.,]/g, "")
      .replace(/\.(?=\d{3}(?:\D|$))/g, "")
      .replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
  }

  function simplify(value) {
    return clean(value)
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

  function text(selector) {
    return clean(document.querySelector(selector)?.textContent);
  }

  function details() {
    const output = {};
    document.querySelectorAll(".classifiedInfoList li").forEach((item) => {
      const key = simplify(item.querySelector("strong")?.textContent);
      const value = clean(item.querySelector("span")?.textContent || item.textContent);
      if (key && value) output[key] = value;
    });
    return output;
  }

  function crumbs() {
    return Array.from(document.querySelectorAll(".classifiedInfo a, .classifiedInfo h2 a, .classifiedBreadCrumb a"))
      .map((item) => clean(item.textContent))
      .filter(Boolean);
  }

  function locationFromCrumbs(items) {
    const cities = ["istanbul", "izmir", "ankara", "antalya", "bursa", "mugla"];
    const index = items.findIndex((item) => cities.includes(simplify(item)));
    const city = index >= 0 ? items[index] : "";
    const district = index >= 0 ? items[index + 1] || "" : "";
    const neighborhood = index >= 0 ? items[index + 2] || "" : "";
    return {
      address: [neighborhood, district, city].filter(Boolean).join(", "),
      city,
      district,
      neighborhood,
    };
  }

  function firstNumber(values) {
    for (const value of values) {
      const parsed = numberValue(value);
      if (parsed) return parsed;
    }
    return null;
  }

  async function copy(value) {
    await navigator.clipboard.writeText(value);
  }

  const info = details();
  const pageText = document.body.innerText || "";
  const loc = locationFromCrumbs(crumbs());
  const title = text(".classifiedTitle") || text("h1") || document.title || "Sahibinden kira ilani";
  const rent = firstNumber([
    text(".classifiedInfo h3"),
    text(".classified-price-container"),
    /([\d.,]{4,12})\s*(?:TL|TRY|₺)/i.exec(pageText)?.[1],
  ]);

  if (!rent) {
    alert("C101: Bu sayfada kira/fiyat algilanamadi.");
    return;
  }

  const item = {
    address: loc.address || null,
    building_age: numberValue(info["bina yasi"]),
    city: loc.city || "İzmir",
    deposit: numberValue(info.depozito),
    description: clean(document.querySelector("#classifiedDescription")?.textContent).slice(0, 1200) || null,
    district: loc.district || "Narlıdere",
    floor: info["bulundugu kat"] || info.kat || null,
    heating: info.isitma || null,
    image_urls: Array.from(document.querySelectorAll("img"))
      .map((image) => image.currentSrc || image.src)
      .filter((src) => /sahibinden\.com/.test(src))
      .slice(0, 8),
    neighborhood: loc.neighborhood || null,
    proof: location.href,
    raw_json: {
      parser: "sahibinden_bookmarklet_v1",
      captured_at: new Date().toISOString(),
    },
    rent,
    rooms: info["oda sayisi"] || /\b(\d+\s*\+\s*\d+)\b/.exec(pageText)?.[1] || null,
    size: firstNumber([info["m2 brut"], info["m2 net"], /([\d.,]{2,5})\s*m\s*[²2]/i.exec(pageText)?.[1]]),
    source: "sahibinden.com",
    source_url: location.href,
    title,
  };

  const existing = JSON.parse(localStorage.getItem(STORE_KEY) || "[]").filter((row) => row.source_url !== item.source_url);
  existing.push(item);
  localStorage.setItem(STORE_KEY, JSON.stringify(existing));

  const choice = confirm(`C101: ${existing.length} ilan toplandi.\n\nTamam = batch JSON kopyala\nIptal = sadece kaydet, sonra devam et`);
  if (choice) {
    copy(JSON.stringify(existing, null, 2))
      .then(() => {
        if (confirm("C101: Batch JSON kopyalandi. Kopyalanan batch temizlensin mi?")) {
          localStorage.removeItem(STORE_KEY);
        }
      })
      .catch(() => alert("C101: Kopyalama basarisiz. Tarayici pano iznini kontrol et."));
  } else {
    alert("C101: Ilan kaydedildi. Diger ilanlarda bookmarklet'i tekrar calistir.");
  }
})();
