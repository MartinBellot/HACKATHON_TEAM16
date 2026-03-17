import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SiteService } from '../services/site.service';
import { Site } from '../models/site.model';

interface ComparisonResult {
  site1Name: string;
  site2Name: string;
  totalDifference: number;
  constructionDifference: number;
  operationalDifference: number;
  perM2Difference: number;
}

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="compare-shell">
      <nav class="navbar">
        <button class="nav-brand" type="button" (click)="goToDashboard()">
          <div class="nav-logo">
            <img src="assets/icons/icon-192x192.png" alt="CO₂nscient">
          </div>
          <span class="nav-title">CO₂nscient</span>
        </button>
        <div class="nav-right">
          <button class="nav-pill nav-pill-active" type="button">Comparateur</button>
          <button class="nav-pill" type="button" (click)="goToDashboard()">Dashboard</button>
          <div class="nav-user">
            <div class="user-avatar">{{ currentUser?.username?.charAt(0)?.toUpperCase() }}</div>
            <span class="user-name">{{ currentUser?.username }}</span>
          </div>
          <button (click)="logout()" class="btn-logout" aria-label="Déconnexion">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 5a2 2 0 012-2h6a2 2 0 012 2v1a1 1 0 11-2 0V5H5v10h6v-1a1 1 0 112 0v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11.707 5.707a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L11.586 9H7a1 1 0 100 2h4.586l-1.293 1.293a1 1 0 101.414 1.414l3-3z" clip-rule="evenodd"/>
            </svg>
            <span>Déconnexion</span>
          </button>
        </div>
      </nav>

      <main class="main">
        <div class="container">
          <header class="page-header">
            <div>
              <p class="eyebrow">Comparatif</p>
              <h1 class="page-title">Comparer deux sites</h1>
              <p class="page-subtitle">Sélectionnez deux sites et lancez une lecture côte à côte de leurs performances carbone.</p>
            </div>
            <button class="btn-ghost" type="button" (click)="goToDashboard()">Retour au dashboard</button>
          </header>

          <section class="selection-grid">
            <article class="picker-card">
              <div class="picker-top">
                <span class="picker-label">Site A</span>
                <span class="picker-chip">{{ selectedSite1?.location || 'Non sélectionné' }}</span>
              </div>
              <label class="field-label" for="site1">Choisir un site</label>
              <select id="site1" class="site-select" [(ngModel)]="selectedSiteId1" (ngModelChange)="syncSelection()">
                <option [ngValue]="null">Sélectionner un site</option>
                <option *ngFor="let site of sites" [ngValue]="site.id">{{ site.name }}</option>
              </select>
              <div class="site-preview" *ngIf="selectedSite1; else emptyA">
                <div class="preview-stat">
                  <span>Surface</span>
                  <strong>{{ formatInt(selectedSite1.totalSurface) }} m²</strong>
                </div>
                <div class="preview-stat">
                  <span>CO₂ total</span>
                  <strong>{{ formatTonnes(selectedSite1.totalFootprint) }} t</strong>
                </div>
                <div class="preview-stat">
                  <span>CO₂ / m²</span>
                  <strong>{{ formatKg(selectedSite1.footprintPerM2) }} kg</strong>
                </div>
              </div>
              <ng-template #emptyA>
                <p class="empty-copy">Choisissez un premier site pour afficher ses repères principaux.</p>
              </ng-template>
            </article>

            <article class="picker-card picker-card-accent">
              <div class="picker-top">
                <span class="picker-label">Site B</span>
                <span class="picker-chip">{{ selectedSite2?.location || 'Non sélectionné' }}</span>
              </div>
              <label class="field-label" for="site2">Choisir un site</label>
              <select id="site2" class="site-select" [(ngModel)]="selectedSiteId2" (ngModelChange)="syncSelection()">
                <option [ngValue]="null">Sélectionner un site</option>
                <option *ngFor="let site of sites" [ngValue]="site.id">{{ site.name }}</option>
              </select>
              <div class="site-preview" *ngIf="selectedSite2; else emptyB">
                <div class="preview-stat">
                  <span>Surface</span>
                  <strong>{{ formatInt(selectedSite2.totalSurface) }} m²</strong>
                </div>
                <div class="preview-stat">
                  <span>CO₂ total</span>
                  <strong>{{ formatTonnes(selectedSite2.totalFootprint) }} t</strong>
                </div>
                <div class="preview-stat">
                  <span>CO₂ / m²</span>
                  <strong>{{ formatKg(selectedSite2.footprintPerM2) }} kg</strong>
                </div>
              </div>
              <ng-template #emptyB>
                <p class="empty-copy">Choisissez un second site pour préparer la comparaison.</p>
              </ng-template>
            </article>
          </section>

          <div class="compare-actions">
            <button class="btn-compare" type="button" (click)="launchComparison()" [disabled]="loading || !canCompare">
              <span *ngIf="!loading">Lancer la comparaison</span>
              <span *ngIf="loading">Comparaison en cours…</span>
            </button>
            <p class="inline-error" *ngIf="errorMessage">{{ errorMessage }}</p>
          </div>

          <section *ngIf="comparison && selectedSite1 && selectedSite2" class="results-shell">
            <div class="results-header">
              <div>
                <p class="eyebrow">Résultats</p>
                <h2>Vue d’ensemble</h2>
              </div>
              <div class="winner-pill" [class.winner-pill-draw]="!winnerName">
                {{ winnerName ? winnerName + ' est le plus performant' : 'Égalité sur les indicateurs clés' }}
              </div>
            </div>

            <div class="duel-grid">
              <article class="duel-panel">
                <div class="duel-title-row">
                  <h3>{{ selectedSite1.name }}</h3>
                  <span class="grade-badge" [style.background]="getScore(selectedSite1).bg" [style.color]="getScore(selectedSite1).fg">
                    {{ getScore(selectedSite1).grade }}
                  </span>
                </div>
                <p class="duel-subtitle">{{ selectedSite1.location || 'Localisation non renseignée' }}</p>
                <div class="metric-list">
                  <div class="metric-row">
                    <span>Empreinte totale</span>
                    <strong>{{ formatTonnes(selectedSite1.totalFootprint) }} t</strong>
                  </div>
                  <div class="metric-row">
                    <span>Construction</span>
                    <strong>{{ formatTonnes(selectedSite1.constructionFootprint) }} t</strong>
                  </div>
                  <div class="metric-row">
                    <span>Exploitation</span>
                    <strong>{{ formatTonnes(selectedSite1.operationalFootprint) }} t</strong>
                  </div>
                  <div class="metric-row">
                    <span>Intensité</span>
                    <strong>{{ formatKg(selectedSite1.footprintPerM2) }} kg/m²</strong>
                  </div>
                </div>
              </article>

              <article class="duel-panel duel-panel-right">
                <div class="duel-title-row">
                  <h3>{{ selectedSite2.name }}</h3>
                  <span class="grade-badge" [style.background]="getScore(selectedSite2).bg" [style.color]="getScore(selectedSite2).fg">
                    {{ getScore(selectedSite2).grade }}
                  </span>
                </div>
                <p class="duel-subtitle">{{ selectedSite2.location || 'Localisation non renseignée' }}</p>
                <div class="metric-list">
                  <div class="metric-row">
                    <span>Empreinte totale</span>
                    <strong>{{ formatTonnes(selectedSite2.totalFootprint) }} t</strong>
                  </div>
                  <div class="metric-row">
                    <span>Construction</span>
                    <strong>{{ formatTonnes(selectedSite2.constructionFootprint) }} t</strong>
                  </div>
                  <div class="metric-row">
                    <span>Exploitation</span>
                    <strong>{{ formatTonnes(selectedSite2.operationalFootprint) }} t</strong>
                  </div>
                  <div class="metric-row">
                    <span>Intensité</span>
                    <strong>{{ formatKg(selectedSite2.footprintPerM2) }} kg/m²</strong>
                  </div>
                </div>
              </article>
            </div>

            <div class="comparison-table">
              <div class="table-head">
                <span>Indicateur</span>
                <span>{{ selectedSite1.name }}</span>
                <span>{{ selectedSite2.name }}</span>
                <span>Écart</span>
              </div>

              <div class="table-row">
                <span>Empreinte totale</span>
                <strong>{{ formatTonnes(selectedSite1.totalFootprint) }} t</strong>
                <strong>{{ formatTonnes(selectedSite2.totalFootprint) }} t</strong>
                <span [class.delta-good]="comparison.totalDifference < 0" [class.delta-bad]="comparison.totalDifference > 0">
                  {{ signedTonnes(comparison.totalDifference) }} t
                </span>
              </div>

              <div class="table-row">
                <span>Construction</span>
                <strong>{{ formatTonnes(selectedSite1.constructionFootprint) }} t</strong>
                <strong>{{ formatTonnes(selectedSite2.constructionFootprint) }} t</strong>
                <span [class.delta-good]="comparison.constructionDifference < 0" [class.delta-bad]="comparison.constructionDifference > 0">
                  {{ signedTonnes(comparison.constructionDifference) }} t
                </span>
              </div>

              <div class="table-row">
                <span>Exploitation</span>
                <strong>{{ formatTonnes(selectedSite1.operationalFootprint) }} t</strong>
                <strong>{{ formatTonnes(selectedSite2.operationalFootprint) }} t</strong>
                <span [class.delta-good]="comparison.operationalDifference < 0" [class.delta-bad]="comparison.operationalDifference > 0">
                  {{ signedTonnes(comparison.operationalDifference) }} t
                </span>
              </div>

              <div class="table-row">
                <span>CO₂ / m²</span>
                <strong>{{ formatKg(selectedSite1.footprintPerM2) }} kg</strong>
                <strong>{{ formatKg(selectedSite2.footprintPerM2) }} kg</strong>
                <span [class.delta-good]="comparison.perM2Difference < 0" [class.delta-bad]="comparison.perM2Difference > 0">
                  {{ signedKg(comparison.perM2Difference) }} kg
                </span>
              </div>
            </div>

            <div class="bars-grid">
              <div class="bar-card" *ngFor="let metric of metrics">
                <div class="bar-head">
                  <h3>{{ metric.label }}</h3>
                  <span>{{ metric.unit }}</span>
                </div>
                <div class="bar-row">
                  <label>{{ selectedSite1.name }}</label>
                  <div class="bar-track">
                    <div class="bar-fill bar-fill-blue" [style.width.%]="metric.site1Width"></div>
                  </div>
                  <strong>{{ metric.site1Display }}</strong>
                </div>
                <div class="bar-row">
                  <label>{{ selectedSite2.name }}</label>
                  <div class="bar-track">
                    <div class="bar-fill bar-fill-green" [style.width.%]="metric.site2Width"></div>
                  </div>
                  <strong>{{ metric.site2Display }}</strong>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  `,
  styleUrl: './compare.component.scss'
})
export class CompareComponent implements OnInit {
  sites: Site[] = [];
  selectedSiteId1: number | null = null;
  selectedSiteId2: number | null = null;
  selectedSite1: Site | null = null;
  selectedSite2: Site | null = null;
  comparison: ComparisonResult | null = null;
  errorMessage = '';
  loading = false;
  currentUser: any;

  constructor(
    private readonly siteService: SiteService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnInit(): void {
    this.siteService.getMySites().subscribe({
      next: sites => {
        this.sites = sites;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger vos sites.';
      }
    });
  }

  get canCompare(): boolean {
    return this.selectedSiteId1 !== null
      && this.selectedSiteId2 !== null
      && this.selectedSiteId1 !== this.selectedSiteId2;
  }

  get winnerName(): string {
    if (!this.selectedSite1 || !this.selectedSite2) return '';
    const total1 = this.selectedSite1.totalFootprint ?? 0;
    const total2 = this.selectedSite2.totalFootprint ?? 0;
    if (total1 === total2) return '';
    return total1 < total2 ? this.selectedSite1.name : this.selectedSite2.name;
  }

  get metrics(): { label: string; unit: string; site1Width: number; site2Width: number; site1Display: string; site2Display: string }[] {
    if (!this.selectedSite1 || !this.selectedSite2) return [];

    const total1 = this.selectedSite1.totalFootprint ?? 0;
    const total2 = this.selectedSite2.totalFootprint ?? 0;
    const construction1 = this.selectedSite1.constructionFootprint ?? 0;
    const construction2 = this.selectedSite2.constructionFootprint ?? 0;
    const operational1 = this.selectedSite1.operationalFootprint ?? 0;
    const operational2 = this.selectedSite2.operationalFootprint ?? 0;
    const intensity1 = this.selectedSite1.footprintPerM2 ?? 0;
    const intensity2 = this.selectedSite2.footprintPerM2 ?? 0;

    return [
      this.toMetric('Empreinte totale', 't CO₂', total1, total2, this.formatTonnes(total1), this.formatTonnes(total2)),
      this.toMetric('Construction', 't CO₂', construction1, construction2, this.formatTonnes(construction1), this.formatTonnes(construction2)),
      this.toMetric('Exploitation', 't CO₂', operational1, operational2, this.formatTonnes(operational1), this.formatTonnes(operational2)),
      this.toMetric('Intensité carbone', 'kg CO₂ / m²', intensity1, intensity2, this.formatKg(intensity1), this.formatKg(intensity2))
    ];
  }

  syncSelection(): void {
    this.errorMessage = '';
    this.comparison = null;
    this.selectedSite1 = this.sites.find(site => site.id === this.selectedSiteId1) ?? null;
    this.selectedSite2 = this.sites.find(site => site.id === this.selectedSiteId2) ?? null;

    if (this.selectedSiteId1 !== null && this.selectedSiteId1 === this.selectedSiteId2) {
      this.errorMessage = 'Sélectionnez deux sites différents.';
    }
  }

  launchComparison(): void {
    this.syncSelection();
    if (!this.canCompare || !this.selectedSiteId1 || !this.selectedSiteId2) {
      if (!this.errorMessage) {
        this.errorMessage = 'Sélectionnez deux sites différents avant de lancer la comparaison.';
      }
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.siteService.compareSites(this.selectedSiteId1, this.selectedSiteId2).subscribe({
      next: result => {
        this.comparison = result as ComparisonResult;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'La comparaison a échoué. Vérifiez vos droits d’accès aux sites.';
        this.loading = false;
      }
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  formatTonnes(value: number | null | undefined): string {
    return ((value ?? 0) / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  }

  formatKg(value: number | null | undefined): string {
    return (value ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  }

  formatInt(value: number | null | undefined): string {
    return Number(value ?? 0).toLocaleString('fr-FR');
  }

  signedTonnes(value: number | null | undefined): string {
    const normalized = (value ?? 0) / 1000;
    return `${normalized > 0 ? '+' : ''}${normalized.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}`;
  }

  signedKg(value: number | null | undefined): string {
    const normalized = value ?? 0;
    return `${normalized > 0 ? '+' : ''}${normalized.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}`;
  }

  getScore(site: Site): { grade: string; bg: string; fg: string } {
    const kgPerM2 = site.footprintPerM2 ?? 0;
    if (kgPerM2 < 6) return { grade: 'A', bg: 'rgba(52,199,89,0.15)', fg: '#34C759' };
    if (kgPerM2 < 11) return { grade: 'B', bg: 'rgba(48,209,88,0.12)', fg: '#30D158' };
    if (kgPerM2 < 30) return { grade: 'C', bg: 'rgba(255,159,10,0.15)', fg: '#FF9F0A' };
    if (kgPerM2 < 50) return { grade: 'D', bg: 'rgba(255,107,0,0.15)', fg: '#FF6B00' };
    if (kgPerM2 < 70) return { grade: 'E', bg: 'rgba(255,69,58,0.15)', fg: '#FF453A' };
    if (kgPerM2 < 100) return { grade: 'F', bg: 'rgba(255,59,48,0.15)', fg: '#FF3B30' };
    return { grade: 'G', bg: 'rgba(200,30,30,0.15)', fg: '#C81E1E' };
  }

  private toMetric(label: string, unit: string, a: number, b: number, site1Display: string, site2Display: string) {
    const max = Math.max(a, b, 1);
    return {
      label,
      unit,
      site1Width: (a / max) * 100,
      site2Width: (b / max) * 100,
      site1Display,
      site2Display
    };
  }
}
