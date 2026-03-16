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
    <div class="dashboard">
      <nav class="navbar">
        <h1>🌍 Carbon Calculator</h1>
        <div class="nav-actions">
          <span>Bonjour, {{ currentUser?.username }}</span>
          <button (click)="logout()" class="btn-logout">Déconnexion</button>
        </div>
      </nav>

      <div class="container">
        <div class="header">
          <h2>Tableau de bord</h2>
          <button (click)="showSiteForm()" class="btn-primary">+ Nouveau site</button>
        </div>

        <!-- KPIs -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon">📊</div>
            <div class="kpi-content">
              <h3>{{ stats?.totalSites || 0 }}</h3>
              <p>Sites enregistrés</p>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon">🌱</div>
            <div class="kpi-content">
              <h3>{{ formatNumber(stats?.totalFootprint) }} t</h3>
              <p>CO₂ total</p>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon">📈</div>
            <div class="kpi-content">
              <h3>{{ formatNumber(stats?.averageFootprint) }} t</h3>
              <p>CO₂ moyen par site</p>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon">🏢</div>
            <div class="kpi-content">
              <h3>{{ formatNumber(stats?.averageFootprintPerM2) }} kg/m²</h3>
              <p>CO₂ moyen par m²</p>
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="charts-grid">
          <div class="chart-card">
            <h3>Répartition Construction vs Exploitation</h3>
            <canvas #pieChart></canvas>
          </div>

          <div class="chart-card">
            <h3>Empreinte carbone par site</h3>
            <canvas #barChart></canvas>
          </div>
        </div>

        <!-- Sites List -->
        <div class="sites-section">
          <h3>Mes sites</h3>
          <div class="sites-grid">
            <div *ngFor="let site of sites" class="site-card">
              <div class="site-header">
                <h4>{{ site.name }}</h4>
                <div class="site-actions">
                  <button (click)="editSite(site)" class="btn-icon">✏️</button>
                  <button (click)="deleteSite(site.id!)" class="btn-icon">🗑️</button>
                </div>
              </div>
              <p class="site-location">📍 {{ site.location || 'Non spécifié' }}</p>
              <div class="site-stats">
                <div class="stat">
                  <span class="stat-label">Surface</span>
                  <span class="stat-value">{{ formatNumber(site.totalSurface) }} m²</span>
                </div>
                <div class="stat">
                  <span class="stat-label">CO₂ total</span>
                  <span class="stat-value">{{ formatNumber(site.totalFootprint) }} kg</span>
                </div>
                <div class="stat">
                  <span class="stat-label">CO₂/m²</span>
                  <span class="stat-value">{{ formatNumber(site.footprintPerM2) }} kg</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Site Form Modal -->
      <div *ngIf="showForm" class="modal-overlay" (click)="closeForm()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h3>{{ editMode ? 'Modifier le site' : 'Nouveau site' }}</h3>
          <form (ngSubmit)="saveSite()">
            <div class="form-row">
              <div class="form-group">
                <label>Nom du site *</label>
                <input [(ngModel)]="currentSite.name" name="name" required>
              </div>
              <div class="form-group">
                <label>Localisation</label>
                <input [(ngModel)]="currentSite.location" name="location">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Surface totale (m²) *</label>
                <input type="number" [(ngModel)]="currentSite.totalSurface" name="surface" required>
              </div>
              <div class="form-group">
                <label>Consommation énergétique (MWh/an) *</label>
                <input type="number" [(ngModel)]="currentSite.energyConsumption" name="energy" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Nombre d'employés</label>
                <input type="number" [(ngModel)]="currentSite.employees" name="employees">
              </div>
              <div class="form-group">
                <label>Places de parking</label>
                <input type="number" [(ngModel)]="currentSite.parkingPlaces" name="parking">
              </div>
            </div>

            <h4>Matériaux de construction (tonnes)</h4>
            <div class="form-row">
              <div class="form-group">
                <label>Béton</label>
                <input type="number" [(ngModel)]="currentSite.concreteQuantity" name="concrete">
              </div>
              <div class="form-group">
                <label>Acier</label>
                <input type="number" [(ngModel)]="currentSite.steelQuantity" name="steel">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Verre</label>
                <input type="number" [(ngModel)]="currentSite.glassQuantity" name="glass">
              </div>
              <div class="form-group">
                <label>Bois</label>
                <input type="number" [(ngModel)]="currentSite.woodQuantity" name="wood">
              </div>
            </div>

            <div class="form-actions">
              <button type="button" (click)="closeForm()" class="btn-secondary">Annuler</button>
              <button type="submit" class="btn-primary">Enregistrer</button>
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

    this.pieChart = new Chart(this.pieCanvas.nativeElement, {
      type: 'pie',
      data: {
        labels: ['Construction', 'Exploitation'],
        datasets: [{
          data: [constructionTotal, operationalTotal],
          backgroundColor: ['#667eea', '#764ba2']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  createBarChart() {
    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.sites.map(s => s.name),
        datasets: [{
          label: 'CO₂ total (kg)',
          data: this.sites.map(s => s.totalFootprint || 0),
          backgroundColor: '#667eea'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
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
    if (confirm('Êtes-vous sûr de vouloir supprimer ce site ?')) {
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
