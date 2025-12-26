// ---------------------------
// State
// ---------------------------
/** @type {{timeStr:string, minutes:number, temp:number}[]} */
let readings = [];
let baseDate = null; // Date of first reading (today with HH:MM)

// ---------------------------
// Helpers
// ---------------------------
function parseTimeToDate(timeStr) {
  const [hh, mm] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setSeconds(0, 0);
  d.setHours(hh, mm, 0, 0);
  return d;
}

function minutesBetween(d1, d0) {
  return (d1.getTime() - d0.getTime()) / 60000;
}

// Solve 3x3 linear system A x = b using Gaussian elimination
function solve3x3(A, b) {
  const M = [
    [A[0][0], A[0][1], A[0][2], b[0]],
    [A[1][0], A[1][1], A[1][2], b[1]],
    [A[2][0], A[2][1], A[2][2], b[2]],
  ];

  for (let col = 0; col < 3; col++) {
    let pivotRow = col;
    for (let r = col + 1; r < 3; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivotRow][col])) pivotRow = r;
    }
    if (Math.abs(M[pivotRow][col]) < 1e-12) return null;
    if (pivotRow !== col) [M[col], M[pivotRow]] = [M[pivotRow], M[col]];

    const pivot = M[col][col];
    for (let c = col; c < 4; c++) M[col][c] /= pivot;

    for (let r = 0; r < 3; r++) {
      if (r === col) continue;
      const factor = M[r][col];
      for (let c = col; c < 4; c++) M[r][c] -= factor * M[col][c];
    }
  }
  return [M[0][3], M[1][3], M[2][3]];
}

function fitQuadraticOLS(points) {
  // y = a + b x + c x^2
  const n = points.length;
  let S0 = n, S1 = 0, S2 = 0, S3 = 0, S4 = 0;
  let T0 = 0, T1 = 0, T2 = 0;

  for (const p of points) {
    const x = p.x, y = p.y;
    const x2 = x*x;
    S1 += x;
    S2 += x2;
    S3 += x2*x;
    S4 += x2*x2;
    T0 += y;
    T1 += x*y;
    T2 += x2*y;
  }

  const A = [
    [S0, S1, S2],
    [S1, S2, S3],
    [S2, S3, S4],
  ];
  const b = [T0, T1, T2];
  const sol = solve3x3(A, b);
  if (!sol) return null;
  const [a, bb, c] = sol;
  return { a, b: bb, c };
}

function predictDoneTimeMinutes(model, target, lastX) {
  // Solve c x^2 + b x + (a - target) = 0
  const { a, b, c } = model;
  const d = a - target;

  if (Math.abs(c) < 1e-10) {
    if (Math.abs(b) < 1e-10) return null;
    const x = -d / b;
    return (x > lastX) ? x : null;
  }

  const disc = b*b - 4*c*d;
  if (disc < 0) return null;
  const sqrt = Math.sqrt(disc);

  const x1 = (-b + sqrt) / (2*c);
  const x2 = (-b - sqrt) / (2*c);

  const candidates = [x1, x2].filter(x => Number.isFinite(x) && x > lastX + 0.01);
  if (candidates.length === 0) return null;
  return Math.min(...candidates);
}

function formatClockTimeFromBase(base, minutesFromBase) {
  const d = new Date(base.getTime() + minutesFromBase * 60000);
  const hh = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ampm = hh >= 12 ? "pm" : "am";
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${mm}${ampm}`;
}

function evalModel(model, x) {
  return model.a + model.b * x + model.c * x * x;
}

function getFinalTarget() {
  const v = Number(els.targetTempFinal.value);
  return Number.isFinite(v) ? v : 140;
}

function getCarryover() {
  const v = Number(els.carryoverF.value);
  return Number.isFinite(v) ? v : 0;
}

function getEffectiveTarget() {
  const finalT = getFinalTarget();
  if (!els.useCarryover.checked) return finalT;
  return finalT - getCarryover();
}

// ---------------------------
// UI
// ---------------------------
const els = {
  targetPreset: document.getElementById("targetPreset"),
  targetTempFinal: document.getElementById("targetTempFinal"),
  useCarryover: document.getElementById("useCarryover"),
  carryoverF: document.getElementById("carryoverF"),
  targetExplain: document.getElementById("targetExplain"),

  readingTime: document.getElementById("readingTime"),
  readingTemp: document.getElementById("readingTemp"),
  addBtn: document.getElementById("addBtn"),
  clearBtn: document.getElementById("clearBtn"),

  table: document.getElementById("readingTable"),
  count: document.getElementById("readingCount"),

  etaPill: document.getElementById("etaPill"),
  currentStatus: document.getElementById("currentStatus"),
  chartLegend: document.getElementById("chartLegend"),
  fitInfo: document.getElementById("fitInfo"),
  chart: document.getElementById("chart"),
};

function setPill(text, kind) {
  els.etaPill.textContent = text;
  els.etaPill.classList.remove("warn", "bad");
  if (kind) els.etaPill.classList.add(kind);
}

function getDonenessBand(temp) {
  // Simple doneness labels for beef-ish temps
  if (temp < 120) return "very rare";
  if (temp < 130) return "rare";
  if (temp < 140) return "medium-rare";
  if (temp < 150) return "medium";
  if (temp < 160) return "medium-well";
  if (temp < 170) return "well done";
  return "very well done";
}

function renderTargetExplain() {
  const finalT = getFinalTarget();
  if (!els.useCarryover.checked) {
    els.targetExplain.textContent = `Effective target: ${finalT.toFixed(1)}°F (no carryover)`;
  } else {
    const eff = getEffectiveTarget();
    els.targetExplain.textContent =
      `Effective target (pull temp): ${eff.toFixed(1)}°F = ${finalT.toFixed(1)} − ${getCarryover().toFixed(1)}`;
  }
}

function renderTable() {
  els.table.innerHTML = "";
  readings
    .slice()
    .sort((a,b) => a.minutes - b.minutes)
    .forEach((r, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.timeStr}</td>
        <td class="right">${r.temp.toFixed(1)}</td>
        <td class="right">${r.minutes.toFixed(1)}</td>
        <td class="right"><button class="secondary" data-idx="${idx}">X</button></td>
      `;
      tr.querySelector("button").addEventListener("click", () => {
        readings.splice(idx, 1);
        if (readings.length === 0) baseDate = null;
        renderAll();
      });
      els.table.appendChild(tr);
    });
  els.count.textContent = `${readings.length}`;
}

// Draw points + predicted glide path
function drawChart(points, model, target, glidePoints) {
  const ctx = els.chart.getContext("2d");
  
  // Set canvas size to match container to avoid stretching
  const container = els.chart.parentElement;
  const displayWidth = container.clientWidth;
  const displayHeight = container.clientHeight;
  
  // Set canvas buffer size to match display size (prevents stretching)
  if (els.chart.width !== displayWidth || els.chart.height !== displayHeight) {
    els.chart.width = displayWidth;
    els.chart.height = displayHeight;
  }
  
  const W = els.chart.width, H = els.chart.height;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0b1220";
  ctx.fillRect(0, 0, W, H);

  if (points.length === 0) return;

  // Determine bounds using points + glide path + target
  const all = glidePoints && glidePoints.length ? points.concat(glidePoints) : points.slice();
  const xs = all.map(p => p.x);
  const ys = all.map(p => p.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys, target);
  const maxY = Math.max(...ys, target);

  const pad = 28;
  const x0 = pad, y0 = H - pad, x1 = W - pad, y1 = pad;

  const xScale = (x) => {
    const t = (x - minX) / Math.max(1e-9, (maxX - minX));
    return x0 + t * (x1 - x0);
  };
  const yScale = (y) => {
    const t = (y - minY) / Math.max(1e-9, (maxY - minY));
    return y0 - t * (y0 - y1);
  };

  // Axes
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y0); ctx.lineTo(x1, y0);
  ctx.moveTo(x0, y0); ctx.lineTo(x0, y1);
  ctx.stroke();

  // Target line
  ctx.strokeStyle = "rgba(16,185,129,0.65)";
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(x0, yScale(target));
  ctx.lineTo(x1, yScale(target));
  ctx.stroke();
  ctx.setLineDash([]);

  // Glide path: 1-min points from start through ETA+10
  if (glidePoints && glidePoints.length) {
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < glidePoints.length; i++) {
      const gp = glidePoints[i];
      const X = xScale(gp.x);
      const Y = yScale(gp.y);
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    }
    ctx.stroke();
  } else if (model) {
    // fallback: draw just within observed range
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    const steps = 120;
    for (let i = 0; i <= steps; i++) {
      const x = minX + (i/steps) * (maxX - minX);
      const y = evalModel(model, x);
      const X = xScale(x), Y = yScale(y);
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.stroke();
  }

  // Points - draw fire emoji instead of white dots
  ctx.font = "28px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const pointCoords = []; // Store for hover detection
  for (const p of points) {
    const X = xScale(p.x);
    const Y = yScale(p.y);
    ctx.fillText("🔥", X, Y);
    pointCoords.push({ x: X, y: Y, dataX: p.x, dataY: p.y });
  }
  
  // Store chart state for hover
  els.chart.chartData = { pointCoords, xScale, yScale, baseDate };
}

function buildGlidePoints(model, endMinuteInclusive) {
  // t = 0..endMinuteInclusive at 1-min increments
  const out = [];
  const end = Math.max(0, Math.round(endMinuteInclusive));
  for (let t = 0; t <= end; t += 1) {
    out.push({ x: t, y: evalModel(model, t) });
  }
  return out;
}

function renderAll() {
  renderTargetExplain();
  renderTable();

  const target = getEffectiveTarget();
  const finalTarget = getFinalTarget();
  const useCarryover = els.useCarryover.checked;
  const points = readings.slice().sort((a,b) => a.minutes - b.minutes).map(r => ({ x: r.minutes, y: r.temp }));

  // Hide current status and legend by default
  els.currentStatus.style.display = "none";
  els.chartLegend.style.display = "none";

  if (readings.length < 3) {
    setPill("Not enough data yet", "warn");
    els.fitInfo.textContent = "Fit: —";
    drawChart(points, null, target, null);
    return;
  }

  const model = fitQuadraticOLS(points);
  if (!model) {
    setPill("Fit failed", "bad");
    els.fitInfo.textContent = "Fit: failed";
    drawChart(points, null, target, null);
    return;
  }

  const lastX = points[points.length - 1].x;
  const xDone = predictDoneTimeMinutes(model, target, lastX);
  const slopeAtEnd = model.b + 2*model.c*lastX;
  const isHeating = slopeAtEnd > 0;

  let glideEnd = Math.max(lastX, 0);
  if (xDone) glideEnd = Math.max(glideEnd, xDone + 10); // extend 10 min past target reach
  const glidePoints = buildGlidePoints(model, glideEnd);

  // Current status logic (with timezone/sanity checks)
  if (baseDate) {
    const now = new Date();
    const nowMinutes = minutesBetween(now, baseDate);
    // Only show if "now" is reasonable: after first reading but not absurdly far in future
    if (nowMinutes >= 0 && nowMinutes <= lastX + 120) { // within 2 hours of last reading
      const predictedNowTemp = evalModel(model, nowMinutes);
      // Sanity check: reasonable cooking temp range
      if (predictedNowTemp > 0 && predictedNowTemp < 300) {
        const doneness = getDonenessBand(predictedNowTemp);
        els.currentStatus.textContent = `Predicted now: ~${predictedNowTemp.toFixed(1)}°F (${doneness})`;
        els.currentStatus.style.display = "block";
      }
    }
  }

  // Pill messages with CookedYet branding
  if (!xDone) {
    setPill(isHeating ? "No clear ETA yet" : "Not heating yet", isHeating ? "warn" : "bad");
  } else {
    const pullTime = formatClockTimeFromBase(baseDate, xDone);
    
    if (useCarryover) {
      // Calculate rest time (assume 5 min for now, could be dynamic)
      const restMinutes = 5;
      const doneTime = formatClockTimeFromBase(baseDate, xDone + restMinutes);
      setPill(`Not cooked yet — pull ${pullTime}, rest until ${doneTime}`, "");
    } else {
      setPill(`Not cooked yet — done around ${pullTime}`, "");
    }
  }

  // Chart legend
  const targetLabel = useCarryover ? "pull temp" : "done temp";
  els.chartLegend.innerHTML = `🔥 readings  <span style="display:inline-block; background:#333; padding:2px 8px; border-radius:3px; color:#fff;">——</span> fitted curve  <span style="color: #10b981;">— — —</span> ${targetLabel} (${target.toFixed(1)}°F)`;
  els.chartLegend.style.display = "block";

  els.fitInfo.textContent =
    `Fit: T(t)= ${model.a.toFixed(2)} + ${model.b.toFixed(4)}·t + ${model.c.toFixed(6)}·t²  |  ` +
    `end slope ≈ ${slopeAtEnd.toFixed(3)} °F/min  |  target=${target.toFixed(1)}°F`;

  drawChart(points, model, target, glidePoints);
}

// ---------------------------
// Events
// ---------------------------
els.targetPreset.addEventListener("change", () => {
  if (els.targetPreset.value !== "custom") {
    els.targetTempFinal.value = els.targetPreset.value;
  }
  renderAll();
});

els.targetTempFinal.addEventListener("input", renderAll);
els.useCarryover.addEventListener("change", renderAll);
els.carryoverF.addEventListener("input", renderAll);

els.addBtn.addEventListener("click", () => {
  const timeStr = els.readingTime.value;
  const tempStr = els.readingTemp.value;

  const temp = Number(tempStr);
  if (!timeStr) { alert("Enter a time (HH:MM)."); return; }
  if (!Number.isFinite(temp)) { alert("Enter a valid temperature."); return; }

  const d = parseTimeToDate(timeStr);
  if (!baseDate) baseDate = d;

  const minutes = minutesBetween(d, baseDate);
  if (minutes < 0) {
    alert("That time is earlier than the first reading. Keep readings from the same day / after first reading.");
    return;
  }

  readings.push({ timeStr, minutes, temp });
  els.readingTemp.value = "";
  renderAll();
});

els.clearBtn.addEventListener("click", () => {
  readings = [];
  baseDate = null;
  renderAll();
});

// Canvas hover for tooltips
els.chart.addEventListener("mousemove", (e) => {
  const rect = els.chart.getBoundingClientRect();
  const scaleX = els.chart.width / rect.width;
  const scaleY = els.chart.height / rect.height;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;
  
  const chartData = els.chart.chartData;
  if (!chartData || !chartData.pointCoords) return;
  
  const ctx = els.chart.getContext("2d");
  
  // Find nearby point
  let hoveredPoint = null;
  const hoverRadius = 15;
  for (const pt of chartData.pointCoords) {
    const dist = Math.sqrt((mouseX - pt.x) ** 2 + (mouseY - pt.y) ** 2);
    if (dist < hoverRadius) {
      hoveredPoint = pt;
      break;
    }
  }
  
  if (hoveredPoint) {
    els.chart.style.cursor = "pointer";
    
    // Redraw chart to clear old tooltip
    const currentChart = els.chart.chartData;
    if (currentChart.lastHoveredPoint !== hoveredPoint) {
      // Find the original reading data
      const reading = readings.find(r => Math.abs(r.minutes - hoveredPoint.dataX) < 0.01 && Math.abs(r.temp - hoveredPoint.dataY) < 0.01);
      if (reading) {
        // Draw tooltip
        ctx.save();
        ctx.font = "14px system-ui, -apple-system, sans-serif";
        const text1 = `Time: ${reading.timeStr}`;
        const text2 = `Temp: ${reading.temp.toFixed(1)}°F`;
        const maxWidth = Math.max(ctx.measureText(text1).width, ctx.measureText(text2).width);
        const tooltipW = maxWidth + 20;
        const tooltipH = 48;
        let tooltipX = hoveredPoint.x + 15;
        let tooltipY = hoveredPoint.y - 10;
        
        // Keep tooltip in bounds
        if (tooltipX + tooltipW > els.chart.width - 10) tooltipX = hoveredPoint.x - tooltipW - 15;
        if (tooltipY + tooltipH > els.chart.height - 10) tooltipY = hoveredPoint.y - tooltipH - 10;
        
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(tooltipX, tooltipY, tooltipW, tooltipH);
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1;
        ctx.strokeRect(tooltipX, tooltipY, tooltipW, tooltipH);
        
        ctx.fillStyle = "#fff";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(text1, tooltipX + 8, tooltipY + 8);
        ctx.fillText(text2, tooltipX + 8, tooltipY + 24);
        ctx.restore();
        
        currentChart.lastHoveredPoint = hoveredPoint;
      }
    }
  } else {
    els.chart.style.cursor = "default";
    if (chartData.lastHoveredPoint) {
      chartData.lastHoveredPoint = null;
      renderAll(); // Redraw to clear tooltip
    }
  }
});

// Seed time input to "now"
(function init() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  els.readingTime.value = `${hh}:${mm}`;
  renderAll();
  
  // Show coffee button after 5 seconds
  setTimeout(() => {
    const coffeeBtn = document.getElementById("coffeeButton");
    if (coffeeBtn) coffeeBtn.classList.add("show");
  }, 5000); // 5 seconds
})();
