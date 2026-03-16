import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { SiteService } from '../services/site.service';
import { AuthService } from '../services/auth.service';
import { Site } from '../models/site.model';
import { FormsModule } from '@angular/forms';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="shell">
      <!-- Ambient background -->
      <div class="ambient">
        <svg class="ambient-svg" viewBox="0 0 1200 800" preserveAspectRatio="none">
          <path class="a-line a1" d="M0,400 Q300,320 600,380 T1200,350" fill="none"/>
          <path class="a-line a2" d="M0,450 Q350,380 700,430 T1200,400" fill="none"/>
          <path class="a-line a3" d="M0,500 Q280,440 650,480 T1200,460" fill="none"/>
        </svg>
      </div>

      <!-- Top bar -->
      <header class="topbar">
        <div class="topbar-left">
          <div class="logo-sm">
            <svg viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="12" stroke="url(#tg)" stroke-width="1.2" opacity="0.5"/>
              <circle cx="16" cy="16" r="5" fill="url(#tg)"/>
              <defs>
                <linearGradient id="tg" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stop-color="#00e88f"/>
                  <stop offset="100%" stop-color="#00b4d8"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span class="topbar-title">Carbon Calculator</span>
        </div>
        <div class="topbar-right">
          <div class="user-badge">
            <div class="user-avatar">{{ currentUser?.username?.charAt(0)?.toUpperCase() || 'U' }}</div>
            <span class="user-name">{{ currentUser?.username }}</span>
          </div>
          <button class="btn-logout" (click)="logout()">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fill-rule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clip-rule="evenodd"/>
              <path fill-rule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clip-rule="evenodd"/>
            </svg>
            Quitter
          </button>
        </div>
      </header>

      <!-- Main content -->
      <main class="main">
        <!-- Page header -->
        <div class="page-head">
          <div>
            <h1 class="page-title">Tableau de bord</h1>
            <p class="page-sub">Vue d'ensemble de l'empreinte carbone de vos sites</p>
          </div>
          <button class="btn-add" (click)="showSiteForm()">
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/>
            </svg>
            Nouveau site
          </button>
        </div>

        <!-- KPI row -->
        <div class="kpi-row">
          <div class="kpi" *ngFor="let k of kpis; let i = index"
               [style.animation-delay]="(i * 0.08) + 's'">
            <div class="kpi-top">
              <span class="kpi-label">{{ k.label }}</span>
              <div class="kpi-badge" [ngClass]="k.color">
                <svg *ngIf="k.icon === 'sites'" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                  <path fill-rule="evenodd" d="M4 16.5v-13h-.25a.75.75 0 010-1.5h12.5a.75.75 0 010 1.5H16v13h.25a.75.75 0 010 1.5H3.75a.75.75 0 010-1.5H4zm3-11a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5A.75.75 0 017 5.5zm.75 2.25a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5zM7 11a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5A.75.75 0 017 11zm1.5 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clip-rule="evenodd"/>
                </svg>
                <svg *ngIf="k.icon === 'co2'" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                  <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zm0 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zm-7.25-4.25a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5h1.5zm17 0a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5h1.5z"/>
                  <path fill-rule="evenodd" d="M10 5a5 5 0 100 10 5 5 0 000-10zm-3 5a3 3 0 116 0 3 3 0 01-6 0z" clip-rule="evenodd"/>
                </svg>
                <svg *ngIf="k.icon === 'avg'" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                  <path fill-rule="evenodd" d="M12.577 4.878a.75.75 0 01-.919.53l-1.36-.34a.75.75 0 01.388-1.448l1.36.34a.75.75 0 01.53.918zM7.5 10.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm5 5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM16.5 4.5l-13 13" clip-rule="evenodd"/>
                </svg>
                <svg *ngIf="k.icon === 'm2'" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                  <path fill-rule="evenodd" d="M9.674 2.075a.75.75 0 01.652 0l7.25 3.5A.75.75 0 0117 6.75v7.5a.75.75 0 01-.576.726l-7.25 2A.75.75 0 018.5 16.25v-7.5a.75.75 0 01.576-.726l7.25-2a.75.75 0 01.348 1.46L10 9.388v6.22l6-1.655V7.19l-6.326-3.054z" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>
            <span class="kpi-value">{{ k.value }}</span>
            <span class="kpi-unit">{{ k.unit }}</span>
          </div>
        </div>

        <!-- Charts section -->
        <div class="charts-row">
          <div class="card chart-card">
            <div class="card-head">
              <h3>Repartition des emissions</h3>
              <span class="card-tag">Construction vs Exploitation</span>
            </div>
            <div class="chart-wrap">
              <canvas #pieChart></canvas>
            </div>
          </div>

          <div class="card chart-card">
            <div class="card-head">
              <h3>Empreinte par site</h3>
              <span class="card-tag">CO&#8322; total (kg)</span>
            </div>
            <div class="chart-wrap">
              <canvas #barChart></canvas>
            </div>
          </div>
        </div>

        <!-- Sites section -->
        <div class="sites-section">
          <div class="section-head">
            <h3>Mes sites <span class="count-badge">{{ sites.length }}</span></h3>
          </div>

          <div class="sites-grid" *ngIf="sites.length > 0">
            <div class="site-card" *ngFor="let site of sites; let i = index"
                 [style.animation-delay]="(i * 0.06) + 's'">
              <div class="site-top">
                <div>
                  <h4 class="site-name">{{ site.name }}</h4>
                  <p class="site-loc">{{ site.location || 'Localisation non renseignee' }}</p>
                </div>
                <div class="site-actions">
                  <button class="action-btn" (click)="editSite(site)" title="Modifier">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                      <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z"/>
                    </svg>
                  </button>
                  <button class="action-btn danger" (click)="deleteSite(site.id!)" title="Supprimer">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                      <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.7.797l-.5 6a.75.75 0 01-1.497-.124l.5-6a.75.75 0 01.797-.672zm3.538.796a.75.75 0 00-1.497-.124l-.5 6a.75.75 0 001.497.124l.5-6z" clip-rule="evenodd"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div class="site-metrics">
                <div class="metric">
                  <span class="metric-val">{{ formatNumber(site.totalSurface) }}</span>
                  <span class="metric-lbl">m&#178; surface</span>
                </div>
                <div class="metric-sep"></div>
                <div class="metric">
                  <span class="metric-val accent">{{ formatNumber(site.totalFootprint) }}</span>
                  <span class="metric-lbl">kg CO&#8322;</span>
                </div>
                <div class="metric-sep"></div>
                <div class="metric">
                  <span class="metric-val">{{ formatNumber(site.footprintPerM2) }}</span>
                  <span class="metric-lbl">kg/m&#178;</span>
                </div>
              </div>

              <div class="site-bar-wrap">
                <div class="site-bar">
                  <div class="site-bar-fill construction"
                       [style.width.%]="getConstructionPct(site)"
                       title="Construction"></div>
                  <div class="site-bar-fill operational"
                       [style.width.%]="getOperationalPct(site)"
                       title="Exploitation"></div>
                </div>
                <div class="site-bar-legend">
                  <span><i class="dot dot-c"></i> Construction</span>
                  <span><i class="dot dot-o"></i> Exploitation</span>
                </div>
              </div>
            </div>
          </div>

          <div class="empty-state" *ngIf="sites.length === 0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="48" height="48">
              <path d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707"/>
              <circle cx="12" cy="12" r="4"/>
            </svg>
            <p>Aucun site enregistre</p>
            <button class="btn-add sm" (click)="showSiteForm()">Ajouter un site</button>
          </div>
        </div>
      </main>

      <!-- Modal -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h3>{{ editMode ? 'Modifier le site' : 'Nouveau site' }}</h3>
            <button class="modal-close" (click)="closeForm()">
              <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
              </svg>
            </button>
          </div>

          <form (ngSubmit)="saveSite()" class="modal-form">
            <div class="form-section">
              <span class="section-label">Informations generales</span>
              <div class="form-grid">
                <div class="form-field">
                  <label>Nom du site *</label>
                  <input [(ngModel)]="currentSite.name" name="name" required placeholder="Ex: Campus Rennes">
                </div>
                <div class="form-field">
                  <label>Localisation</label>
                  <input [(ngModel)]="currentSite.location" name="location" placeholder="Ville, Pays">
                </div>
              </div>
              <div class="form-grid">
                <div class="form-field">
                  <label>Surface totale (m&#178;) *</label>
                  <input type="number" [(ngModel)]="currentSite.totalSurface" name="surface" required placeholder="0">
                </div>
                <div class="form-field">
                  <label>Conso. energetique (MWh/an) *</label>
                  <input type="number" [(ngModel)]="currentSite.energyConsumption" name="energy" required placeholder="0">
                </div>
              </div>
              <div class="form-grid">
                <div class="form-field">
                  <label>Employes</label>
                  <input type="number" [(ngModel)]="currentSite.employees" name="employees" placeholder="0">
                </div>
                <div class="form-field">
                  <label>Places parking</label>
                  <input type="number" [(ngModel)]="currentSite.parkingPlaces" name="parking" placeholder="0">
                </div>
              </div>
            </div>

            <div class="form-section">
              <span class="section-label">Materiaux de construction (tonnes)</span>
              <div class="form-grid cols-4">
                <div class="form-field">
                  <label>Beton</label>
                  <input type="number" [(ngModel)]="currentSite.concreteQuantity" name="concrete" placeholder="0">
                </div>
                <div class="form-field">
                  <label>Acier</label>
                  <input type="number" [(ngModel)]="currentSite.steelQuantity" name="steel" placeholder="0">
                </div>
                <div class="form-field">
                  <label>Verre</label>
                  <input type="number" [(ngModel)]="currentSite.glassQuantity" name="glass" placeholder="0">
                </div>
                <div class="form-field">
                  <label>Bois</label>
                  <input type="number" [(ngModel)]="currentSite.woodQuantity" name="wood" placeholder="0">
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-cancel" (click)="closeForm()">Annuler</button>
              <button type="submit" class="btn-save">
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/>
                </svg>
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('pieChart') pieCanvas!: ElementRef;
  @ViewChild('barChart') barCanvas!: ElementRef;

  sites: Site[] = [];
  stats: any = {};
  currentUser: any;
  showForm = false;
  editMode = false;
  currentSite: any = {};
  kpis: any[] = [];

  private pieChart: any;
  private barChart: any;

  constructor(
    private siteService: SiteService,
    private authService: AuthService,
    private router: Router
  ) {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit() {
    setTimeout(() => this.initCharts(), 100);
  }

  loadData() {
    this.siteService.getMySites().subscribe(sites => {
      this.sites = sites;
      this.updateCharts();
    });

    this.siteService.getStats().subscribe(stats => {
      this.stats = stats;
      this.kpis = [
        { label: 'Sites enregistres', value: stats?.totalSites || 0, unit: 'sites', icon: 'sites', color: 'green' },
        { label: 'CO\u2082 total', value: this.formatNumber(stats?.totalFootprint), unit: 'tonnes', icon: 'co2', color: 'cyan' },
        { label: 'CO\u2082 moyen / site', value: this.formatNumber(stats?.averageFootprint), unit: 'tonnes', icon: 'avg', color: 'green' },
        { label: 'CO\u2082 moyen / m\u00B2', value: this.formatNumber(stats?.averageFootprintPerM2), unit: 'kg/m\u00B2', icon: 'm2', color: 'cyan' },
      ];
    });
  }

  initCharts() {
    if (this.pieCanvas && this.barCanvas) {
      this.createPieChart();
      this.createBarChart();
    }
  }

  createPieChart() {
    const constructionTotal = this.sites.reduce((sum, s) => sum + (s.constructionFootprint || 0), 0);
    const operationalTotal = this.sites.reduce((sum, s) => sum + (s.operationalFootprint || 0), 0);

    const ctx = this.pieCanvas.nativeElement.getContext('2d');
    const gradient1 = ctx.createLinearGradient(0, 0, 200, 200);
    gradient1.addColorStop(0, '#00e88f');
    gradient1.addColorStop(1, '#00b46e');
    const gradient2 = ctx.createLinearGradient(0, 0, 200, 200);
    gradient2.addColorStop(0, '#00b4d8');
    gradient2.addColorStop(1, '#0090b0');

    this.pieChart = new Chart(this.pieCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Construction', 'Exploitation'],
        datasets: [{
          data: [constructionTotal, operationalTotal],
          backgroundColor: [gradient1, gradient2],
          borderColor: 'rgba(7, 11, 9, 0.8)',
          borderWidth: 3,
          hoverBorderColor: 'rgba(7, 11, 9, 1)',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'rgba(240, 237, 232, 0.5)',
              font: { family: 'Outfit', size: 12 },
              padding: 20,
              usePointStyle: true,
              pointStyleWidth: 8,
            }
          }
        }
      }
    });
  }

  createBarChart() {
    const ctx = this.barCanvas.nativeElement.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(0, 232, 143, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 232, 143, 0.15)');

    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.sites.map(s => s.name.length > 15 ? s.name.substring(0, 15) + '...' : s.name),
        datasets: [{
          label: 'CO\u2082 total (kg)',
          data: this.sites.map(s => s.totalFootprint || 0),
          backgroundColor: gradient,
          borderColor: '#00e88f',
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: 'rgba(240,237,232,0.35)',
              font: { family: 'Outfit', size: 11 }
            },
            border: { color: 'rgba(255,255,255,0.06)' }
          },
          x: {
            grid: { display: false },
            ticks: {
              color: 'rgba(240,237,232,0.4)',
              font: { family: 'Outfit', size: 11 }
            },
            border: { color: 'rgba(255,255,255,0.06)' }
          }
        }
      }
    });
  }

  updateCharts() {
    if (this.pieChart) {
      this.pieChart.destroy();
      this.createPieChart();
    }
    if (this.barChart) {
      this.barChart.destroy();
      this.createBarChart();
    }
  }

  getConstructionPct(site: Site): number {
    const total = (site.constructionFootprint || 0) + (site.operationalFootprint || 0);
    return total > 0 ? ((site.constructionFootprint || 0) / total) * 100 : 50;
  }

  getOperationalPct(site: Site): number {
    return 100 - this.getConstructionPct(site);
  }

  showSiteForm() {
    this.showForm = true;
    this.editMode = false;
    this.currentSite = {};
  }

  editSite(site: Site) {
    this.showForm = true;
    this.editMode = true;
    this.currentSite = { ...site };
  }

  closeForm() {
    this.showForm = false;
    this.currentSite = {};
  }

  saveSite() {
    if (this.editMode) {
      this.siteService.updateSite(this.currentSite.id, this.currentSite).subscribe(() => {
        this.loadData();
        this.closeForm();
      });
    } else {
      this.siteService.createSite(this.currentSite).subscribe(() => {
        this.loadData();
        this.closeForm();
      });
    }
  }

  deleteSite(id: number) {
    if (confirm('\u00CAtes-vous s\u00FBr de vouloir supprimer ce site ?')) {
      this.siteService.deleteSite(id).subscribe(() => {
        this.loadData();
      });
    }
  }

  formatNumber(num: any): string {
    if (!num) return '0';
    return (num / 1000).toFixed(2);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
