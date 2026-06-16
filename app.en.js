const MAX_FILES = 10;
const SOFT_MAX_SIDE = 4096;
const HARD_MAX_SIDE = 8192;
const SOFT_FILE_MB = 20;
const HARD_PIXELS = 67_000_000;
const SOFT_TOTAL_PIXELS = 60_000_000;
const HARD_TOTAL_PIXELS = 200_000_000;
const ALIGN_TOOL_URL = "https://zxc02621948-sketch.github.io/ai-sprite-align-tool/";
const BRIDGE_DB_NAME = "gameAssetToolBridge";
const BRIDGE_STORE_NAME = "assets";

const state = {
  items: [],
  selectedId: null,
  view: "result",
  renderToken: 0,
  busy: false,
  lastPreview: null,
};

const el = {
  fileInput: document.getElementById("fileInput"),
  exportCurrent: document.getElementById("exportCurrent"),
  exportZip: document.getElementById("exportZip"),
  countStat: document.getElementById("countStat"),
  maxSizeStat: document.getElementById("maxSizeStat"),
  pixelStat: document.getElementById("pixelStat"),
  riskStat: document.getElementById("riskStat"),
  riskPanel: document.getElementById("riskPanel"),
  dropZone: document.getElementById("dropZone"),
  thumbList: document.getElementById("thumbList"),
  clearAll: document.getElementById("clearAll"),
  previewTitle: document.getElementById("previewTitle"),
  previewCanvas: document.getElementById("previewCanvas"),
  canvasWrap: document.getElementById("canvasWrap"),
  previewBg: document.getElementById("previewBg"),
  lowMemory: document.getElementById("lowMemory"),
  message: document.getElementById("message"),
  sendToAlign: document.getElementById("sendToAlign"),
  mode: document.getElementById("mode"),
  customColor: document.getElementById("customColor"),
  sampleCorner: document.getElementById("sampleCorner"),
  resetSettings: document.getElementById("resetSettings"),
  regionTool: document.getElementById("regionTool"),
  selectMode: document.getElementById("selectMode"),
  regionTolerance: document.getElementById("regionTolerance"),
  autoDarkCleanup: document.getElementById("autoDarkCleanup"),
  darkThreshold: document.getElementById("darkThreshold"),
  darkIslandMax: document.getElementById("darkIslandMax"),
  smartEdgeCleanup: document.getElementById("smartEdgeCleanup"),
  edgeCleanupStrength: document.getElementById("edgeCleanupStrength"),
  regionSummary: document.getElementById("regionSummary"),
  undoRegion: document.getElementById("undoRegion"),
  clearRegions: document.getElementById("clearRegions"),
  alphaMode: document.getElementById("alphaMode"),
  exposure: document.getElementById("exposure"),
  gamma: document.getElementById("gamma"),
  blackPoint: document.getElementById("blackPoint"),
  whitePoint: document.getElementById("whitePoint"),
  alphaStrength: document.getElementById("alphaStrength"),
  interiorCleanup: document.getElementById("interiorCleanup"),
  solidProtect: document.getElementById("solidProtect"),
  feather: document.getElementById("feather"),
  tolerance: document.getElementById("tolerance"),
  despill: document.getElementById("despill"),
};

const sliderIds = [
  "exposure",
  "gamma",
  "blackPoint",
  "whitePoint",
  "alphaStrength",
  "interiorCleanup",
  "solidProtect",
  "regionTolerance",
  "darkThreshold",
  "darkIslandMax",
  "edgeCleanupStrength",
  "feather",
  "tolerance",
  "despill",
];

const presets = {
  blackFx: {
    mode: "black",
    alphaMode: "mixed",
    exposure: 0.15,
    gamma: 1,
    blackPoint: 0.01,
    whitePoint: 1,
    alphaStrength: 1,
    interiorCleanup: 0.15,
    solidProtect: 0.95,
    darkThreshold: 0.08,
    darkIslandMax: 360,
    edgeCleanupStrength: 0.55,
    feather: 0,
    tolerance: 0.18,
    despill: 0.1,
    customColor: "#000000",
  },
  smoke: {
    mode: "black",
    alphaMode: "mixed",
    exposure: 0.45,
    gamma: 0.85,
    blackPoint: 0.02,
    whitePoint: 0.9,
    alphaStrength: 1,
    interiorCleanup: 0.75,
    solidProtect: 0.65,
    darkThreshold: 0.16,
    darkIslandMax: 1200,
    edgeCleanupStrength: 0.3,
    feather: 1,
    tolerance: 0.22,
    despill: 0.15,
    customColor: "#000000",
  },
  checker: {
    mode: "checker",
    alphaMode: "cutout",
    exposure: 0,
    gamma: 1,
    blackPoint: 0.02,
    whitePoint: 0.95,
    alphaStrength: 1.05,
    interiorCleanup: 0.25,
    solidProtect: 0.75,
    darkThreshold: 0.12,
    darkIslandMax: 600,
    edgeCleanupStrength: 0.75,
    feather: 0,
    tolerance: 0.32,
    despill: 0.05,
    customColor: "#f0f0f0",
  },
  glass: {
    mode: "white",
    alphaMode: "mixed",
    exposure: 0.3,
    gamma: 0.8,
    blackPoint: 0.02,
    whitePoint: 0.65,
    alphaStrength: 1.15,
    interiorCleanup: 0.65,
    solidProtect: 0.45,
    darkThreshold: 0.14,
    darkIslandMax: 900,
    edgeCleanupStrength: 0.65,
    feather: 2,
    tolerance: 0.2,
    despill: 0.05,
    customColor: "#ffffff",
  },
  green: {
    mode: "green",
    alphaMode: "cutout",
    exposure: 0,
    gamma: 1,
    blackPoint: 0.04,
    whitePoint: 0.9,
    alphaStrength: 1.05,
    interiorCleanup: 0.25,
    solidProtect: 0.8,
    darkThreshold: 0.1,
    darkIslandMax: 400,
    edgeCleanupStrength: 0.9,
    feather: 1,
    tolerance: 0.34,
    despill: 0.9,
    customColor: "#00ff00",
  },
};

el.fileInput.addEventListener("change", () => {
  handleFiles([...el.fileInput.files]);
  el.fileInput.value = "";
});

for (const type of ["dragenter", "dragover"]) {
  window.addEventListener(type, (event) => {
    event.preventDefault();
    el.dropZone.classList.add("drop-active");
  });
}

for (const type of ["dragleave", "drop"]) {
  window.addEventListener(type, (event) => {
    event.preventDefault();
    if (type === "drop") {
      handleFiles([...event.dataTransfer.files]);
    }
    el.dropZone.classList.remove("drop-active");
  });
}

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-view]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.view = button.dataset.view;
    scheduleRender();
  });
});

document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    applyPreset(button.dataset.preset);
    scheduleRender();
  });
});

for (const id of sliderIds) {
  el[id].addEventListener("input", () => {
    updateSliderLabels();
    scheduleRender();
  });
}

for (const input of [el.mode, el.alphaMode, el.regionTool, el.selectMode, el.autoDarkCleanup, el.smartEdgeCleanup, el.previewBg, el.lowMemory]) {
  input.addEventListener("change", () => {
    syncPreviewBackground();
    scheduleRender();
  });
}

el.customColor.addEventListener("input", () => {
  el.mode.value = "custom";
  updateActivePresetButtons("custom");
  scheduleRender();
});

el.clearAll.addEventListener("click", clearAll);
el.resetSettings.addEventListener("click", () => {
  applyPreset("blackFx");
  setMessage("Settings reset to Black-bg object.");
  scheduleRender();
});
el.sampleCorner.addEventListener("click", sampleCornerColor);
el.exportCurrent.addEventListener("click", exportCurrent);
el.sendToAlign.addEventListener("click", sendCurrentToAlignTool);
el.exportZip.addEventListener("click", exportZip);
el.previewCanvas.addEventListener("click", handlePreviewClick);
el.undoRegion.addEventListener("click", undoRegion);
el.clearRegions.addEventListener("click", clearRegions);
window.addEventListener("resize", scheduleRender);

applyPreset("blackFx");
updateStats();
syncPreviewBackground();
drawEmptyPreview();
setButtonsDisabled(false);
loadBridgeAssetFromQuery();

async function handleFiles(files) {
  if (state.busy) return;
  const imageFiles = files.filter((file) => file.type.startsWith("image/"));
  if (!imageFiles.length) {
    setMessage("No processable images found.");
    return;
  }

  const remaining = MAX_FILES - state.items.length;
  if (remaining <= 0) {
    setMessage(`This first version imports up to ${MAX_FILES} images at once; please clear or process in batches.`);
    return;
  }

  const accepted = imageFiles.slice(0, remaining);
  if (imageFiles.length > remaining) {
    setMessage(`Imported the first ${remaining}; this first version handles up to ${MAX_FILES} at once.`);
  }

  state.busy = true;
  setButtonsDisabled(true);
  try {
    for (const file of accepted) {
      await addImageFile(file);
    }
  } finally {
    state.busy = false;
    setButtonsDisabled(false);
    renderThumbs();
    updateStats();
    updateRegionSummary();
    scheduleRender();
  }
}

async function addImageFile(file) {
  const bitmap = await decodeImage(file);
  const pixels = bitmap.width * bitmap.height;
  if (bitmap.width > HARD_MAX_SIDE || bitmap.height > HARD_MAX_SIDE || pixels > HARD_PIXELS) {
    setMessage(`Skipped ${file.name}: resolution too high; shrink it before processing.`);
    closeBitmap(bitmap);
    return;
  }

  const nextTotal = totalPixels() + pixels;
  if (nextTotal > HARD_TOTAL_PIXELS) {
    setMessage(`Skipped ${file.name}: total pixels across the batch too high; process in batches.`);
    closeBitmap(bitmap);
    return;
  }

  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  const item = {
    id,
    file,
    name: file.name,
    size: file.size,
    width: bitmap.width,
    height: bitmap.height,
    bitmap,
    thumbUrl: URL.createObjectURL(file),
    regions: [],
  };
  state.items.push(item);
  if (!state.selectedId) state.selectedId = id;
}

function decodeImage(file) {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file);
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image decode failed"));
    };
    image.src = url;
  });
}

function closeBitmap(bitmap) {
  if (typeof bitmap.close === "function") bitmap.close();
}

function renderThumbs() {
  if (!state.items.length) {
    el.thumbList.innerHTML = '<div class="empty">Drop images here, or use Import above.</div>';
    return;
  }

  el.thumbList.innerHTML = "";
  for (const item of state.items) {
    const button = document.createElement("button");
    button.className = `thumb${item.id === state.selectedId ? " active" : ""}`;
    button.type = "button";
    button.innerHTML = `
      <img src="${item.thumbUrl}" alt="">
      <span>
        <b>${escapeHtml(item.name)}</b>
        <span>${item.width} x ${item.height} · ${formatBytes(item.size)}</span>
      </span>
    `;
    button.addEventListener("click", () => {
      state.selectedId = item.id;
      renderThumbs();
      updateRegionSummary();
      scheduleRender();
    });
    el.thumbList.appendChild(button);
  }
}

function updateStats() {
  const count = state.items.length;
  const total = totalPixels();
  const maxWidth = Math.max(0, ...state.items.map((item) => item.width));
  const maxHeight = Math.max(0, ...state.items.map((item) => item.height));
  const maxSide = Math.max(maxWidth, maxHeight);
  const totalBytes = state.items.reduce((sum, item) => sum + item.size, 0);
  const memoryEstimate = estimateMemory(total);
  const risk = assessRisk(total, maxSide, totalBytes, memoryEstimate);

  el.countStat.textContent = `${count} / ${MAX_FILES}`;
  el.maxSizeStat.textContent = count ? `${maxWidth} x ${maxHeight}` : "-";
  el.pixelStat.textContent = count ? `${formatMegaPixels(total)} MP` : "-";
  el.riskStat.textContent = risk.label;
  el.riskStat.style.color = risk.color;

  if (!count) {
    el.riskPanel.hidden = true;
    return;
  }

  const notes = [];
  notes.push(`Estimated processing memory ~${formatBytes(memoryEstimate)}.`);
  if (maxSide > SOFT_MAX_SIDE) notes.push(`Longest side of an image exceeds ${SOFT_MAX_SIDE}px; batch or shrink if needed.`);
  if (total > SOFT_TOTAL_PIXELS) notes.push("Total pixels are high; batch export may be slow.");
  if (totalBytes > SOFT_FILE_MB * 1024 * 1024 * 3) notes.push("Total file size is high; ZIP packing will take longer.");
  if (getDeviceNote()) notes.push(getDeviceNote());

  el.riskPanel.textContent = notes.join(" ");
  el.riskPanel.className = `notice ${risk.level}`;
  el.riskPanel.hidden = false;
}

function assessRisk(totalPixelsValue, maxSide, totalBytes, memoryEstimate) {
  let score = 0;
  if (state.items.length > 6) score += 1;
  if (maxSide > SOFT_MAX_SIDE) score += 1;
  if (totalPixelsValue > SOFT_TOTAL_PIXELS) score += 1;
  if (totalBytes > SOFT_FILE_MB * 1024 * 1024 * 3) score += 1;
  if (memoryEstimate > 700 * 1024 * 1024) score += 1;
  if (navigator.deviceMemory && navigator.deviceMemory <= 4) score += 1;

  if (score >= 3) return { label: "High", level: "high", color: "var(--danger)" };
  if (score >= 1) return { label: "Medium", level: "medium", color: "var(--amber)" };
  return { label: "Low", level: "low", color: "var(--ok)" };
}

function estimateMemory(pixels) {
  const multiplier = Number(el.feather.value) > 0 ? 7 : 5;
  return pixels * 4 * multiplier;
}

function getDeviceNote() {
  const parts = [];
  if (navigator.deviceMemory) parts.push(`Device memory ~${navigator.deviceMemory}GB`);
  if (navigator.hardwareConcurrency) parts.push(`CPU threads ${navigator.hardwareConcurrency}`);
  return parts.length ? `${parts.join("，")}。` : "";
}

function scheduleRender() {
  const token = ++state.renderToken;
  window.setTimeout(() => {
    if (token === state.renderToken) renderPreview();
  }, 40);
}

function renderPreview() {
  const item = selectedItem();
  if (!item) {
    drawEmptyPreview();
    return;
  }

  el.previewTitle.textContent = item.name;
  const maxSide = el.lowMemory.checked ? 1536 : 2600;
  const source = makeSourceCanvas(item, maxSide);
  const sourceCtx = source.getContext("2d");
  const originalData = sourceCtx.getImageData(0, 0, source.width, source.height);
  const settings = readSettings(item);

  let output;
  if (state.view === "original") {
    output = originalData;
  } else {
    const processed = processImageData(originalData, settings);
    output = state.view === "mask" ? processed.mask : processed.result;
  }
  drawImageDataToPreview(output);
}

function drawEmptyPreview() {
  const canvas = el.previewCanvas;
  canvas.width = 720;
  canvas.height = 420;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#aeb5bd";
  ctx.font = "18px Microsoft JhengHei, sans-serif";
  ctx.fillText("Import an image to start", 28, 46);
}

function drawImageDataToPreview(imageData) {
  const canvas = el.previewCanvas;
  const rect = el.canvasWrap.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = Math.max(1, Math.floor(rect.width));
  const cssHeight = Math.max(1, Math.floor(rect.height));
  canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
  canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const temp = document.createElement("canvas");
  temp.width = imageData.width;
  temp.height = imageData.height;
  temp.getContext("2d").putImageData(imageData, 0, 0);

  const scale = Math.min(cssWidth / imageData.width, cssHeight / imageData.height);
  const drawWidth = imageData.width * scale;
  const drawHeight = imageData.height * scale;
  const x = (cssWidth - drawWidth) / 2;
  const y = (cssHeight - drawHeight) / 2;
  state.lastPreview = {
    cssWidth,
    cssHeight,
    imageWidth: imageData.width,
    imageHeight: imageData.height,
    drawX: x,
    drawY: y,
    drawWidth,
    drawHeight,
  };
  ctx.imageSmoothingEnabled = scale < 1;
  if (ctx.imageSmoothingEnabled) ctx.imageSmoothingQuality = "high";
  ctx.drawImage(temp, x, y, drawWidth, drawHeight);
}

function handlePreviewClick(event) {
  const item = selectedItem();
  if (!item || el.regionTool.value === "none" || !state.lastPreview) return;

  const rect = el.previewCanvas.getBoundingClientRect();
  const px = event.clientX - rect.left;
  const py = event.clientY - rect.top;
  const preview = state.lastPreview;
  if (
    px < preview.drawX ||
    py < preview.drawY ||
    px > preview.drawX + preview.drawWidth ||
    py > preview.drawY + preview.drawHeight
  ) {
    return;
  }

  const x = (px - preview.drawX) / preview.drawWidth;
  const y = (py - preview.drawY) / preview.drawHeight;
  const source = makeSourceCanvas(item, 512);
  const ctx = source.getContext("2d");
  const sx = Math.max(0, Math.min(source.width - 1, Math.round(x * (source.width - 1))));
  const sy = Math.max(0, Math.min(source.height - 1, Math.round(y * (source.height - 1))));
  const pixel = ctx.getImageData(sx, sy, 1, 1).data;

  item.regions.push({
    type: el.regionTool.value,
    selectMode: el.selectMode.value,
    tolerance: Number(el.regionTolerance.value),
    x,
    y,
    color: [pixel[0] / 255, pixel[1] / 255, pixel[2] / 255],
  });

  updateRegionSummary();
  setMessage(regionMessage(el.regionTool.value));
  scheduleRender();
}

function undoRegion() {
  const item = selectedItem();
  if (!item || !item.regions.length) return;
  item.regions.pop();
  updateRegionSummary();
  scheduleRender();
}

function clearRegions() {
  const item = selectedItem();
  if (!item) return;
  item.regions = [];
  updateRegionSummary();
  scheduleRender();
}

function updateRegionSummary() {
  const item = selectedItem();
  if (!item || !item.regions.length) {
    el.regionSummary.textContent = "No regions marked yet.";
    return;
  }
  const counts = item.regions.reduce((acc, region) => {
    acc[region.type] = (acc[region.type] || 0) + 1;
    return acc;
  }, {});
  el.regionSummary.textContent = `Marked: clear ${counts.clear || 0}, glass/smoke ${counts.glass || 0}, keep ${counts.protect || 0}.`;
}

function regionMessage(type) {
  if (type === "clear") return "Marked residue to clear.";
  if (type === "glass") return "Marked a glass / smoke area.";
  if (type === "protect") return "Marked an area to keep untouched.";
  return "Region added.";
}

function makeSourceCanvas(item, maxSide = Infinity) {
  const scale = Math.min(1, maxSide / Math.max(item.width, item.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(item.width * scale));
  canvas.height = Math.max(1, Math.round(item.height * scale));
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = scale < 1;
  if (ctx.imageSmoothingEnabled) ctx.imageSmoothingQuality = "high";
  ctx.drawImage(item.bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function processImageData(imageData, settings) {
  const data = imageData.data;
  const result = new ImageData(imageData.width, imageData.height);
  const mask = new ImageData(imageData.width, imageData.height);
  const alpha = new Float32Array(imageData.width * imageData.height);
  const checker = settings.mode === "checker" ? detectCheckerColors(imageData) : null;
  const edgeMask = shouldUseEdgeBackgroundMask(settings)
    ? findEdgeBackgroundMask(imageData, settings, checker)
    : null;
  const regionMasks = buildRegionMasks(imageData, settings);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const rgb = [data[i] / 255, data[i + 1] / 255, data[i + 2] / 255];
    let solved = solvePixel(rgb, settings, checker, edgeMask ? edgeMask[p] : false);
    solved = applyRegionMasks(solved, rgb, settings, regionMasks, p);
    alpha[p] = solved.alpha;
    result.data[i] = solved.color[0] * 255;
    result.data[i + 1] = solved.color[1] * 255;
    result.data[i + 2] = solved.color[2] * 255;
    result.data[i + 3] = solved.alpha * 255;
  }

  if (settings.smartEdgeCleanup && settings.edgeCleanupStrength > 0) {
    applySmartEdgeCleanup(data, result, alpha, imageData.width, imageData.height, settings);
  }

  if (settings.feather > 0) {
    const blurred = blurAlpha(alpha, imageData.width, imageData.height, settings.feather);
    for (let i = 0, p = 0; i < result.data.length; i += 4, p++) {
      result.data[i + 3] = blurred[p] * 255;
      alpha[p] = blurred[p];
    }
  }

  for (let i = 0, p = 0; i < mask.data.length; i += 4, p++) {
    const v = Math.round(alpha[p] * 255);
    mask.data[i] = v;
    mask.data[i + 1] = v;
    mask.data[i + 2] = v;
    mask.data[i + 3] = 255;
  }

  return { result, mask };
}

function solvePixel(rgb, settings, checker, isEdgeBackground) {
  let bg = settings.bg;
  let rawAlpha = 0;
  let color = rgb;

  if (settings.mode === "black") {
    const effectRaw = Math.max(rgb[0], rgb[1], rgb[2]);
    const cutoutRaw = smoothstep(settings.tolerance * 0.15, settings.tolerance, colorDistance(rgb, [0, 0, 0]));
    const alpha = alphaByMaterialMode(effectRaw, cutoutRaw, settings, rgb, isEdgeBackground);
    color = alpha > 0.001 ? rgb.map((channel) => clamp01(channel / alpha)) : [0, 0, 0];
    return { alpha, color };
  }

  if (settings.mode === "white") {
    const effectRaw = Math.max(1 - rgb[0], 1 - rgb[1], 1 - rgb[2]);
    const cutoutRaw = smoothstep(settings.tolerance * 0.15, settings.tolerance, colorDistance(rgb, [1, 1, 1]));
    const alpha = alphaByMaterialMode(effectRaw, cutoutRaw, settings, rgb, isEdgeBackground);
    color = unmixBackground(rgb, [1, 1, 1], alpha);
    return { alpha, color };
  }

  if (settings.mode === "green") {
    bg = [0, 1, 0];
    const distance = colorDistance(rgb, bg);
    const distanceAlpha = smoothstep(settings.tolerance * 0.45, settings.tolerance, distance);
    const spill = greenScreenSpillScore(rgb);
    const spillAlpha = 1 - smoothstep(0.12, 0.62, spill * (0.75 + settings.despill * 0.75));
    rawAlpha = Math.min(distanceAlpha, spillAlpha);
    const alpha = alphaByMaterialMode(rawAlpha, rawAlpha, settings, rgb, isEdgeBackground);
    color = unmixBackground(rgb, bg, alpha);
    color = removeGreenScreenSpill(color, settings.despill);
    return { alpha, color };
  }

  if (settings.mode === "checker" && checker) {
    rawAlpha = alphaForCheckerPixel(rgb, checker, settings);
    const alpha = alphaByMaterialMode(rawAlpha, rawAlpha, settings, rgb, isEdgeBackground);
    color = rgb;
    return { alpha, color };
  }

  const distance = colorDistance(rgb, bg);
  rawAlpha = smoothstep(settings.tolerance * 0.15, settings.tolerance, distance);
  const alpha = alphaByMaterialMode(rawAlpha, rawAlpha, settings, rgb, isEdgeBackground);
  color = unmixBackground(rgb, bg, alpha);
  return { alpha, color };
}

function alphaByMaterialMode(effectRaw, cutoutRaw, settings, rgb, isEdgeBackground) {
  if (isEdgeBackground && settings.alphaMode !== "effect") return 0;

  const effectAlpha = adjustAlpha(effectRaw, settings);
  const cutoutAlpha = adjustAlpha(cutoutRaw, settings);
  if (settings.alphaMode === "effect") return effectAlpha;
  if (settings.alphaMode === "cutout") return cutoutAlpha;

  const protect = materialProtection(rgb, settings.solidProtect);
  const cleanup = clamp01(settings.interiorCleanup * (1 - protect));
  return clamp01(1 * (1 - cleanup) + effectAlpha * cleanup);
}

function materialProtection(rgb, strength) {
  const max = Math.max(rgb[0], rgb[1], rgb[2]);
  const min = Math.min(rgb[0], rgb[1], rgb[2]);
  const saturation = max > 0.001 ? (max - min) / max : 0;
  const luma = luminance(rgb);
  const colorDetail = clamp01(saturation * 1.25 + luma * 0.65);
  return clamp01(colorDetail * strength);
}

function greenSpillScore(rgb) {
  const maxRb = Math.max(rgb[0], rgb[2]);
  const min = Math.min(rgb[0], rgb[1], rgb[2]);
  const max = Math.max(rgb[0], rgb[1], rgb[2]);
  const saturation = max > 0.001 ? (max - min) / max : 0;
  const dominance = Math.max(0, rgb[1] - maxRb);
  return clamp01((dominance / Math.max(0.08, rgb[1])) * saturation * 1.45);
}

function greenScreenSpillScore(rgb) {
  const hue = hueDegrees(rgb);
  const max = Math.max(rgb[0], rgb[1], rgb[2]);
  const min = Math.min(rgb[0], rgb[1], rgb[2]);
  const saturation = max > 0.001 ? (max - min) / max : 0;
  const lowRed = clamp01((Math.max(rgb[1], rgb[2]) - rgb[0]) / Math.max(0.08, Math.max(rgb[1], rgb[2])));
  const greenBand = hueBandScore(hue, 72, 178);
  const cyanBand = hueBandScore(hue, 150, 205) * 0.85;
  return clamp01(Math.max(greenSpillScore(rgb), Math.max(greenBand, cyanBand) * saturation * lowRed));
}

function removeGreenScreenSpill(rgb, strength) {
  const score = greenScreenSpillScore(rgb);
  if (score <= 0) return rgb;
  const amount = clamp01(strength * score);
  const targetGreen = Math.max(rgb[0], rgb[2]) * 0.72 + Math.min(rgb[0], rgb[2]) * 0.28;
  const targetBlue = hueDegrees(rgb) < 205 ? Math.max(rgb[2] * (1 - amount * 0.35), rgb[0] * 0.5) : rgb[2];
  return [
    rgb[0],
    clamp01(lerp(rgb[1], targetGreen, amount)),
    clamp01(targetBlue),
  ];
}

function hueDegrees(rgb) {
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta <= 0.0001) return 0;
  let hue;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  return (hue * 60 + 360) % 360;
}

function hueBandScore(hue, start, end) {
  if (hue < start || hue > end) return 0;
  const center = (start + end) / 2;
  const half = (end - start) / 2;
  return clamp01(1 - Math.abs(hue - center) / half);
}

function shouldUseEdgeBackgroundMask(settings) {
  return settings.alphaMode !== "effect";
}

function findEdgeBackgroundMask(imageData, settings, checker) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const mask = new Uint8Array(width * height);
  const queue = [];

  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = y * width + x;
    if (mask[index]) return;
    if (!isBackgroundPixel(data, index * 4, settings, checker)) return;
    mask[index] = 1;
    queue.push(index);
  };

  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  for (let head = 0; head < queue.length; head++) {
    const index = queue[head];
    const x = index % width;
    const y = Math.floor(index / width);
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  return mask;
}

function isBackgroundPixel(data, offset, settings, checker) {
  const rgb = [data[offset] / 255, data[offset + 1] / 255, data[offset + 2] / 255];
  if (settings.mode === "black") {
    return colorDistance(rgb, [0, 0, 0]) <= edgeBackgroundLimit(settings, 0.35, 0.12);
  }
  if (settings.mode === "white") {
    return colorDistance(rgb, [1, 1, 1]) <= edgeBackgroundLimit(settings, 0.35, 0.12);
  }
  if (settings.mode === "green") {
    return colorDistance(rgb, [0, 1, 0]) <= settings.tolerance || greenScreenSpillScore(rgb) >= 0.34;
  }
  if (settings.mode === "checker" && checker) {
    return isCheckerBackgroundLike(rgb, checker, settings, edgeBackgroundLimit(settings, 0.9, 0.3));
  }
  return colorDistance(rgb, settings.bg) <= edgeBackgroundLimit(settings, 0.7, 0.28);
}

function edgeBackgroundLimit(settings, multiplier, cap) {
  return Math.min(cap, Math.max(0.025, settings.tolerance * multiplier));
}

function buildRegionMasks(imageData, settings) {
  const width = imageData.width;
  const height = imageData.height;
  const size = width * height;
  const masks = {
    clear: new Uint8Array(size),
    glass: new Uint8Array(size),
    protect: new Uint8Array(size),
    darkClear: new Uint8Array(size),
  };

  for (const region of settings.regions || []) {
    const mask = createRegionMask(imageData, region);
    const target = masks[region.type];
    if (!target) continue;
    for (let i = 0; i < size; i++) {
      if (mask[i]) target[i] = 1;
    }
  }

  if (settings.autoDarkCleanup) {
    masks.darkClear = createDarkIslandMask(imageData, masks.glass, settings);
  }

  return masks;
}

function createRegionMask(imageData, region) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const mask = new Uint8Array(width * height);
  const sx = Math.max(0, Math.min(width - 1, Math.round(region.x * (width - 1))));
  const sy = Math.max(0, Math.min(height - 1, Math.round(region.y * (height - 1))));
  const target = sampleRgb(data, sy * width + sx);
  const tolerance = region.tolerance;

  if (region.selectMode === "similar") {
    for (let i = 0; i < width * height; i++) {
      if (colorDistance(sampleRgb(data, i), target) <= tolerance) mask[i] = 1;
    }
    return mask;
  }

  const queue = [];
  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = y * width + x;
    if (mask[index]) return;
    if (colorDistance(sampleRgb(data, index), target) > tolerance) return;
    mask[index] = 1;
    queue.push(index);
  };

  enqueue(sx, sy);
  for (let head = 0; head < queue.length; head++) {
    const index = queue[head];
    const x = index % width;
    const y = Math.floor(index / width);
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  return mask;
}

function createDarkIslandMask(imageData, glassMask, settings) {
  const width = imageData.width;
  const height = imageData.height;
  const size = width * height;
  const data = imageData.data;
  const visited = new Uint8Array(size);
  const out = new Uint8Array(size);
  const maxArea = Math.max(1, Math.round(settings.darkIslandMax));

  for (let start = 0; start < size; start++) {
    if (visited[start] || !isDarkGlassPixel(data, start, glassMask, settings)) continue;

    const component = [];
    const queue = [start];
    visited[start] = 1;

    for (let head = 0; head < queue.length; head++) {
      const index = queue[head];
      component.push(index);
      const x = index % width;
      const y = Math.floor(index / width);
      const neighbors = [
        x > 0 ? index - 1 : -1,
        x < width - 1 ? index + 1 : -1,
        y > 0 ? index - width : -1,
        y < height - 1 ? index + width : -1,
      ];

      for (const next of neighbors) {
        if (next < 0 || visited[next] || !isDarkGlassPixel(data, next, glassMask, settings)) continue;
        visited[next] = 1;
        queue.push(next);
      }
    }

    if (component.length <= maxArea) {
      for (const index of component) out[index] = 1;
    }
  }

  return out;
}

function isDarkGlassPixel(data, index, glassMask, settings) {
  if (!glassMask[index]) return false;
  return luminance(sampleRgb(data, index)) <= settings.darkThreshold;
}

function applySmartEdgeCleanup(sourceData, result, alpha, width, height, settings) {
  const nextAlpha = new Float32Array(alpha);
  const strength = settings.edgeCleanupStrength;

  for (let index = 0; index < alpha.length; index++) {
    if (alpha[index] <= 0.03) continue;
    const edgeFactor = transparentNeighborFactor(alpha, width, height, index);
    if (edgeFactor <= 0) continue;

    const rgb = sampleRgb(sourceData, index);
    const spill = edgeSpillScore(rgb, settings);
    if (spill <= 0.08) continue;

    const remove = clamp01(spill * edgeFactor * strength);
    nextAlpha[index] = alpha[index] * (1 - remove);

    const offset = index * 4;
    const cleaned = settings.mode === "green"
      ? removeGreenScreenSpill([result.data[offset] / 255, result.data[offset + 1] / 255, result.data[offset + 2] / 255], strength)
      : [result.data[offset] / 255, result.data[offset + 1] / 255, result.data[offset + 2] / 255];
    result.data[offset] = cleaned[0] * 255;
    result.data[offset + 1] = cleaned[1] * 255;
    result.data[offset + 2] = cleaned[2] * 255;
  }

  for (let index = 0; index < alpha.length; index++) {
    alpha[index] = nextAlpha[index];
    result.data[index * 4 + 3] = nextAlpha[index] * 255;
  }
}

function transparentNeighborFactor(alpha, width, height, index) {
  const x = index % width;
  const y = Math.floor(index / width);
  let transparentCount = 0;
  let checked = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      checked++;
      if (alpha[ny * width + nx] < 0.25) transparentCount++;
    }
  }
  return checked ? transparentCount / checked : 0;
}

function edgeSpillScore(rgb, settings) {
  if (settings.mode === "green") return greenScreenSpillScore(rgb);
  const bg = backgroundForMode(settings);
  return 1 - smoothstep(settings.tolerance * 0.2, settings.tolerance * 1.1, colorDistance(rgb, bg));
}

function applyRegionMasks(solved, rgb, settings, masks, index) {
  if (masks.protect[index]) {
    return { alpha: 1, color: rgb };
  }

  if (masks.clear[index]) {
    return { alpha: 0, color: rgb };
  }

  if (masks.darkClear[index]) {
    return { alpha: 0, color: rgb };
  }

  if (masks.glass[index]) {
    const alpha = alphaForTransparentRegion(rgb, settings);
    const bg = backgroundForMode(settings, rgb);
    return {
      alpha,
      color: settings.mode === "black" ? rgb.map((channel) => clamp01(channel / Math.max(alpha, 0.001))) : unmixBackground(rgb, bg, alpha),
    };
  }

  return solved;
}

function alphaForTransparentRegion(rgb, settings) {
  let raw;
  if (settings.mode === "white") {
    raw = Math.max(1 - rgb[0], 1 - rgb[1], 1 - rgb[2]);
  } else if (settings.mode === "green") {
    raw = smoothstep(settings.tolerance * 0.45, settings.tolerance, colorDistance(rgb, [0, 1, 0]));
  } else {
    raw = Math.max(rgb[0], rgb[1], rgb[2]);
  }
  return adjustAlpha(raw, settings);
}

function backgroundForMode(settings) {
  if (settings.mode === "white") return [1, 1, 1];
  if (settings.mode === "green") return [0, 1, 0];
  return settings.bg;
}

function sampleRgb(data, index) {
  const offset = index * 4;
  return [data[offset] / 255, data[offset + 1] / 255, data[offset + 2] / 255];
}

function adjustAlpha(raw, settings) {
  const exposed = raw * Math.pow(2, settings.exposure);
  const leveled = clamp01((exposed - settings.blackPoint) / Math.max(0.001, settings.whitePoint - settings.blackPoint));
  const gammaCorrected = Math.pow(leveled, 1 / Math.max(0.001, settings.gamma));
  return clamp01(gammaCorrected * settings.alphaStrength);
}

function unmixBackground(rgb, bg, alpha) {
  if (alpha <= 0.001) return [0, 0, 0];
  return [
    clamp01((rgb[0] - bg[0] * (1 - alpha)) / alpha),
    clamp01((rgb[1] - bg[1] * (1 - alpha)) / alpha),
    clamp01((rgb[2] - bg[2] * (1 - alpha)) / alpha),
  ];
}

function blurAlpha(alpha, width, height, radius) {
  const temp = new Float32Array(alpha.length);
  const out = new Float32Array(alpha.length);
  const size = radius * 2 + 1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -radius; k <= radius; k++) {
        const sx = Math.max(0, Math.min(width - 1, x + k));
        sum += alpha[y * width + sx];
      }
      temp[y * width + x] = sum / size;
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -radius; k <= radius; k++) {
        const sy = Math.max(0, Math.min(height - 1, y + k));
        sum += temp[sy * width + x];
      }
      out[y * width + x] = sum / size;
    }
  }

  return out;
}

function detectCheckerColors(imageData) {
  const samples = [];
  const stepX = Math.max(1, Math.floor(imageData.width / 200));
  const stepY = Math.max(1, Math.floor(imageData.height / 200));
  const border = Math.max(2, Math.floor(Math.min(imageData.width, imageData.height) * 0.08));
  for (let y = 0; y < imageData.height; y += stepY) {
    for (let x = 0; x < imageData.width; x += stepX) {
      const i = (y * imageData.width + x) * 4;
      const sample = [
        imageData.data[i] / 255,
        imageData.data[i + 1] / 255,
        imageData.data[i + 2] / 255,
      ];
      const nearEdge = x < border || y < border || x >= imageData.width - border || y >= imageData.height - border;
      if (nearEdge || saturation(sample) < 0.28) samples.push(sample);
      if (nearEdge) samples.push(sample);
    }
  }

  const seedSamples = samples.length ? samples : [[0.72, 0.72, 0.72], [0.92, 0.92, 0.92]];
  const seed = findDominantCheckerSeeds(seedSamples);
  let { a, b } = seed;
  const clusterSamples = seed.samples;

  for (let iter = 0; iter < 5; iter++) {
    const groupA = [];
    const groupB = [];
    for (const sample of clusterSamples) {
      (colorDistance(sample, a) <= colorDistance(sample, b) ? groupA : groupB).push(sample);
    }
    if (groupA.length) a = averageColor(groupA);
    if (groupB.length) b = averageColor(groupB);
  }

  return { a, b };
}

function findDominantCheckerSeeds(samples) {
  const neutral = samples.filter((sample) => saturation(sample) < 0.32);
  const midNeutral = neutral.filter((sample) => {
    const l = luminance(sample);
    return l >= 0.1 && l <= 0.995;
  });
  const source = midNeutral.length >= 24 ? midNeutral : neutral.length >= 12 ? neutral : samples;
  const bins = Array.from({ length: 32 }, (_, bin) => ({ bin, count: 0, sum: [0, 0, 0], samples: [] }));

  for (const sample of source) {
    const bin = Math.max(0, Math.min(31, Math.floor(luminance(sample) * 32)));
    const bucket = bins[bin];
    bucket.count++;
    bucket.sum[0] += sample[0];
    bucket.sum[1] += sample[1];
    bucket.sum[2] += sample[2];
    bucket.samples.push(sample);
  }

  const ranked = bins.filter((bucket) => bucket.count > 0).sort((a, b) => b.count - a.count);
  const first = ranked[0];
  if (!first) {
    return { a: [0.72, 0.72, 0.72], b: [0.92, 0.92, 0.92], samples };
  }

  const enoughSamples = Math.max(12, first.count * 0.03);
  const second = ranked.find((bucket) => bucket !== first && bucket.count >= enoughSamples)
    || ranked.find((bucket) => Math.abs(bucket.bin - first.bin) >= 4)
    || ranked.find((bucket) => bucket !== first)
    || first;

  const a = averageBucket(first);
  const b = averageBucket(second);
  return { a, b, samples: source };
}

function averageBucket(bucket) {
  if (!bucket.count) return [0.75, 0.75, 0.75];
  return bucket.sum.map((value) => value / bucket.count);
}

function alphaForCheckerPixel(rgb, checker, settings) {
  const distance = checkerBackgroundDistance(rgb, checker);
  const backgroundBand = Math.max(settings.tolerance * 0.34, 0.08);
  const alpha = smoothstep(backgroundBand, settings.tolerance * 1.25, distance);
  if (distance < backgroundBand) return 0;
  const foregroundProtect = checkerForegroundProtect(rgb, checker);
  if (foregroundProtect > 0.72) return 1;
  return clamp01(Math.max(alpha, foregroundProtect * 0.95));
}

function isCheckerBackgroundLike(rgb, checker, settings, limit) {
  if (checkerBackgroundDistance(rgb, checker) > limit) return false;
  return checkerForegroundProtect(rgb, checker) < 0.35;
}

function checkerBackgroundDistance(rgb, checker) {
  const nearest = Math.min(colorDistance(rgb, checker.a), colorDistance(rgb, checker.b));
  const line = distanceToColorSegment(rgb, checker.a, checker.b);
  return Math.min(nearest, line * 1.15);
}

function checkerForegroundProtect(rgb, checker) {
  const l = luminance(rgb);
  const la = luminance(checker.a);
  const lb = luminance(checker.b);
  const low = Math.min(la, lb);
  const darkInk = 1 - smoothstep(low - 0.08, low + 0.015, l);
  const colorInk = smoothstep(0.18, 0.45, saturation(rgb));
  return clamp01(Math.max(darkInk, colorInk));
}

function distanceToColorSegment(rgb, a, b) {
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const ap = [rgb[0] - a[0], rgb[1] - a[1], rgb[2] - a[2]];
  const len2 = ab[0] * ab[0] + ab[1] * ab[1] + ab[2] * ab[2];
  if (len2 <= 0.000001) return colorDistance(rgb, a);
  const t = clamp01((ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / len2);
  return colorDistance(rgb, [a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t]);
}

function averageColor(colors) {
  const sum = colors.reduce((acc, color) => {
    acc[0] += color[0];
    acc[1] += color[1];
    acc[2] += color[2];
    return acc;
  }, [0, 0, 0]);
  return sum.map((value) => value / colors.length);
}

function sampleCornerColor() {
  const item = selectedItem();
  if (!item) return;
  const canvas = makeSourceCanvas(item, 512);
  const ctx = canvas.getContext("2d");
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const points = [
    [0, 0],
    [canvas.width - 1, 0],
    [0, canvas.height - 1],
    [canvas.width - 1, canvas.height - 1],
  ];
  const color = [0, 0, 0];
  for (const [x, y] of points) {
    const i = (y * canvas.width + x) * 4;
    color[0] += data[i];
    color[1] += data[i + 1];
    color[2] += data[i + 2];
  }
  const hex = rgbToHex(color.map((value) => Math.round(value / points.length)));
  el.customColor.value = hex;
  el.mode.value = "custom";
  updateActivePresetButtons("custom");
  setMessage(`Estimated background color from corners: ${hex}`);
  scheduleRender();
}

async function exportCurrent() {
  const item = selectedItem();
  if (!item || state.busy) return;
  state.busy = true;
  setButtonsDisabled(true);
  setMessage("Processing the current image...");
  try {
    const blob = await processItemToBlob(item);
    downloadBlob(blob, outputName(item.name, ".png"));
    setMessage("Exported the current PNG.");
  } finally {
    state.busy = false;
    setButtonsDisabled(false);
  }
}

async function sendCurrentToAlignTool() {
  const item = selectedItem();
  if (!item || state.busy) return;
  state.busy = true;
  setButtonsDisabled(true);
  setMessage("Preparing to send to the Frame Align tool...");
  try {
    const blob = await processItemToBlob(item);
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    await saveBridgeAsset({
      id,
      name: outputName(item.name, ".png"),
      type: "image/png",
      blob,
      createdAt: Date.now(),
      source: "game-asset-bg-remover",
    });
    const url = new URL(ALIGN_TOOL_URL);
    url.searchParams.set("asset", id);
    window.location.href = url.toString();
  } catch (error) {
    console.error(error);
    setMessage("Send failed; export the PNG and import it into the Frame Align tool instead.");
    state.busy = false;
    setButtonsDisabled(false);
  }
}

async function exportZip() {
  if (!state.items.length || state.busy) return;
  state.busy = true;
  setButtonsDisabled(true);
  try {
    const entries = [];
    for (let index = 0; index < state.items.length; index++) {
      const item = state.items[index];
      setMessage(`Batch processing ${index + 1} / ${state.items.length}: ${item.name}`);
      const blob = await processItemToBlob(item);
      entries.push({ name: outputName(item.name, ".png"), blob });
      await waitFrame();
    }
    setMessage("Packing ZIP...");
    const zipBlob = await createZip(entries);
    downloadBlob(zipBlob, "game-assets-transparent.zip");
    setMessage("Batch ZIP created.");
  } finally {
    state.busy = false;
    setButtonsDisabled(false);
  }
}

async function saveBridgeAsset(record) {
  const db = await openBridgeDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BRIDGE_STORE_NAME, "readwrite");
    tx.objectStore(BRIDGE_STORE_NAME).put(record);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function getBridgeAsset(id) {
  const db = await openBridgeDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BRIDGE_STORE_NAME, "readonly");
    const request = tx.objectStore(BRIDGE_STORE_NAME).get(id);
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

async function deleteBridgeAsset(id) {
  const db = await openBridgeDb();
  return new Promise((resolve) => {
    const tx = db.transaction(BRIDGE_STORE_NAME, "readwrite");
    tx.objectStore(BRIDGE_STORE_NAME).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      resolve();
    };
  });
}

function openBridgeDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(BRIDGE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BRIDGE_STORE_NAME)) {
        db.createObjectStore(BRIDGE_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadBridgeAssetFromQuery() {
  const id = new URLSearchParams(window.location.search).get("asset");
  if (!id) return;
  try {
    setMessage("Receiving the image sent from the Frame Align tool...");
    const record = await getBridgeAsset(id);
    if (!record?.blob) {
      setMessage("Could not find the sent image; please resend it from the Frame Align tool.");
      return;
    }
    const file = new File([record.blob], record.name || "spritesheet_for_bg_remover.png", {
      type: record.type || record.blob.type || "image/png",
    });
    await handleFiles([file]);
    await deleteBridgeAsset(id);
    const url = new URL(window.location.href);
    url.searchParams.delete("asset");
    history.replaceState(null, "", url.toString());
    setMessage("Received the image from the Frame Align tool.");
  } catch (error) {
    console.error(error);
    setMessage("Failed to receive the image; please import a PNG instead.");
  }
}

async function processItemToBlob(item) {
  const canvas = makeSourceCanvas(item, Infinity);
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const processed = processImageData(imageData, readSettings(item)).result;
  ctx.putImageData(processed, 0, 0);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

function clearAll() {
  for (const item of state.items) URL.revokeObjectURL(item.thumbUrl);
  state.items = [];
  state.selectedId = null;
  state.lastPreview = null;
  renderThumbs();
  updateStats();
  updateRegionSummary();
  drawEmptyPreview();
  setButtonsDisabled(false);
  setMessage("Cleared all images.");
}

function readSettings(item = selectedItem()) {
  return {
    mode: el.mode.value,
    alphaMode: el.alphaMode.value,
    bg: hexToRgb(el.customColor.value),
    exposure: Number(el.exposure.value),
    gamma: Number(el.gamma.value),
    blackPoint: Number(el.blackPoint.value),
    whitePoint: Number(el.whitePoint.value),
    alphaStrength: Number(el.alphaStrength.value),
    interiorCleanup: Number(el.interiorCleanup.value),
    solidProtect: Number(el.solidProtect.value),
    feather: Number(el.feather.value),
    tolerance: Number(el.tolerance.value),
    despill: Number(el.despill.value),
    autoDarkCleanup: el.autoDarkCleanup.checked,
    darkThreshold: Number(el.darkThreshold.value),
    darkIslandMax: Number(el.darkIslandMax.value),
    smartEdgeCleanup: el.smartEdgeCleanup.checked,
    edgeCleanupStrength: Number(el.edgeCleanupStrength.value),
    regions: item?.regions || [],
  };
}

function applyPreset(name) {
  const preset = presets[name];
  if (!preset) return;
  el.mode.value = preset.mode;
  el.alphaMode.value = preset.alphaMode;
  el.customColor.value = preset.customColor;
  el.autoDarkCleanup.checked = true;
  el.smartEdgeCleanup.checked = true;
  for (const id of sliderIds) {
    el[id].value = preset[id];
  }
  updateSliderLabels();
  updateActivePresetButtons(name);
}

function updateActivePresetButtons(activeName) {
  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.classList.toggle("active", button.dataset.preset === activeName);
  });
  el.sampleCorner.classList.toggle("active", activeName === "custom");
}

function updateSliderLabels() {
  for (const id of sliderIds) {
    const label = document.getElementById(`${id}Value`);
    if (!label) continue;
    const value = Number(el[id].value);
    label.textContent = id === "feather" || id === "darkIslandMax" ? String(value) : value.toFixed(2);
  }
  updateStats();
}

function syncPreviewBackground() {
  el.canvasWrap.className = `canvas-wrap ${el.previewBg.value}`;
}

function setButtonsDisabled(disabled) {
  el.exportCurrent.disabled = disabled || !state.items.length;
  el.sendToAlign.disabled = disabled || !state.items.length;
  el.exportZip.disabled = disabled || !state.items.length;
  el.sampleCorner.disabled = disabled || !state.items.length;
  el.fileInput.disabled = disabled;
}

function selectedItem() {
  return state.items.find((item) => item.id === state.selectedId) || null;
}

function totalPixels() {
  return state.items.reduce((sum, item) => sum + item.width * item.height, 0);
}

function setMessage(message) {
  el.message.textContent = message;
}

function colorDistance(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / Math.max(0.0001, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function luminance(rgb) {
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

function saturation(rgb) {
  const max = Math.max(rgb[0], rgb[1], rgb[2]);
  const min = Math.min(rgb[0], rgb[1], rgb[2]);
  return max > 0.001 ? (max - min) / max : 0;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255,
  ];
}

function rgbToHex(rgb) {
  return `#${rgb.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function formatMegaPixels(pixels) {
  return (pixels / 1_000_000).toFixed(pixels >= 10_000_000 ? 1 : 2);
}

function outputName(name, extension) {
  return `${name.replace(/\.[^.]+$/, "")}_transparent${extension}`;
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 800);
}

function waitFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

async function createZip(entries) {
  const files = [];
  let offset = 0;
  for (const entry of entries) {
    const bytes = new Uint8Array(await entry.blob.arrayBuffer());
    const nameBytes = new TextEncoder().encode(entry.name);
    const crc = crc32(bytes);
    const local = localFileHeader(nameBytes, bytes.length, crc);
    files.push({ local, bytes, nameBytes, crc, size: bytes.length, offset });
    offset += local.length + bytes.length;
  }

  const centralParts = [];
  let centralSize = 0;
  for (const file of files) {
    const central = centralDirectoryHeader(file);
    centralParts.push(central);
    centralSize += central.length;
  }

  const end = endOfCentralDirectory(files.length, centralSize, offset);
  const totalSize = offset + centralSize + end.length;
  const zip = new Uint8Array(totalSize);
  let cursor = 0;
  for (const file of files) {
    zip.set(file.local, cursor);
    cursor += file.local.length;
    zip.set(file.bytes, cursor);
    cursor += file.bytes.length;
  }
  for (const central of centralParts) {
    zip.set(central, cursor);
    cursor += central.length;
  }
  zip.set(end, cursor);
  return new Blob([zip], { type: "application/zip" });
}

function localFileHeader(nameBytes, size, crc) {
  const header = new Uint8Array(30 + nameBytes.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, dosTime(), true);
  view.setUint16(12, dosDate(), true);
  view.setUint32(14, crc, true);
  view.setUint32(18, size, true);
  view.setUint32(22, size, true);
  view.setUint16(26, nameBytes.length, true);
  view.setUint16(28, 0, true);
  header.set(nameBytes, 30);
  return header;
}

function centralDirectoryHeader(file) {
  const header = new Uint8Array(46 + file.nameBytes.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, dosTime(), true);
  view.setUint16(14, dosDate(), true);
  view.setUint32(16, file.crc, true);
  view.setUint32(20, file.size, true);
  view.setUint32(24, file.size, true);
  view.setUint16(28, file.nameBytes.length, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, file.offset, true);
  header.set(file.nameBytes, 46);
  return header;
}

function endOfCentralDirectory(count, centralSize, centralOffset) {
  const header = new Uint8Array(22);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, count, true);
  view.setUint16(10, count, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, centralOffset, true);
  view.setUint16(20, 0, true);
  return header;
}

function dosTime() {
  const now = new Date();
  return (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
}

function dosDate() {
  const now = new Date();
  return ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
