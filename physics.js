/**
 * PhysicsEngine - Engine Perhitungan Fisika Mekanika Berbasis OBE
 * Memperhitungkan Jatuh Bebas (dengan v0), Bidang Miring + Gesekan, Bandul, dan Mengangkat Beban.
 */
export class PhysicsEngine {
    constructor() {
        this.sistem = "jatuhBebas";
        this.m = 2.0;
        this.g = 10.0;
        this.v0 = 0.0;
        this.param1 = 10.0; // h0 atau L
        this.param2 = 30.0; // theta (deg)
        this.param3 = 0.15; // mu
        this.param4 = 5.0;  // t target untuk angkat beban

        this.time = 0;
        this.maxTime = 5;
        this.isRunning = false;

        this.resetState();
    }

    setConfiguration(sistem, m, g, v0, p1, p2, p3, p4) {
        this.sistem = sistem;
        this.m = (isNaN(m) || m <= 0) ? 1.0 : m;
        this.g = (isNaN(g) || g < 0) ? 10.0 : g;
        this.v0 = (isNaN(v0) || v0 < 0) ? 0.0 : v0;
        this.param1 = (isNaN(p1) || p1 <= 0) ? 5.0 : p1;
        this.param2 = isNaN(p2) ? 30.0 : p2;
        this.param3 = (isNaN(p3) || p3 < 0) ? 0.0 : p3;
        this.param4 = (isNaN(p4) || p4 <= 0) ? 5.0 : p4;

        this.resetState();
    }

    resetState() {
        this.time = 0;
        this.isRunning = false;
        this.calculateMaxTime();
    }

    calculateMaxTime() {
        if (this.sistem === "jatuhBebas") {
            const h0 = this.param1;
            // h(t) = h0 - v0*t - 0.5*g*t^2 = 0
            // 0.5*g*t^2 + v0*t - h0 = 0
            const a = 0.5 * this.g;
            const b = this.v0;
            const c = -h0;
            const D = b * b - 4 * a * c;
            this.maxTime = D >= 0 ? (-b + Math.sqrt(D)) / (2 * a) : 5;
        } else if (this.sistem === "bidangMiringGesek") {
            const L = this.param1;
            const thetaRad = (this.param2 * Math.PI) / 180;
            const mu = this.param3;
            
            const gSin = this.g * Math.sin(thetaRad);
            const gCos = this.g * Math.cos(thetaRad);
            const f_k_acc = mu * gCos;
            const a_net = gSin - f_k_acc;

            if (a_net <= 0 && this.v0 === 0) {
                // Benda diam (gaya gesek statis menahan benda)
                this.maxTime = 5;
            } else {
                // s(t) = v0*t + 0.5*a*t^2 = L
                const a = 0.5 * Math.max(0, a_net);
                const b = this.v0;
                const c = -L;
                if (a === 0) {
                    this.maxTime = b > 0 ? L / b : 5;
                } else {
                    const D = b * b - 4 * a * c;
                    this.maxTime = D >= 0 ? (-b + Math.sqrt(D)) / (2 * a) : 5;
                }
            }
        } else if (this.sistem === "bandul") {
            const L = this.param1;
            // 1 Periode T = 2*pi*sqrt(L/g)
            this.maxTime = 2 * Math.PI * Math.sqrt(L / (this.g || 9.8));
        } else if (this.sistem === "angkatBeban") {
            this.maxTime = this.param4; // Waktu pengangkatan
        }
    }

    update(dt) {
        if (!this.isRunning) return this.getStateAtTime(this.time);

        this.time += dt;
        if (this.time >= this.maxTime) {
            this.time = this.maxTime;
            this.isRunning = false;
        }

        return this.getStateAtTime(this.time);
    }

    getStateAtTime(t) {
        let clampedT = Math.max(0, Math.min(t, this.maxTime));
        let h = 0, v = 0, Ep = 0, Ek = 0, Em = 0, W = 0, Power = 0;
        let canvasMeta = {};

        if (this.sistem === "jatuhBebas") {
            const h0 = this.param1;
            // Gerak jatuh bebas / lempar bawah
            h = Math.max(0, h0 - (this.v0 * clampedT + 0.5 * this.g * (clampedT ** 2)));
            v = this.v0 + this.g * clampedT;

            Ep = this.m * this.g * h;
            Ek = 0.5 * this.m * (v ** 2);
            Em = Ep + Ek;

            const displacement = h0 - h;
            const F = this.m * this.g;
            W = F * displacement; // Usaha gaya gravitasi
            Power = clampedT > 0 ? W / clampedT : 0;

            canvasMeta = { type: "jatuhBebas", h, maxH: h0 };

        } else if (this.sistem === "bidangMiringGesek") {
            const L = this.param1;
            const thetaDeg = Math.min(89, Math.max(1, this.param2));
            const mu = this.param3;
            const thetaRad = (thetaDeg * Math.PI) / 180;

            const gSin = this.g * Math.sin(thetaRad);
            const gCos = this.g * Math.cos(thetaRad);
            const a_net = Math.max(0, gSin - mu * gCos);

            let s = this.v0 * clampedT + 0.5 * a_net * (clampedT ** 2);
            if (s > L) s = L;

            v = Math.sqrt(this.v0 ** 2 + 2 * a_net * s);
            const h0 = L * Math.sin(thetaRad);
            h = Math.max(0, h0 - s * Math.sin(thetaRad));

            Ep = this.m * this.g * h;
            Ek = 0.5 * this.m * (v ** 2);
            Em = Ep + Ek; // Em berkurang karena gesekan

            const F_netto = this.m * a_net;
            W = F_netto * s; // Usaha total resultan
            Power = clampedT > 0 ? W / clampedT : 0;

            const Fg = this.m * this.g;
            const FN = Fg * Math.cos(thetaRad);
            const fk = mu * FN;

            canvasMeta = {
                type: "bidangMiringGesek",
                length: L,
                theta: thetaDeg,
                dist: s,
                Fg, FN, fk, a_net
            };

        } else if (this.sistem === "bandul") {
            const L = this.param1;
            const maxThetaDeg = Math.min(80, this.param2);
            const thetaMaxRad = (maxThetaDeg * Math.PI) / 180;

            const omega = Math.sqrt(this.g / L);
            const angle = thetaMaxRad * Math.cos(omega * clampedT);
            const thetaDot = -omega * thetaMaxRad * Math.sin(omega * clampedT);
            v = L * Math.abs(thetaDot);

            h = L * (1 - Math.cos(angle));
            Ep = this.m * this.g * h;
            Ek = 0.5 * this.m * (v ** 2);
            Em = Ep + Ek;

            W = Ek; // Perubahan Energi Kinetik
            Power = clampedT > 0 ? W / clampedT : 0;

            canvasMeta = { type: "bandul", L, angleRad: angle, maxThetaDeg };

        } else if (this.sistem === "angkatBeban") {
            const targetH = this.param1;
            const totalT = this.param4;
            
            // Pengangkatan dengan kecepatan konstan v = h / t_target
            const constV = targetH / totalT;
            h = Math.min(targetH, constV * clampedT);
            v = clampedT >= totalT ? 0 : constV;

            Ep = this.m * this.g * h;
            Ek = 0.5 * this.m * (v ** 2);
            Em = Ep + Ek;

            const F = this.m * this.g;
            W = F * h; // Usaha mengangkat W = m*g*h
            Power = clampedT > 0 ? W / clampedT : 0; // Daya rata-rata P = W/t

            canvasMeta = { type: "angkatBeban", h, maxH: targetH, F };
        }

        return {
            time: clampedT,
            maxTime: this.maxTime,
            height: h,
            velocity: v,
            Ep, Ek, Em, W, Power,
            isFinished: clampedT >= this.maxTime,
            canvasMeta
        };
    }

    // OBE Problem Solver: Menghitung Besaran Fisika Berdasarkan Input/Kategori
    solveOBE(targetCategory) {
        const m = this.m;
        const g = this.g;
        const h0 = this.param1;
        const v0 = this.v0;
        const t = this.maxTime;

        let res = {
            diketahui: `Massa (m) = ${m} kg, Gravitasi (g) = ${g} m/s²`,
            ditanyakan: "",
            formulasi: "",
            perhitungan: "",
            hasil: "",
            kesimpulan: ""
        };

        switch (targetCategory) {
            case "cariEp":
                res.ditanyakan = "Energi Potensial Maksimum (Ep)?";
                res.formulasi = "Ep = m × g × h";
                res.perhitungan = `Ep = ${m} kg × ${g} m/s² × ${h0} m`;
                const Ep = m * g * h0;
                res.hasil = `Ep = ${Ep.toFixed(2)} Joule`;
                res.kesimpulan = `Benda memiliki energi potensial maksimum sebesar ${Ep.toFixed(2)} Joule pada ketinggian awal ${h0} meter.`;
                break;
            case "cariEk":
                res.ditanyakan = "Energi Kinetik Awal (Ek0)?";
                res.formulasi = "Ek = ½ × m × v₀²";
                res.perhitungan = `Ek = 0.5 × ${m} kg × (${v0} m/s)²`;
                const Ek = 0.5 * m * (v0 ** 2);
                res.hasil = `Ek = ${Ek.toFixed(2)} Joule`;
                res.kesimpulan = `Benda memiliki energi kinetik awal sebesar ${Ek.toFixed(2)} Joule.`;
                break;
            case "cariEm":
                res.ditanyakan = "Energi Mekanik Awal (Em)?";
                res.formulasi = "Em = Ep + Ek = (m × g × h) + (½ × m × v₀²)";
                const Ep0 = m * g * h0;
                const Ek0 = 0.5 * m * (v0 ** 2);
                const Em0 = Ep0 + Ek0;
                res.perhitungan = `Em = ${Ep0.toFixed(2)} J + ${Ek0.toFixed(2)} J`;
                res.hasil = `Em = ${Em0.toFixed(2)} Joule`;
                res.kesimpulan = `Total energi mekanik sistem pada kondisi awal adalah ${Em0.toFixed(2)} Joule.`;
                break;
            case "cariV":
                if (this.sistem === "jatuhBebas") {
                    res.ditanyakan = "Kecepatan Saat Menyentuh Tanah (v)?";
                    res.formulasi = "v = √(v₀² + 2 × g × h₀)";
                    const vAkhir = Math.sqrt(v0 ** 2 + 2 * g * h0);
                    res.perhitungan = `v = √(${v0}² + 2 × ${g} × ${h0}) = √(${(v0**2 + 2*g*h0).toFixed(2)})`;
                    res.hasil = `v = ${vAkhir.toFixed(2)} m/s`;
                    res.kesimpulan = `Benda mencapai tanah dengan kecepatan sebesar ${vAkhir.toFixed(2)} m/s.`;
                } else {
                    res.ditanyakan = "Kecepatan Akhir (v)?";
                    res.formulasi = "v = a × t";
                    res.hasil = "Sesuai simulasi realtime.";
                }
                break;
            case "cariW":
                res.ditanyakan = "Usaha Pengangkatan / Gravitasi (W)?";
                res.formulasi = "W = F × h = m × g × h";
                const W = m * g * h0;
                res.perhitungan = `W = ${m} kg × ${g} m/s² × ${h0} m`;
                res.hasil = `W = ${W.toFixed(2)} Joule`;
                res.kesimpulan = `Usaha total yang dilakukan sebesar ${W.toFixed(2)} Joule.`;
                break;
            case "cariP":
                res.ditanyakan = "Daya Rata-rata (P)?";
                res.formulasi = "P = W / t = (m × g × h) / t";
                const W_val = m * g * h0;
                const P = W_val / (t || 1);
                res.perhitungan = `P = ${W_val.toFixed(2)} J / ${t.toFixed(2)} s`;
                res.hasil = `P = ${P.toFixed(2)} Watt`;
                res.kesimpulan = `Daya rata-rata yang dikeluarkan selama ${t.toFixed(2)} detik adalah ${P.toFixed(2)} Watt.`;
                break;
            default:
                res.hasil = "Besaran terpilih dihitung dinamis dalam simulasi.";
        }
        return res;
    }
}