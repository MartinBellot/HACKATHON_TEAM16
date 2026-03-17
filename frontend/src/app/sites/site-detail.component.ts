import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SiteService } from '../services/site.service';
import { EnvironmentalContextService } from '../services/environmental-context.service';
import { Site } from '../models/site.model';
import { EnvironmentalContext, YearlyFootprint } from '../models/environmental-context.model';
import { Chart, registerables } from 'chart.js';

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

@Component({
  selector: 'app-site-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="detail-shell" *ngIf="site">

      <!-- ═══ HERO ═══ -->
      <header class="hero">
        <div class="hero-bg">
          <div class="hero-glow" [style.--grade-color]="gradeInfo.fg"></div>
          <div class="hero-grid-pattern"></div>
        </div>

        <div class="hero-content">
          <button class="back-btn" (click)="goBack()">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/></svg>
            Tableau de bord
          </button>

          <div class="hero-main">
            <div class="hero-identity">
              <h1 class="hero-name">{{ site.name }}</h1>
              <div class="hero-location" *ngIf="site.location">
                <svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M8 0C4.686 0 2 2.686 2 6c0 4 6 10 6 10s6-6 6-10c0-3.314-2.686-6-6-6zm0 8.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" clip-rule="evenodd"/></svg>
                {{ site.location }}
              </div>
              <div class="hero-badges">
                <span class="impact-pill" [style.background]="impactInfo.bg" [style.color]="impactInfo.fg">{{ impactInfo.label }}</span>
                <span class="meta-pill">{{ formatInt(site.totalSurface) }} m²</span>
                <span class="meta-pill" *ngIf="site.employees">{{ site.employees }} employés</span>
              </div>
            </div>

            <div class="hero-kpi-cluster">
              <div class="grade-orb" [style.--grade-color]="gradeInfo.fg">
                <span class="grade-letter">{{ gradeInfo.grade }}</span>
                <span class="grade-ring"></span>
              </div>
              <div class="hero-kpi">
                <span class="hero-kpi-value" [style.color]="gradeInfo.fg">{{ formatKgM2(site.footprintPerM2) }}</span>
                <span class="hero-kpi-unit">kgCO₂/m²/an</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- ═══ METRICS ═══ -->
      <section class="section metrics-section" style="--delay: 0">
        <div class="section-label">
          <span class="section-marker"></span>
          Métriques clés
        </div>

        <div class="metrics-grid">
          <div class="metric-card" *ngFor="let m of metrics; let i = index" [style.--i]="i">
            <div class="metric-icon" [innerHTML]="m.icon"></div>
            <div class="metric-value">{{ m.value }}</div>
            <div class="metric-label">{{ m.label }}</div>
            <div class="metric-sub" *ngIf="m.sub">{{ m.sub }}</div>
          </div>
        </div>

        <div class="stacked-bar-wrap">
          <div class="stacked-bar-header">
            <span>Construction</span>
            <span class="stacked-bar-ratio">{{ constructionPercent }}% / {{ 100 - constructionPercent }}%</span>
            <span>Exploitation</span>
          </div>
          <div class="stacked-bar">
            <div class="stacked-seg seg-construction" [style.width]="constructionPercent + '%'"></div>
            <div class="stacked-seg seg-exploitation" [style.width]="(100 - constructionPercent) + '%'"></div>
          </div>
          <div class="stacked-bar-values">
            <span>{{ formatTonnes(site.constructionFootprint) }} tCO₂</span>
            <span>{{ formatTonnes(site.operationalFootprint) }} tCO₂/an</span>
          </div>
        </div>
      </section>

      <!-- ═══ ENVIRONMENTAL CONTEXT ═══ -->
      <section class="section env-section" style="--delay: 1" *ngIf="envContext">
        <div class="section-label">
          <span class="section-marker"></span>
          Contexte environnemental
        </div>

        <div class="env-grid">

          <!-- Climate -->
          <div class="env-card" *ngIf="envContext.climate?.annualMeanTemp">
            <div class="env-card-header">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.547a1 1 0 01.894 1.79l-1.233.422 1.606 2.765a1 1 0 01-1.732 1l-1.604-2.762-3.484 1.19V13h3.5a1 1 0 110 2H6.5a1 1 0 110-2H10V8.763L6.516 7.573l-1.604 2.762a1 1 0 11-1.732-1l1.606-2.765-1.233-.422a1 1 0 11.894-1.79l1.599.547L10 3.323V3a1 1 0 011-1z" clip-rule="evenodd"/></svg>
              <h3>Climat</h3>
              <span class="env-tag">Zone {{ envContext.climate!.climateZone }}</span>
            </div>
            <div class="env-kpis">
              <div class="env-kpi">
                <span class="env-kpi-val">{{ envContext.climate!.annualMeanTemp }}°C</span>
                <span class="env-kpi-lbl">Temp. moyenne</span>
              </div>
              <div class="env-kpi">
                <span class="env-kpi-val">{{ envContext.climate!.heatingDegreeDays }}</span>
                <span class="env-kpi-lbl">DJU chauffage</span>
              </div>
              <div class="env-kpi">
                <span class="env-kpi-val">{{ envContext.climate!.coolingDegreeDays }}</span>
                <span class="env-kpi-lbl">DJU clim.</span>
              </div>
              <div class="env-kpi" *ngIf="envContext.climate!.annualSolarRadiation">
                <span class="env-kpi-val">{{ envContext.climate!.annualSolarRadiation }}</span>
                <span class="env-kpi-lbl">kWh/m² solaire</span>
              </div>
            </div>
          </div>

          <!-- DPE -->
          <div class="env-card" *ngIf="envContext.dpe?.nearbyBuildingsCount">
            <div class="env-card-header">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
              <h3>DPE voisinage</h3>
              <span class="env-tag">{{ envContext.dpe!.nearbyBuildingsCount }} bâtiments</span>
            </div>
            <div class="env-kpis">
              <div class="env-kpi">
                <span class="env-kpi-val">{{ envContext.dpe!.averageDpe }}</span>
                <span class="env-kpi-lbl">kWhEP/m²/an moy.</span>
              </div>
              <div class="env-kpi">
                <span class="env-kpi-val dpe-grade" [class]="'dpe-' + (envContext.dpe!.dominantLabel || 'D').toLowerCase()">{{ envContext.dpe!.dominantLabel }}</span>
                <span class="env-kpi-lbl">Classe dominante</span>
              </div>
            </div>
            <div class="dpe-distribution" *ngIf="envContext.dpe!.distribution">
              <div *ngFor="let d of envContext.dpe!.distribution"
                   class="dpe-seg" [class]="'dpe-' + d.label.toLowerCase()"
                   [style.flex]="d.count"
                   [title]="d.label + ': ' + d.count">
                <span *ngIf="d.count > 0">{{ d.label }}</span>
              </div>
            </div>
          </div>

          <!-- Transport -->
          <div class="env-card" *ngIf="envContext.transport">
            <div class="env-card-header">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13 6H7a4 4 0 00-4 4v4a2 2 0 002 2h1l1 2h6l1-2h1a2 2 0 002-2v-4a4 4 0 00-4-4zM7 14a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2zM5 2h10a1 1 0 010 2H5a1 1 0 010-2z"/></svg>
              <h3>Transports</h3>
              <span class="env-tag" [class]="'access-' + (envContext.transport!.accessibilityScore || '').toLowerCase()">
                {{ envContext.transport!.accessibilityScore }}
              </span>
            </div>
            <div class="transport-stops">
              <div class="stop-chip" *ngIf="envContext.transport!.busStopsNearby">
                <span class="stop-count">{{ envContext.transport!.busStopsNearby }}</span>
                <span class="stop-type">Bus</span>
              </div>
              <div class="stop-chip" *ngIf="envContext.transport!.tramStopsNearby">
                <span class="stop-count">{{ envContext.transport!.tramStopsNearby }}</span>
                <span class="stop-type">Tram</span>
              </div>
              <div class="stop-chip" *ngIf="envContext.transport!.metroStopsNearby">
                <span class="stop-count">{{ envContext.transport!.metroStopsNearby }}</span>
                <span class="stop-type">Métro</span>
              </div>
              <div class="stop-chip" *ngIf="envContext.transport!.trainStationsNearby">
                <span class="stop-count">{{ envContext.transport!.trainStationsNearby }}</span>
                <span class="stop-type">Gare</span>
              </div>
              <div class="stop-chip" *ngIf="envContext.transport!.bikeShareNearby">
                <span class="stop-count">{{ envContext.transport!.bikeShareNearby }}</span>
                <span class="stop-type">Vélos</span>
              </div>
            </div>
            <div class="nearest-stop" *ngIf="envContext.transport!.nearestStopName">
              Arrêt le plus proche : <strong>{{ envContext.transport!.nearestStopName }}</strong>
              — {{ envContext.transport!.nearestStopDistance }}m
            </div>
          </div>

        </div>
      </section>

      <!-- ═══ EVOLUTION ═══ -->
      <section class="section evolution-section" style="--delay: 2" *ngIf="historyData.length > 0">
        <div class="section-label">
          <span class="section-marker section-marker--accent"></span>
          Évolution des émissions (2020–2025)
          <span class="evo-source">Sources : RTE éCO2mix · Open-Meteo Archive</span>
        </div>

        <div class="evo-grid">
          <div class="evo-chart-card">
            <canvas id="evolutionChart"></canvas>
          </div>

          <div class="evo-details-card">
            <h4 class="evo-details-title">Facteurs de variation</h4>
            <div class="evo-year-row" *ngFor="let h of historyData">
              <span class="evo-year">{{ h.year }}</span>
              <div class="evo-bars">
                <div class="evo-bar-group">
                  <span class="evo-bar-label">Grid</span>
                  <div class="evo-bar-track">
                    <div class="evo-bar evo-bar--grid" [style.width]="(h.gridCarbonIntensity / 70 * 100) + '%'"></div>
                  </div>
                  <span class="evo-bar-val">{{ h.gridCarbonIntensity }}g</span>
                </div>
                <div class="evo-bar-group" *ngIf="h.meanTemperature">
                  <span class="evo-bar-label">Temp</span>
                  <div class="evo-bar-track">
                    <div class="evo-bar evo-bar--temp" [style.width]="(h.meanTemperature / 20 * 100) + '%'"></div>
                  </div>
                  <span class="evo-bar-val">{{ h.meanTemperature }}°C</span>
                </div>
              </div>
              <span class="evo-total" [class.evo-up]="isYearUp(h)" [class.evo-down]="!isYearUp(h)">
                {{ formatTonnes(h.totalFootprint) }} t
              </span>
            </div>
          </div>
        </div>

        <div class="evo-insight" *ngIf="historyInsight">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
          <span>{{ historyInsight }}</span>
        </div>
      </section>

      <!-- ═══ RECOMMENDATIONS ═══ -->
      <section class="section reco-section" style="--delay: 3" *ngIf="recommendations.length > 0">
        <div class="section-label">
          <span class="section-marker section-marker--accent"></span>
          Recommandations
          <span class="reco-total">{{ recommendations.length }} action{{ recommendations.length > 1 ? 's' : '' }}</span>
        </div>

        <div class="reco-grid">
          <div *ngFor="let r of recommendations; let i = index"
               class="reco-card" [class]="'reco-' + r.priority" [style.--i]="i">
            <div class="reco-priority-bar"></div>
            <div class="reco-top">
              <span class="reco-icon">{{ r.icon }}</span>
              <span class="reco-cat">{{ r.category }}</span>
              <span class="reco-priority-tag">{{ r.priority === 'haute' ? 'Haute' : r.priority === 'moyenne' ? 'Moyenne' : 'Basse' }}</span>
            </div>
            <h4 class="reco-title">{{ r.title }}</h4>
            <p class="reco-desc">{{ r.description }}</p>
            <div class="reco-impact-row" *ngIf="r.impact">
              <span class="reco-impact-label">{{ r.impactLabel }}</span>
              <span class="reco-impact-value">{{ r.impact }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══ MATERIALS ═══ -->
      <section class="section materials-section" style="--delay: 4" *ngIf="materials.length > 0">
        <div class="section-label">
          <span class="section-marker"></span>
          Matériaux de construction
        </div>

        <div class="materials-wrap">
          <div class="material-row" *ngFor="let m of materials; let i = index" [style.--i]="i">
            <div class="material-info">
              <span class="material-dot" [style.background]="m.color"></span>
              <span class="material-name">{{ m.name }}</span>
              <span class="material-qty">{{ m.quantity }} t</span>
            </div>
            <div class="material-bar-wrap">
              <div class="material-bar" [style.width]="m.percent + '%'" [style.background]="m.color"></div>
            </div>
            <div class="material-footprint">
              <span class="material-fp-val">{{ (m.footprint / 1000).toFixed(1) }}</span>
              <span class="material-fp-unit">tCO₂</span>
            </div>
          </div>

          <div class="material-factors">
            <span class="factor-title">Facteurs d'émission (kgCO₂e/t) :</span>
            <span class="factor-item">Béton 235</span>
            <span class="factor-sep">·</span>
            <span class="factor-item">Acier 1 850</span>
            <span class="factor-sep">·</span>
            <span class="factor-item">Verre 850</span>
            <span class="factor-sep">·</span>
            <span class="factor-item">Bois −500</span>
          </div>
        </div>
      </section>

      <!-- ═══ FOOTER ═══ -->
      <footer class="detail-footer">
        <span>Rapport généré le {{ today }}</span>
        <span class="footer-sep">·</span>
        <span>Données ADEME, Open-Meteo, OpenStreetMap</span>
      </footer>

    </div>

    <!-- Loading state -->
    <div class="loading-state" *ngIf="!site">
      <div class="loading-spinner"></div>
      <span>Chargement du rapport…</span>
    </div>
  `,
  styleUrls: ['./site-detail.component.scss']
})
export class SiteDetailComponent implements OnInit, OnDestroy {
  site: Site | null = null;
  envContext: EnvironmentalContext | null = null;
  historyData: YearlyFootprint[] = [];
  historyInsight = '';
  recommendations: Recommendation[] = [];
  materials: MaterialBar[] = [];
  metrics: { icon: string; value: string; label: string; sub?: string }[] = [];
  private evolutionChart: Chart | null = null;

  gradeInfo = { grade: 'C', bg: '', fg: '#FFCC00' };
  impactInfo = { label: 'Modéré', bg: 'rgba(48,209,88,0.12)', fg: '#30D158' };
  constructionPercent = 50;
  today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private siteService: SiteService,
    private envService: EnvironmentalContextService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/dashboard']); return; }

    this.siteService.getSite(id).subscribe({
      next: site => {
        this.site = site;
        this.gradeInfo = this.getCarbonScore(site);
        this.impactInfo = this.getImpactLevel(site);
        this.buildMetrics();
        this.buildMaterials();
        this.computeConstructionRatio();

        // Load environmental context
        if (site.latitude && site.longitude) {
          this.envService.getContext(site.id!).subscribe(ctx => {
            this.envContext = ctx;
            this.recommendations = this.generateRecommendations(site, ctx);
          });
        } else {
          this.recommendations = this.generateRecommendations(site, null);
        }

        // Load carbon history
        this.envService.getHistory(site.id!).subscribe(history => {
          if (history && history.length > 0) {
            this.historyData = history;
            this.historyInsight = this.generateHistoryInsight(history);
            setTimeout(() => this.buildEvolutionChart(), 100);
          }
        });
      },
      error: () => this.router.navigate(['/dashboard'])
    });
  }

  ngOnDestroy(): void {
    this.evolutionChart?.destroy();
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  // ── Grade & Impact (same logic as dashboard) ──

  getCarbonScore(site: Site): { grade: string; bg: string; fg: string } {
    const v = site.footprintPerM2 ?? 0;
    if (v < 12) return { grade: 'A', bg: 'rgba(52,199,89,0.15)', fg: '#34C759' };
    if (v < 16) return { grade: 'B', bg: 'rgba(48,209,88,0.12)', fg: '#30D158' };
    if (v < 20) return { grade: 'C', bg: 'rgba(255,204,0,0.15)', fg: '#FFCC00' };
    if (v < 25) return { grade: 'D', bg: 'rgba(255,159,10,0.15)', fg: '#FF9F0A' };
    if (v < 35) return { grade: 'E', bg: 'rgba(255,107,0,0.15)', fg: '#FF6B00' };
    if (v < 50) return { grade: 'F', bg: 'rgba(255,59,48,0.15)', fg: '#FF3B30' };
    return { grade: 'G', bg: 'rgba(200,30,30,0.15)', fg: '#C81E1E' };
  }

  getImpactLevel(site: Site): { label: string; bg: string; fg: string } {
    const t = (site.totalFootprint ?? 0) / 1000;
    if (t < 50)   return { label: 'Faible', bg: 'rgba(52,199,89,0.15)', fg: '#34C759' };
    if (t < 200)  return { label: 'Modéré', bg: 'rgba(48,209,88,0.12)', fg: '#30D158' };
    if (t < 500)  return { label: 'Élevé', bg: 'rgba(255,159,10,0.15)', fg: '#FF9F0A' };
    if (t < 2000) return { label: 'Très élevé', bg: 'rgba(255,107,0,0.15)', fg: '#FF6B00' };
    return { label: 'Majeur', bg: 'rgba(255,59,48,0.15)', fg: '#FF3B30' };
  }

  // ── Metrics ──

  buildMetrics(): void {
    if (!this.site) return;
    this.metrics = [
      {
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>',
        value: this.formatInt(this.site.totalSurface),
        label: 'm²',
        sub: 'Surface totale'
      },
      {
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        value: this.formatTonnes(this.site.totalFootprint),
        label: 'tCO₂/an',
        sub: 'Émissions annualisées'
      },
      {
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
        value: this.formatKgM2(this.site.footprintPerM2),
        label: 'kgCO₂/m²/an',
        sub: 'Intensité carbone'
      },
      {
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
        value: this.site.employees ? String(this.site.employees) : '—',
        label: 'employés',
        sub: this.site.footprintPerEmployee ? (this.site.footprintPerEmployee / 1000).toFixed(1) + ' tCO₂/pers' : ''
      }
    ];
  }

  computeConstructionRatio(): void {
    if (!this.site) return;
    const c = this.site.constructionFootprint ?? 0;
    const o = this.site.operationalFootprint ?? 0;
    const total = c + o;
    this.constructionPercent = total > 0 ? Math.round((c / total) * 100) : 50;
  }

  // ── Materials ──

  buildMaterials(): void {
    if (!this.site) return;
    const factors: [string, number, number, string][] = [
      ['Béton', this.site.concreteQuantity ?? 0, 235, '#8E8E93'],
      ['Acier', this.site.steelQuantity ?? 0, 1850, '#FF9F0A'],
      ['Verre', this.site.glassQuantity ?? 0, 850, '#32ADE6'],
      ['Bois', this.site.woodQuantity ?? 0, -500, '#34C759'],
    ];
    const items = factors
      .filter(([, qty]) => qty > 0)
      .map(([name, qty, factor, color]) => ({
        name, quantity: qty, emissionFactor: factor,
        footprint: qty * factor, percent: 0, color
      }));
    const max = Math.max(...items.map(m => Math.abs(m.footprint)), 1);
    items.forEach(m => m.percent = Math.round((Math.abs(m.footprint) / max) * 100));
    this.materials = items;
  }

  // ── Recommendations engine ──

  generateRecommendations(site: Site, env: EnvironmentalContext | null): Recommendation[] {
    const recos: Recommendation[] = [];
    const kgM2 = site.footprintPerM2 ?? 0;
    const surface = site.totalSurface;
    const energyPerM2 = (site.energyConsumption / surface) * 1000; // kWh/m²

    // ── Climate-based ──
    const hdd = env?.climate?.heatingDegreeDays ?? 0;
    const cdd = env?.climate?.coolingDegreeDays ?? 0;
    const solar = env?.climate?.annualSolarRadiation ?? 0;

    if (hdd > 2000) {
      const savingsPercent = hdd > 2500 ? 25 : 15;
      recos.push({
        icon: '🧊', category: 'Isolation',
        title: 'Renforcer l\'isolation thermique',
        description: `Avec ${hdd} DJU de chauffage, votre site est en zone froide. Une isolation par l'extérieur (ITE) ou le remplacement des vitrages réduirait significativement la consommation de chauffage.`,
        impact: `−${savingsPercent}% sur le chauffage`,
        impactLabel: 'Économie estimée',
        priority: hdd > 2500 ? 'haute' : 'moyenne'
      });
    }

    if (cdd > 50) {
      recos.push({
        icon: '❄️', category: 'Climatisation',
        title: 'Optimiser le rafraîchissement',
        description: `${cdd} DJU de climatisation indiquent des besoins de refroidissement significatifs. Envisagez des protections solaires, une ventilation naturelle nocturne ou un free-cooling.`,
        impact: `−10 à 20% sur la climatisation`,
        impactLabel: 'Économie estimée',
        priority: cdd > 150 ? 'haute' : 'basse'
      });
    }

    if (solar > 1100) {
      const pvPower = Math.round(surface * 0.3 * 0.18); // 30% toiture exploitable, 18% rendement
      const pvProduction = Math.round(pvPower * solar / 1000); // MWh/an
      const pvSavings = (pvProduction * 52 / 1000).toFixed(1); // tCO₂ évitées (52 kgCO₂/MWh)
      recos.push({
        icon: '☀️', category: 'Énergie renouvelable',
        title: 'Installer des panneaux photovoltaïques',
        description: `Avec ${solar} kWh/m²/an d'irradiation solaire, votre site a un excellent potentiel. Une installation de ${pvPower} kWc sur la toiture produirait ~${pvProduction} MWh/an.`,
        impact: `−${pvSavings} tCO₂/an`,
        impactLabel: 'Réduction estimée',
        priority: solar > 1300 ? 'haute' : 'moyenne'
      });
    }

    // ── Transport-based ──
    const transport = env?.transport;
    if (transport) {
      if (transport.accessibilityScore === 'Faible') {
        recos.push({
          icon: '🚌', category: 'Mobilité',
          title: 'Mettre en place un plan de mobilité',
          description: `L'accessibilité en transports en commun est faible. Proposez du covoiturage, des navettes d'entreprise, ou des bornes de recharge pour véhicules électriques.`,
          impact: `−15 à 30% sur les émissions mobilité`,
          impactLabel: 'Potentiel de réduction',
          priority: 'haute'
        });
      } else if (transport.accessibilityScore === 'Moyen') {
        recos.push({
          icon: '🚲', category: 'Mobilité',
          title: 'Encourager les mobilités douces',
          description: `L'accessibilité TC est moyenne. Installez des parkings vélos sécurisés, proposez une indemnité kilométrique vélo et facilitez le télétravail.`,
          impact: `−10% sur les émissions mobilité`,
          impactLabel: 'Potentiel de réduction',
          priority: 'moyenne'
        });
      }

      if ((transport.bikeShareNearby ?? 0) > 0 && (site.parkingPlaces ?? 0) > 20) {
        recos.push({
          icon: '🅿️', category: 'Mobilité',
          title: 'Réduire les places de parking',
          description: `Avec ${transport.bikeShareNearby} stations de vélos en libre-service à proximité, envisagez de convertir des places de parking en espaces verts ou bornes vélos.`,
          impact: `−${Math.round((site.parkingPlaces ?? 0) * 0.3 * 150 / 1000)} tCO₂/an`,
          impactLabel: 'Si −30% de places',
          priority: 'basse'
        });
      }
    }

    // ── Energy efficiency ──
    if (energyPerM2 > 200) {
      recos.push({
        icon: '⚡', category: 'Exploitation',
        title: 'Réduire la consommation énergétique',
        description: `Votre consommation de ${Math.round(energyPerM2)} kWh/m²/an est au-dessus des standards tertiaires (~160 kWh/m²). Un audit énergétique identifiera les postes de gaspillage (CVC, éclairage, bureautique).`,
        impact: `−${Math.round((energyPerM2 - 160) * surface / 1000 * 52 / 1000)} tCO₂/an`,
        impactLabel: 'Objectif 160 kWh/m²',
        priority: 'haute'
      });
    }

    if (energyPerM2 > 120 && energyPerM2 <= 200) {
      recos.push({
        icon: '💡', category: 'Exploitation',
        title: 'Passer à l\'éclairage LED et GTB',
        description: `L'installation d'un éclairage LED avec détection de présence et d'une GTB (Gestion Technique du Bâtiment) permet des gains rapides sur la consommation.`,
        impact: `−8 à 15% d'énergie`,
        impactLabel: 'Gain typique',
        priority: 'moyenne'
      });
    }

    // ── Material-based ──
    const concrete = site.concreteQuantity ?? 0;
    const wood = site.woodQuantity ?? 0;
    const total = concrete + (site.steelQuantity ?? 0) + (site.glassQuantity ?? 0) + wood;
    if (total > 0 && wood / total < 0.05 && concrete / total > 0.6) {
      recos.push({
        icon: '🪵', category: 'Matériaux',
        title: 'Augmenter la part de bois dans les rénovations',
        description: `Le bois ne représente que ${Math.round(wood / total * 100)}% des matériaux. Lors de futures rénovations ou extensions, privilégiez les structures bois (stockage carbone −500 kgCO₂/t).`,
        impact: `Stockage carbone net`,
        impactLabel: 'Bénéfice',
        priority: 'moyenne'
      });
    }

    // ── Grade-based ──
    if (kgM2 > 25) {
      recos.push({
        icon: '🏗️', category: 'Performance globale',
        title: 'Viser la certification HQE ou BREEAM',
        description: `Avec une note ${this.gradeInfo.grade} (${kgM2.toFixed(1)} kgCO₂/m²/an), votre site est au-dessus de la médiane. Un plan d'action structuré vers une certification environnementale guiderait les investissements.`,
        impact: `Objectif < 20 kgCO₂/m²/an`,
        impactLabel: 'Cible grade C',
        priority: 'haute'
      });
    }

    // ── DPE comparison ──
    const dpe = env?.dpe;
    if (dpe?.averageDpe && energyPerM2 > dpe.averageDpe * 1.2) {
      recos.push({
        icon: '📊', category: 'Benchmark',
        title: 'Performance inférieure au voisinage',
        description: `Votre consommation (${Math.round(energyPerM2)} kWh/m²) est supérieure de ${Math.round((energyPerM2 / dpe.averageDpe - 1) * 100)}% à la moyenne du quartier (${dpe.averageDpe} kWh/m²). Un diagnostic comparatif révélerait les écarts.`,
        impact: `Aligner sur la moyenne locale`,
        impactLabel: 'Objectif',
        priority: 'moyenne'
      });
    }

    // Sort by priority
    const order = { haute: 0, moyenne: 1, basse: 2 };
    recos.sort((a, b) => order[a.priority] - order[b.priority]);
    return recos;
  }

  // ── Evolution chart ──

  buildEvolutionChart(): void {
    Chart.register(...registerables);
    const canvas = document.getElementById('evolutionChart') as HTMLCanvasElement;
    if (!canvas) return;

    const labels = this.historyData.map(h => String(h.year));
    const construction = this.historyData.map(h => h.constructionFootprint / 1000);
    const operational = this.historyData.map(h => h.operationalFootprint / 1000);
    const total = this.historyData.map(h => h.totalFootprint / 1000);

    this.evolutionChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Construction (amorti)',
            data: construction,
            backgroundColor: 'rgba(0, 122, 255, 0.7)',
            borderRadius: 4,
            stack: 'stack',
            order: 2
          },
          {
            label: 'Exploitation',
            data: operational,
            backgroundColor: 'rgba(52, 199, 89, 0.7)',
            borderRadius: 4,
            stack: 'stack',
            order: 2
          },
          {
            label: 'Total annualisé',
            data: total,
            type: 'line',
            borderColor: '#FFCC00',
            backgroundColor: 'rgba(255, 204, 0, 0.1)',
            borderWidth: 2.5,
            pointRadius: 5,
            pointBackgroundColor: '#FFCC00',
            pointBorderColor: '#1a1a1a',
            pointBorderWidth: 2,
            tension: 0.3,
            fill: true,
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: 'rgba(255,255,255,0.6)',
              font: { size: 11, family: "'Outfit', sans-serif" },
              padding: 16,
              usePointStyle: true,
              pointStyleWidth: 12
            }
          },
          tooltip: {
            backgroundColor: 'rgba(20,20,20,0.95)',
            titleFont: { family: "'Outfit', sans-serif", weight: '600' },
            bodyFont: { family: "'IBM Plex Mono', monospace", size: 12 },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} tCO₂/an`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 12, weight: '600' } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: 'rgba(255,255,255,0.4)',
              font: { size: 11 },
              callback: (v: any) => v + ' t'
            },
            title: {
              display: true,
              text: 'tCO₂/an',
              color: 'rgba(255,255,255,0.4)',
              font: { size: 11 }
            }
          }
        }
      }
    });
  }

  isYearUp(h: YearlyFootprint): boolean {
    const idx = this.historyData.indexOf(h);
    if (idx <= 0) return false;
    return h.totalFootprint > this.historyData[idx - 1].totalFootprint;
  }

  generateHistoryInsight(history: YearlyFootprint[]): string {
    if (history.length < 2) return '';
    const first = history[0];
    const last = history[history.length - 1];
    const diff = ((last.totalFootprint - first.totalFootprint) / first.totalFootprint * 100);
    const peak = history.reduce((max, h) => h.totalFootprint > max.totalFootprint ? h : max);

    if (diff < -5) {
      return `Tendance favorable : les émissions ont baissé de ${Math.abs(diff).toFixed(1)}% entre ${first.year} et ${last.year}, principalement grâce à la décarbonation du réseau électrique.`;
    } else if (diff > 5) {
      return `Hausse de ${diff.toFixed(1)}% des émissions entre ${first.year} et ${last.year}. Le pic en ${peak.year} (${peak.gridCarbonIntensity}g CO₂/kWh grid) est lié aux arrêts de réacteurs nucléaires.`;
    }
    return `Émissions stables (${Math.abs(diff).toFixed(1)}% de variation) sur la période ${first.year}–${last.year}. Le pic en ${peak.year} reflète la hausse de l'intensité carbone du réseau (${peak.gridCarbonIntensity}g/kWh).`;
  }

  // ── Formatters ──

  formatTonnes(n: any): string {
    if (!n) return '0';
    return (n / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
  }

  formatKgM2(n: any): string {
    if (!n) return '0';
    return n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  }

  formatInt(n: any): string {
    if (!n) return '0';
    return Number(n).toLocaleString('fr-FR');
  }
}
