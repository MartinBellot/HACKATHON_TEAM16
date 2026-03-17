import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { Site } from '../models/site.model';
import { EnvironmentalContext } from '../models/environmental-context.model';

interface Recommendation {
  icon: string;
  category: string;
  title: string;
  description: string;
  impact: string;
  impactLabel: string;
  priority: 'haute' | 'moyenne' | 'basse';
}

interface MaterialBar {
  name: string;
  quantity: number;
  emissionFactor: number;
  footprint: number;
  percent: number;
  color: string;
}

// ── Color palette (light theme) ──
const C = {
  bg: '#FFFFFF',
  card: '#F6F8FA',
  cardBorder: '#D8DEE4',
  accent: '#0969DA',
  accentDim: '#0550AE',
  green: '#1A7F37',
  yellow: '#9A6700',
  orange: '#BC4C00',
  red: '#CF222E',
  pink: '#BF3989',
  white: '#1F2328',
  secondary: '#656D76',
  tertiary: '#8C959F',
  divider: '#D8DEE4',
};

const GRADE_COLORS: Record<string, string> = {
  A: '#1A7F37', B: '#2DA44E', C: '#9A6700',
  D: '#BC4C00', E: '#CF222E', F: '#CF222E', G: '#A40E26',
};

const PRIORITY_COLORS: Record<string, string> = {
  haute: '#CF222E', moyenne: '#9A6700', basse: '#1A7F37',
};

@Injectable({ providedIn: 'root' })
export class PdfReportService {

  generate(
    site: Site,
    gradeInfo: { grade: string; fg: string },
    impactInfo: { label: string },
    metrics: { value: string; label: string; sub?: string }[],
    materials: MaterialBar[],
    recommendations: Recommendation[],
    envContext: EnvironmentalContext | null,
    constructionPercent: number
  ): void {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210;
    const H = 297;
    const M = 16; // margin
    const CW = W - 2 * M; // content width
    let y = 0;

    const gradeColor = GRADE_COLORS[gradeInfo.grade] ?? C.accent;

    // ── Helpers ──
    const hexToRgb = (hex: string): [number, number, number] => {
      const h = hex.replace('#', '');
      return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
    };
    const setColor = (hex: string) => doc.setTextColor(...hexToRgb(hex));
    const setDraw = (hex: string) => doc.setDrawColor(...hexToRgb(hex));
    const setFill = (hex: string) => doc.setFillColor(...hexToRgb(hex));

    // Safety factor for splitTextToSize — jsPDF underestimates width of accented chars
    const SAFE = 0.88;

    // Mix a color with white to create a light tint (for pill backgrounds)
    const lighten = (hex: string, amount = 0.82): string => {
      const [r, g, b] = hexToRgb(hex);
      const lr = Math.round(r + (255 - r) * amount);
      const lg = Math.round(g + (255 - g) * amount);
      const lb = Math.round(b + (255 - b) * amount);
      return '#' + [lr, lg, lb].map(v => v.toString(16).padStart(2, '0')).join('');
    };

    const ensureSpace = (needed: number) => {
      if (y + needed > H - 20) {
        doc.addPage();
        drawPageBg();
        y = M;
      }
    };

    const drawPageBg = () => {
      setFill(C.bg);
      doc.rect(0, 0, W, H, 'F');
      // Subtle grid
      setDraw('#F0F2F5');
      for (let gx = 0; gx < W; gx += 8) {
        doc.line(gx, 0, gx, H);
      }
      for (let gy = 0; gy < H; gy += 8) {
        doc.line(0, gy, W, gy);
      }
    };

    const drawRoundedRect = (x: number, ry: number, w: number, h: number, r: number, fillHex: string, borderHex?: string) => {
      setFill(fillHex);
      doc.roundedRect(x, ry, w, h, r, r, 'F');
      if (borderHex) {
        setDraw(borderHex);
        doc.roundedRect(x, ry, w, h, r, r, 'S');
      }
    };

    const drawPill = (x: number, py: number, text: string, bgHex: string, fgHex: string): number => {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      const tw = doc.getTextWidth(text);
      const pw = tw + 6;
      const ph = 5;
      drawRoundedRect(x, py, pw, ph, 2, bgHex);
      setColor(fgHex);
      doc.text(text, x + 3, py + 3.6);
      return pw;
    };

    const drawSectionLabel = (label: string, accentHex: string = C.accent) => {
      ensureSpace(12);
      setFill(accentHex);
      doc.roundedRect(M, y, 2.5, 5, 1, 1, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      setColor(C.secondary);
      doc.text(label.toUpperCase(), M + 6, y + 3.8);
      y += 9;
    };

    // ══════════════════════════════════════════════
    // PAGE 1 — HERO + METRICS
    // ══════════════════════════════════════════════
    drawPageBg();

    // ── Hero gradient bar ──
    const heroH = 72;
    setFill('#F6F8FA');
    doc.rect(0, 0, W, heroH, 'F');

    // Accent glow (simulated with gradient rects)
    for (let i = 0; i < 20; i++) {
      const alpha = 0.04 - i * 0.002;
      if (alpha <= 0) break;
      const [r, g, b] = hexToRgb(gradeColor);
      doc.setFillColor(r, g, b);
      doc.setGState(doc.GState({ opacity: alpha }));
      doc.circle(W - 30, 10, 20 + i * 4, 'F');
    }
    doc.setGState(doc.GState({ opacity: 1 }));

    // Grade orb (right side) — positioned first so we know reserved space
    const orbR = 12;
    const orbX = W - M - 14;
    const orbCenterY = 36;

    // Top bar
    y = 10;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    setColor(C.tertiary);
    doc.text('CARBON CALCULATOR · RAPPORT DE SITE', M, y);

    const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    // Place date to the left of the orb area
    const dateMaxX = orbX - orbR - 6;
    doc.text(dateStr, dateMaxX, y, { align: 'right' });

    // Divider
    y += 3;
    setDraw(C.divider);
    doc.line(M, y, W - M, y);

    // Max width for left-side text (leave room for orb)
    const leftContentMaxW = orbX - orbR - 8 - M;

    // Site name
    y += 10;
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    setColor(C.white);
    const nameLines = doc.splitTextToSize(site.name, leftContentMaxW);
    doc.text(nameLines[0], M, y);

    // Location
    if (site.location) {
      y += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      setColor(C.secondary);
      const locText = site.location;
      const locLines = doc.splitTextToSize(locText, leftContentMaxW);
      doc.text(locLines[0], M, y);
    }

    // Badges
    y += 6;
    let bx = M;
    bx += drawPill(bx, y, impactInfo.label.toUpperCase(), lighten(gradeColor), gradeColor) + 3;
    bx += drawPill(bx, y, `${Number(site.totalSurface).toLocaleString('fr-FR')} m²`, C.cardBorder, C.secondary) + 3;
    if (site.employees) {
      drawPill(bx, y, `${site.employees} employés`, C.cardBorder, C.secondary);
    }

    // Draw grade orb
    setFill('#FFFFFF');
    doc.circle(orbX, orbCenterY, orbR + 2, 'F');
    setDraw(gradeColor);
    doc.setLineWidth(0.8);
    doc.circle(orbX, orbCenterY, orbR, 'S');
    doc.setLineWidth(0.2);
    // Grade letter
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    setColor(gradeColor);
    doc.text(gradeInfo.grade, orbX, orbCenterY + 2.5, { align: 'center' });

    // KPI below orb
    const kpiVal = site.footprintPerM2 ? site.footprintPerM2.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : '—';
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    setColor(gradeColor);
    doc.text(kpiVal, orbX, orbCenterY + orbR + 5, { align: 'center' });
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    setColor(C.tertiary);
    doc.text('kgCO₂/m²/an', orbX, orbCenterY + orbR + 9, { align: 'center' });

    // ── Hero bottom line ──
    y = heroH - 2;
    setFill(gradeColor);
    doc.rect(0, y, W, 0.5, 'F');
    y = heroH + 8;

    // ══════════════════════════════════════════════
    // METRICS CARDS
    // ══════════════════════════════════════════════
    drawSectionLabel('Métriques clés');

    const mCardW = (CW - 3 * 3) / 4;
    const mCardH = 22;
    const mTextW = mCardW - 4; // inner text max width
    metrics.forEach((m, i) => {
      const mx = M + i * (mCardW + 3);
      drawRoundedRect(mx, y, mCardW, mCardH, 3, C.card, C.cardBorder);
      // Value
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      setColor(C.white);
      doc.text(m.value, mx + mCardW / 2, y + 9, { align: 'center', maxWidth: mTextW });
      // Label
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      setColor(C.secondary);
      doc.text(m.label, mx + mCardW / 2, y + 14, { align: 'center', maxWidth: mTextW });
      // Sub
      if (m.sub) {
        doc.setFontSize(5.5);
        setColor(C.tertiary);
        doc.text(m.sub, mx + mCardW / 2, y + 18.5, { align: 'center', maxWidth: mTextW });
      }
    });
    y += mCardH + 6;

    // ── Construction vs Exploitation bar ──
    ensureSpace(22);
    drawRoundedRect(M, y, CW, 18, 3, C.card, C.cardBorder);
    const barY = y + 3;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    setColor(C.secondary);
    doc.text('Construction', M + 4, barY + 2.5);
    const ratioText = `${constructionPercent}% / ${100 - constructionPercent}%`;
    doc.text(ratioText, M + CW / 2, barY + 2.5, { align: 'center' });
    const expText = 'Exploitation';
    doc.text(expText, M + CW - 4 - doc.getTextWidth(expText), barY + 2.5);

    // Stacked bar
    const barX = M + 4;
    const barW = CW - 8;
    const barH2 = 5;
    const barTop = barY + 5;
    drawRoundedRect(barX, barTop, barW, barH2, 2, C.divider);
    if (constructionPercent > 0) {
      const cw = (barW * constructionPercent) / 100;
      drawRoundedRect(barX, barTop, cw, barH2, 2, C.accent);
    }
    if (constructionPercent < 100) {
      const ew = (barW * (100 - constructionPercent)) / 100;
      drawRoundedRect(barX + barW - ew, barTop, ew, barH2, 2, C.green);
    }

    // Values below bar
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    setColor(C.accent);
    const cFootprint = site.constructionFootprint ? (site.constructionFootprint / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' tCO₂' : '—';
    doc.text(cFootprint, barX, barTop + barH2 + 3.5);
    setColor(C.green);
    const oFootprint = site.operationalFootprint ? (site.operationalFootprint / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' tCO₂/an' : '—';
    doc.text(oFootprint, barX + barW, barTop + barH2 + 3.5, { align: 'right' });
    y += 24;

    // ══════════════════════════════════════════════
    // ENVIRONMENTAL CONTEXT
    // ══════════════════════════════════════════════
    if (envContext) {
      y += 4;
      drawSectionLabel('Contexte environnemental');

      const envCards: { title: string; tag?: string; kpis: { val: string; lbl: string }[] }[] = [];

      if (envContext.climate?.annualMeanTemp) {
        const cl = envContext.climate;
        envCards.push({
          title: 'Climat',
          tag: `Zone ${cl.climateZone ?? '—'}`,
          kpis: [
            { val: `${cl.annualMeanTemp}°C`, lbl: 'Temp. moyenne' },
            { val: `${cl.heatingDegreeDays ?? '—'}`, lbl: 'DJU chauffage' },
            { val: `${cl.coolingDegreeDays ?? '—'}`, lbl: 'DJU clim.' },
            ...(cl.annualSolarRadiation ? [{ val: `${cl.annualSolarRadiation}`, lbl: 'kWh/m² solaire' }] : []),
          ]
        });
      }

      if (envContext.dpe?.nearbyBuildingsCount) {
        const dp = envContext.dpe;
        envCards.push({
          title: 'DPE voisinage',
          tag: `${dp.nearbyBuildingsCount} bâtiments`,
          kpis: [
            { val: `${dp.averageDpe ?? '—'}`, lbl: 'kWhEP/m²/an moy.' },
            { val: dp.dominantLabel ?? '—', lbl: 'Classe dominante' },
          ]
        });
      }

      if (envContext.transport) {
        const tr = envContext.transport;
        const stops: string[] = [];
        if (tr.busStopsNearby) stops.push(`${tr.busStopsNearby} Bus`);
        if (tr.tramStopsNearby) stops.push(`${tr.tramStopsNearby} Tram`);
        if (tr.metroStopsNearby) stops.push(`${tr.metroStopsNearby} Métro`);
        if (tr.trainStationsNearby) stops.push(`${tr.trainStationsNearby} Gare`);
        if (tr.bikeShareNearby) stops.push(`${tr.bikeShareNearby} Vélos`);
        envCards.push({
          title: 'Transports',
          tag: tr.accessibilityScore ?? '',
          kpis: stops.map(s => {
            const parts = s.split(' ');
            return { val: parts[0], lbl: parts.slice(1).join(' ') };
          })
        });
      }

      // Draw env cards (up to 3 columns)
      const envGap = 4;
      const envColW = (CW - (envCards.length - 1) * envGap) / Math.min(envCards.length, 3);
      const envCardH = 34;
      const envPad = 4;
      const envInnerW = envColW - envPad * 2;

      ensureSpace(envCardH + 4);
      envCards.forEach((ec, i) => {
        if (i >= 3) return;
        const ex = M + i * (envColW + envGap);
        drawRoundedRect(ex, y, envColW, envCardH, 3, C.card, C.cardBorder);

        // Title
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        setColor(C.white);
        const titleTW = doc.getTextWidth(ec.title);
        doc.text(ec.title, ex + envPad, y + 6);

        // Tag — only if fits
        if (ec.tag) {
          const tagX = ex + envPad + titleTW + 3;
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          const tagTW = doc.getTextWidth(ec.tag) + 6;
          if (tagX + tagTW < ex + envColW - 2) {
            drawPill(tagX, y + 2.2, ec.tag, C.divider, C.secondary);
          }
        }

        // KPIs — constrain to column width
        const kpiY = y + 13;
        const kpiCount = Math.min(ec.kpis.length, 4);
        const kpiColW = envInnerW / kpiCount;
        ec.kpis.slice(0, kpiCount).forEach((kpi, ki) => {
          const kx = ex + envPad + ki * kpiColW;
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          setColor(C.accent);
          doc.text(kpi.val, kx, kpiY + 5, { maxWidth: kpiColW - 2 });
          doc.setFontSize(5.5);
          doc.setFont('helvetica', 'normal');
          setColor(C.tertiary);
          doc.text(kpi.lbl, kx, kpiY + 10, { maxWidth: kpiColW - 2 });
        });
      });
      y += envCardH + 6;
    }

    // ══════════════════════════════════════════════
    // RECOMMENDATIONS
    // ══════════════════════════════════════════════
    if (recommendations.length > 0) {
      y += 2;
      ensureSpace(20);
      drawSectionLabel('Recommandations');

      // Single column layout for recommendations
      const recoW = CW;
      const textPadL = 10; // left padding (after priority bar)
      const textPadR = 8;  // right padding
      const textMaxW = (recoW - textPadL - textPadR) * SAFE; // safety factor for accented chars
      const lineH = 3.2; // line height in mm for desc
      const titleLineH = 4.2; // line height for titles

      recommendations.forEach((reco) => {
        // Pre-calculate wrapped lines with safe widths
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        const titleLines: string[] = doc.splitTextToSize(reco.title, textMaxW);
        const titleH = titleLines.length * titleLineH;

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        const descLines: string[] = doc.splitTextToSize(reco.description, textMaxW);
        const descH = descLines.length * lineH;

        const impactH = reco.impact ? 9 : 0;
        const cardH = 6 + 6 + titleH + 2 + descH + impactH + 5;

        ensureSpace(cardH + 4);

        const rx = M;
        const cardRightX = rx + recoW;
        drawRoundedRect(rx, y, recoW, cardH, 3, C.card, C.cardBorder);

        // Priority bar (left accent)
        const pColor = PRIORITY_COLORS[reco.priority] ?? C.accent;
        setFill(pColor);
        doc.roundedRect(rx, y, 2.5, cardH, 3, 3, 'F');
        setFill(C.card);
        doc.rect(rx + 1.5, y + 1, 1.5, cardH - 2, 'F');

        let cy = y + 6;

        // Category label
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        setColor(C.tertiary);
        doc.text(reco.category.toUpperCase(), rx + textPadL, cy, { maxWidth: textMaxW * 0.5 });

        // Priority pill (right-aligned)
        const priLabel = reco.priority === 'haute' ? 'HAUTE' : reco.priority === 'moyenne' ? 'MOYENNE' : 'BASSE';
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        const pillW = doc.getTextWidth(priLabel) + 6;
        drawPill(cardRightX - textPadR - pillW, cy - 3.5, priLabel, lighten(pColor), pColor);
        cy += 6;

        // Title (wrapped)
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        setColor(C.white);
        titleLines.forEach((line: string, li: number) => {
          doc.text(line, rx + textPadL, cy + li * titleLineH, { maxWidth: recoW - textPadL - textPadR });
        });
        cy += titleH + 2;

        // Description (wrapped)
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        setColor(C.secondary);
        descLines.forEach((line: string, li: number) => {
          doc.text(line, rx + textPadL, cy + li * lineH, { maxWidth: recoW - textPadL - textPadR });
        });
        cy += descH + 2;

        // Impact bar
        if (reco.impact) {
          const impBarX = rx + textPadL;
          const impBarW = recoW - textPadL - textPadR;
          setFill(C.divider);
          doc.roundedRect(impBarX, cy, impBarW, 5.5, 1.5, 1.5, 'F');
          doc.setFontSize(5.5);
          doc.setFont('helvetica', 'normal');
          setColor(C.tertiary);
          doc.text(reco.impactLabel, impBarX + 3, cy + 3.5, { maxWidth: impBarW * 0.45 });
          doc.setFont('helvetica', 'bold');
          setColor(C.green);
          doc.text(reco.impact, impBarX + impBarW - 3, cy + 3.5, { align: 'right', maxWidth: impBarW * 0.45 });
        }

        y += cardH + 3;
      });
    }

    // ══════════════════════════════════════════════
    // MATERIALS
    // ══════════════════════════════════════════════
    if (materials.length > 0) {
      y += 2;
      ensureSpace(20);
      drawSectionLabel('Matériaux de construction');

      ensureSpace(materials.length * 9 + 12);
      drawRoundedRect(M, y, CW, materials.length * 9 + 10, 3, C.card, C.cardBorder);

      let my = y + 5;
      materials.forEach(mat => {
        // Name + quantity
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        setColor(C.white);
        doc.text(mat.name, M + 5, my + 2.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        setColor(C.tertiary);
        doc.text(`${mat.quantity} t`, M + 25, my + 2.5);

        // Bar
        const barStart = M + 42;
        const maxBarW = CW - 75;
        const matBarW = (mat.percent / 100) * maxBarW;
        drawRoundedRect(barStart, my, maxBarW, 4, 1.5, C.divider);
        if (matBarW > 0) {
          drawRoundedRect(barStart, my, matBarW, 4, 1.5, mat.color);
        }

        // Footprint value
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        setColor(C.secondary);
        const fpText = (mat.footprint / 1000).toFixed(1) + ' tCO₂';
        doc.text(fpText, M + CW - 5, my + 2.5, { align: 'right' });

        my += 9;
      });

      // Emission factors footnote
      my += 1;
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      setColor(C.tertiary);
      const footNote = 'Facteurs d\'émission (kgCO\u2082e/t) : Béton 235 · Acier 1 850 · Verre 850 · Bois \u2212500';
      const fnLines = doc.splitTextToSize(footNote, CW - 10);
      doc.text(fnLines, M + 5, my);

      y += materials.length * 9 + 16;
    }

    // ══════════════════════════════════════════════
    // FOOTER
    // ══════════════════════════════════════════════
    const addFooter = (pageNum: number, totalPages: number) => {
      const fy = H - 10;
      setDraw(C.divider);
      doc.line(M, fy, W - M, fy);
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      setColor(C.tertiary);
      doc.text(`Rapport généré le ${dateStr} · Données ADEME, Open-Meteo, OpenStreetMap`, M, fy + 4);
      doc.text(`${pageNum} / ${totalPages}`, W - M, fy + 4, { align: 'right' });
    };

    // Add footer to all pages
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      addFooter(p, totalPages);
    }

    // ── Save ──
    const safeName = site.name.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüÿçæœ\s-]/g, '').replace(/\s+/g, '_');
    doc.save(`Rapport_Carbone_${safeName}.pdf`);
  }
}
