import { PhysicsEngine } from './physics.js';

const physics = new PhysicsEngine();

// Elemen Canvas
const simCanvas = document.getElementById('simCanvas');
const ctxSim = simCanvas.getContext('2d');
const energyChartCanvas = document.getElementById('energyChart');
const ctxChart = energyChartCanvas.getContext('2d');

// Elemen Kontrol Form
const selectSistem = document.getElementById('selectSistem');
const inputMassa = document.getElementById('inputMassa');
const inputGrav = document.getElementById('inputGrav');
const inputV0 = document.getElementById('inputV0');

const inputParam1 = document.getElementById('inputParam1');
const inputParam2 = document.getElementById('inputParam2');
const inputParam3 = document.getElementById('inputParam3');
const inputParam4 = document.getElementById('inputParam4');

const labelParam1 = document.getElementById('labelParam1');
const labelParam2 = document.labelParam2 || document.getElementById('labelParam2');
const labelParam3 = document.labelParam3 || document.getElementById('labelParam3');

const btnPlay = document.getElementById('btnPlay');
const btnReset = document.getElementById('btnReset');
const badgeSistem = document.getElementById('badgeSistem');
const statusAnimasi = document.getElementById('statusAnimasi');

// Elemen Real-time Output
const valTime = document.getElementById('valTime');
const valVelocity = document.getElementById('valVelocity');
const valHeight = document.getElementById('valHeight');
const valEp = document.getElementById('valEp');
const valEk = document.getElementById('valEk');
const valEm = document.getElementById('valEm');
const valW = document.getElementById('valW');
const valPower = document.getElementById('valPower');

// Elemen OBE
const obeFormulasi = document.getElementById('obeFormulasi');
const obeCalculation = document.getElementById('obeCalculation');
const selectBesaranDicari = document.getElementById('selectBesaranDicari');
const btnSolveOBE = document.getElementById('btnSolveOBE');
const obeSolverResult = document.getElementById('obeSolverResult');

// History Data untuk Grafik Energi
let chartHistory = [];

// Label Dynamic Forms
function updateFormLabels() {
    const sys = selectSistem.value;
    document.getElementById('groupParam2').style.display = "flex";
    document.getElementById('groupParam3').style.display = "flex";
    document.getElementById('groupParam4').style.display = "none";

    if (sys === "jatuhBebas") {
        badgeSistem.innerText = "Gerak Jatuh Bebas";
        labelParam1.innerText = "Ketinggian Awal (h₀) [m]:";
        document.getElementById('groupParam2').style.display = "none";
        document.getElementById('groupParam3').style.display = "none";
    } else if (sys === "bidangMiringGesek") {
        badgeSistem.innerText = "Bidang Miring + Gesekan";
        labelParam1.innerText = "Panjang Lintasan (L) [m]:";
        labelParam2.innerText = "Sudut Kemiringan (θ) [°]:";
        labelParam3.innerText = "Koefisien Gesek (µ):";
    } else if (sys === "bandul") {
        badgeSistem.innerText = "Bandul Sederhana";
        labelParam1.innerText = "Panjang Tali (L) [m]:";
        labelParam2.innerText = "Simpangan Awal (θ₀) [°]:";
        document.getElementById('groupParam3').style.display = "none";
    } else if (sys === "angkatBeban") {
        badgeSistem.innerText = "Mengangkat Beban";
        labelParam1.innerText = "Ketinggian Target (h) [m]:";
        document.getElementById('groupParam2').style.display = "none";
        document.getElementById('groupParam3').style.display = "none";
        document.getElementById('groupParam4').style.display = "flex";
    }

    syncParameters(true);
}

function syncParameters(resetPos = false) {
    const sys = selectSistem.value;
    const m = parseFloat(inputMassa.value);
    const g = parseFloat(inputGrav.value);
    const v0 = parseFloat(inputV0.value);
    const p1 = parseFloat(inputParam1.value);
    const p2 = parseFloat(inputParam2.value);
    const p3 = parseFloat(inputParam3.value);
    const p4 = parseFloat(inputParam4.value);

    physics.setConfiguration(sys, m, g, v0, p1, p2, p3, p4);

    if (resetPos) {
        chartHistory = [];
        const initialState = physics.getStateAtTime(0);
        renderSimulation(initialState);
        renderChart();
        updateOBEFormulation();
    }
}

// Event Listeners Input
selectSistem.addEventListener('change', updateFormLabels);
[inputMassa, inputGrav, inputV0, inputParam1, inputParam2, inputParam3, inputParam4].forEach(elem => {
    if (elem) elem.addEventListener('input', () => syncParameters(true));
});

btnPlay.addEventListener('click', () => {
    physics.isRunning = !physics.isRunning;
    btnPlay.innerText = physics.isRunning ? "⏸️ Pause" : "▶️ Mulai / Pause";
});

btnReset.addEventListener('click', () => {
    physics.isRunning = false;
    btnPlay.innerText = "▶️ Mulai / Pause";
    syncParameters(true);
});

btnSolveOBE.addEventListener('click', () => {
    const category = selectBesaranDicari.value;
    const res = physics.solveOBE(category);

    obeSolverResult.innerHTML = `
        <b>📌 Diketahui:</b> ${res.diketahui}<br>
        <b>❓ Ditanyakan:</b> ${res.ditanyakan}<br>
        <b>📐 Formulasi:</b> ${res.formulasi}<br>
        <b>🔢 Perhitungan:</b> ${res.perhitungan || 'Diproses dalam simulasi'}<br>
        <b>✅ Hasil Akhir:</b> <span style="color:#27ae60; font-weight:bold;">${res.hasil}</span><br>
        <b>💡 Kesimpulan OBE:</b> ${res.kesimpulan}
    `;
});

// Update Teks Formulasi OBE berdasarkan Sistem
function updateOBEFormulation() {
    const sys = selectSistem.value;
    let html = "";

    if (sys === "jatuhBebas") {
        html = `
            • <b>Hukum Kekekalan Energi Mekanik:</b> $Em_1 = Em_2 \\rightarrow Ep_1 + Ek_1 = Ep_2 + Ek_2$<br>
            • <b>Energi Potensial:</b> $Ep = m \\cdot g \\cdot h$<br>
            • <b>Energi Kinetik:</b> $Ek = \\frac{1}{2} m \\cdot v^2$<br>
            • <b>Usaha Gravitasi:</b> $W = \\Delta Ek = -\\Delta Ep = m \\cdot g \\cdot (h_0 - h)$
        `;
    } else if (sys === "bidangMiringGesek") {
        html = `
            • <b>Tinggi Vertikal:</b> $h = L \\cdot \\sin(\\theta)$<br>
            • <b>Gaya Normal:</b> $F_N = m \\cdot g \\cdot \\cos(\\theta)$<br>
            • <b>Gaya Gesek Kinetis:</b> $f_k = \\mu \\cdot F_N$<br>
            • <b>Usaha Gaya Gesek (Disipasi Energi):</b> $W_{gesek} = f_k \\cdot s$<br>
            • <b>Perubahan Energi Mekanik:</b> $Em_{akhir} = Em_{awal} - W_{gesek}$
        `;
    } else if (sys === "bandul") {
        html = `
            • <b>Pendekatan Sudut Kecil ($\theta \\le 15^\circ$):</b> Gerak Harmonik Sederhana (GHS)<br>
            • <b>Beda Ketinggian Bandul:</b> $h = L \\cdot (1 - \\cos\\theta)$<br>
            • <b>Energi Kinetik Maksimum:</b> Berada pada titik terendah (setara Ep maksimum di simpangan terbesar).
        `;
    } else if (sys === "angkatBeban") {
        html = `
            • <b>Usaha Mengangkat Beban:</b> $W = F \\cdot h = m \\cdot g \\cdot h$<br>
            • <b>Daya Rata-rata:</b> $P = \\frac{W}{t} = \\frac{m \\cdot g \\cdot h}{t}$
        `;
    }

    obeFormulasi.innerHTML = html;
}

// Render Animasi Simulasi Kanvas
function renderSimulation(state) {
    ctxSim.clearRect(0, 0, simCanvas.width, simCanvas.height);
    const meta = state.canvasMeta;
    if (!meta) return;

    if (meta.type === "jatuhBebas") {
        const groundY = 360;
        const topY = 60;
        const maxH = meta.maxH || 10;
        const scale = (groundY - topY) / maxH;

        const ballY = groundY - state.height * scale;
        const ballX = simCanvas.width / 2;

        // Gambar Tanah
        ctxSim.fillStyle = '#64748b';
        ctxSim.fillRect(100, groundY, simCanvas.width - 200, 15);

        // Gambar Lintasan Putus-putus
        ctxSim.strokeStyle = '#cbd5e1';
        ctxSim.setLineDash([5, 5]);
        ctxSim.beginPath();
        ctxSim.moveTo(ballX, topY);
        ctxSim.lineTo(ballX, groundY);
        ctxSim.stroke();
        ctxSim.setLineDash([]);

        // Gambar Bola
        ctxSim.beginPath();
        ctxSim.arc(ballX, ballY, 16, 0, Math.PI * 2);
        ctxSim.fillStyle = '#e67e22';
        ctxSim.fill();
        ctxSim.lineWidth = 2;
        ctxSim.strokeStyle = '#d35400';
        ctxSim.stroke();

        // Vektor Kecepatan v
        if (state.velocity > 0) {
            drawArrow(ctxSim, ballX, ballY, ballX, ballY + Math.min(60, state.velocity * 3), '#e74c3c', `v = ${state.velocity.toFixed(1)} m/s`);
        }

    } else if (meta.type === "bidangMiringGesek") {
        const startX = 80, startY = 100;
        const thetaRad = (meta.theta * Math.PI) / 180;
        const screenLen = 380;
        const endX = startX + screenLen * Math.cos(thetaRad);
        const endY = startY + screenLen * Math.sin(thetaRad);

        // Draw Segitiga Bidang Miring
        ctxSim.beginPath();
        ctxSim.moveTo(startX, startY);
        ctxSim.lineTo(endX, endY);
        ctxSim.lineTo(endX, 360);
        ctxSim.lineTo(startX, 360);
        ctxSim.closePath();
        ctxSim.fillStyle = '#f1f5f9';
        ctxSim.fill();
        ctxSim.strokeStyle = '#334155';
        ctxSim.lineWidth = 3;
        ctxSim.stroke();

        // Posisi Benda
        const ratio = Math.min(1, meta.dist / meta.length);
        const objX = startX + (endX - startX) * ratio;
        const objY = startY + (endY - startY) * ratio;

        // Gambar Benda
        ctxSim.save();
        ctxSim.translate(objX, objY);
        ctxSim.rotate(thetaRad);
        ctxSim.fillStyle = '#e74c3c';
        ctxSim.fillRect(-15, -20, 30, 20);
        ctxSim.strokeRect(-15, -20, 30, 20);
        ctxSim.restore();

        // Gambar Vektor Gaya
        drawArrow(ctxSim, objX, objY, objX, objY + 45, '#2980b9', 'Fg'); // Gravitasi
        drawArrow(ctxSim, objX, objY, objX - 35 * Math.sin(thetaRad), objY - 35 * Math.cos(thetaRad), '#27ae60', 'FN'); // Normal
        if (meta.fk > 0) {
            drawArrow(ctxSim, objX, objY, objX - 30 * Math.cos(thetaRad), objY - 30 * Math.sin(thetaRad), '#c0392b', 'fk'); // Gesek
        }

    } else if (meta.type === "bandul") {
        const pivotX = simCanvas.width / 2, pivotY = 70;
        const scaleL = 220;
        const bobX = pivotX + scaleL * Math.sin(meta.angleRad);
        const bobY = pivotY + scaleL * Math.cos(meta.angleRad);

        // Dudukan Bandul
        ctxSim.fillStyle = '#475569';
        ctxSim.fillRect(pivotX - 40, pivotY - 10, 80, 10);

        // Tali
        ctxSim.strokeStyle = '#1e293b';
        ctxSim.lineWidth = 2;
        ctxSim.beginPath();
        ctxSim.moveTo(pivotX, pivotY);
        ctxSim.lineTo(bobX, bobY);
        ctxSim.stroke();

        // Bob Bandul
        ctxSim.beginPath();
        ctxSim.arc(bobX, bobY, 18, 0, Math.PI * 2);
        ctxSim.fillStyle = '#3498db';
        ctxSim.fill();
        ctxSim.stroke();

    } else if (meta.type === "angkatBeban") {
        const groundY = 360;
        const topY = 80;
        const maxH = meta.maxH || 10;
        const scale = (groundY - topY) / maxH;

        const boxY = groundY - state.height * scale;
        const boxX = simCanvas.width / 2;

        // Katrol / Tali Pengangkat
        ctxSim.strokeStyle = '#94a3b8';
        ctxSim.lineWidth = 3;
        ctxSim.beginPath();
        ctxSim.moveTo(boxX, 30);
        ctxSim.lineTo(boxX, boxY);
        ctxSim.stroke();

        // Beban
        ctxSim.fillStyle = '#8e44ad';
        ctxSim.fillRect(boxX - 25, boxY - 25, 50, 50);
        ctxSim.strokeStyle = '#2c3e50';
        ctxSim.strokeRect(boxX - 25, boxY - 25, 50, 50);

        // Vektor Gaya Tarik Usaha
        drawArrow(ctxSim, boxX, boxY - 25, boxX, boxY - 65, '#27ae60', `F = ${meta.F.toFixed(1)} N`);
    }

    // Update Output Realtime UI
    valTime.innerText = `${state.time.toFixed(2)} s`;
    valVelocity.innerText = `${state.velocity.toFixed(2)} m/s`;
    valHeight.innerText = `${state.height.toFixed(2)} m`;
    valEp.innerText = `${state.Ep.toFixed(2)} J`;
    valEk.innerText = `${state.Ek.toFixed(2)} J`;
    valEm.innerText = `${state.Em.toFixed(2)} J`;
    valW.innerText = `${state.W.toFixed(2)} J`;
    valPower.innerText = `${state.Power.toFixed(2)} W`;

    statusAnimasi.innerText = state.isFinished ? "🏁 Simulasi Selesai" : (physics.isRunning ? "▶️ Simulasi Berjalan..." : "⏸️ Pause / Dihentikan");

    // Update Step Calculation OBE
    obeCalculation.innerHTML = `
        • <b>Ep (m·g·h):</b> ${physics.m} × ${physics.g} × ${state.height.toFixed(2)} = <b>${state.Ep.toFixed(2)} J</b><br>
        • <b>Ek (½·m·v²):</b> 0.5 × ${physics.m} × (${state.velocity.toFixed(2)})² = <b>${state.Ek.toFixed(2)} J</b><br>
        • <b>Em Total (Ep + Ek):</b> ${state.Ep.toFixed(2)} + ${state.Ek.toFixed(2)} = <b>${state.Em.toFixed(2)} J</b>
    `;

    // Rekam Histori Grafik Energi
    if (physics.isRunning) {
        chartHistory.push({ t: state.time, Ep: state.Ep, Ek: state.Ek, Em: state.Em });
        if (chartHistory.length > 200) chartHistory.shift();
    }
}

// Utility: Gambar Vektor Panah
function drawArrow(ctx, fromX, fromY, toX, toY, color, label) {
    const headlen = 8;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    if (label) {
        ctx.font = '11px sans-serif';
        ctx.fillText(label, toX + 5, toY);
    }
}

// Render Grafik Energi Native Canvas Real-Time
function renderChart() {
    ctxChart.clearRect(0, 0, energyChartCanvas.width, energyChartCanvas.height);

    const w = energyChartCanvas.width;
    const h = energyChartCanvas.height;
    const pad = 30;

    // Grid Sumbu
    ctxChart.strokeStyle = '#e2e8f0';
    ctxChart.lineWidth = 1;
    ctxChart.beginPath();
    ctxChart.moveTo(pad, pad);
    ctxChart.lineTo(pad, h - pad);
    ctxChart.lineTo(w - pad, h - pad);
    ctxChart.stroke();

    if (chartHistory.length < 2) return;

    const maxT = Math.max(5, chartHistory[chartHistory.length - 1].t);
    const maxE = Math.max(10, ...chartHistory.map(d => d.Em));

    function getX(t) { return pad + (t / maxT) * (w - 2 * pad); }
    function getY(e) { return (h - pad) - (e / maxE) * (h - 2 * pad); }

    // Ploting Ep
    drawLine(chartHistory.map(d => ({ x: getX(d.t), y: getY(d.Ep) })), '#3498db');
    // Ploting Ek
    drawLine(chartHistory.map(d => ({ x: getX(d.t), y: getY(d.Ek) })), '#e67e22');
    // Ploting Em
    drawLine(chartHistory.map(d => ({ x: getX(d.t), y: getY(d.Em) })), '#2ecc71');
}

function drawLine(points, color) {
    ctxChart.strokeStyle = color;
    ctxChart.lineWidth = 2;
    ctxChart.beginPath();
    points.forEach((pt, i) => {
        if (i === 0) ctxChart.moveTo(pt.x, pt.y);
        else ctxChart.lineTo(pt.x, pt.y);
    });
    ctxChart.stroke();
}

// Animation Loop Utama
let lastTime = performance.now();
function mainLoop(currentTime) {
    let dt = (currentTime - lastTime) / 1000.0;
    if (dt > 0.1) dt = 0.016;
    lastTime = currentTime;

    const state = physics.update(dt);
    renderSimulation(state);
    renderChart();

    requestAnimationFrame(mainLoop);
}

// Inisialisasi
updateFormLabels();
requestAnimationFrame(mainLoop);