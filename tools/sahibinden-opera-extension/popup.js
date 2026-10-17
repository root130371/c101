const nodes = {
  batchCount: document.getElementById("batchCount"),
  clearAll: document.getElementById("clearAll"),
  clearBatch: document.getElementById("clearBatch"),
  copyJson: document.getElementById("copyJson"),
  extract: document.getElementById("extract"),
  extractNext: document.getElementById("extractNext"),
  openNext: document.getElementById("openNext"),
  preview: document.getElementById("preview"),
  queueCount: document.getElementById("queueCount"),
  saveQueue: document.getElementById("saveQueue"),
  status: document.getElementById("status"),
  urls: document.getElementById("urls"),
};

function send(message) {
  return chrome.runtime.sendMessage(message);
}

function setStatus(message) {
  nodes.status.textContent = message;
}

function render(state) {
  nodes.queueCount.textContent = String(state.queue?.length || 0);
  nodes.batchCount.textContent = String(state.batch?.length || 0);
  nodes.preview.textContent = state.batch?.length
    ? JSON.stringify(state.batch.slice(-3), null, 2)
    : "Henüz ilan yok.";
}

async function refresh() {
  const state = await send({ type: "get-state" });
  if (state.error) {
    setStatus(state.error);
    return;
  }
  render(state);
}

async function run(action, success) {
  setStatus("Çalışıyor...");
  const state = await action();
  if (state.error) {
    setStatus(state.error);
    return;
  }
  render(state);
  setStatus(success);
}

nodes.saveQueue.addEventListener("click", () => {
  run(
    () => send({ type: "save-queue", urls: nodes.urls.value }),
    "Kuyruk kaydedildi",
  );
});

nodes.openNext.addEventListener("click", () => {
  run(
    () => send({ type: "open-next" }),
    "Sonraki açıldı",
  );
});

nodes.extract.addEventListener("click", () => {
  run(
    () => send({ type: "extract-active" }),
    "İlan alındı",
  );
});

nodes.extractNext.addEventListener("click", () => {
  run(
    () => send({ type: "extract-active-and-next" }),
    "İlan alındı, sonraki açıldı",
  );
});

nodes.copyJson.addEventListener("click", async () => {
  const state = await send({ type: "get-state" });
  if (state.error) {
    setStatus(state.error);
    return;
  }
  await navigator.clipboard.writeText(JSON.stringify(state.batch || [], null, 2));
  setStatus("JSON kopyalandı");
});

nodes.clearBatch.addEventListener("click", () => {
  run(
    () => send({ type: "clear-batch" }),
    "Batch temizlendi",
  );
});

nodes.clearAll.addEventListener("click", () => {
  run(
    () => send({ type: "clear-all" }),
    "Temizlendi",
  );
});

refresh();
