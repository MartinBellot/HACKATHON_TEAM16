import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { SiteService } from '../services/site.service';
import { AuthService } from '../services/auth.service';
import { SiteEnrichService, EnterpriseResult } from '../services/site-enrich.service';
import { EnvironmentalContextService } from '../services/environmental-context.service';
import { Site } from '../models/site.model';
import { EnvironmentalContext } from '../models/environmental-context.model';
import { FormsModule } from '@angular/forms';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-shell">

      <!-- ── Navbar ── -->
      <nav class="navbar">
        <div class="nav-brand">
          <div class="nav-logo">
            <svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#007AFF"/>
              <path d="M9 17l4.5 4.5L23 12" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="16" cy="8" r="1.5" fill="rgba(255,255,255,0.7)"/>
            </svg>
          </div>
          <span class="nav-title">CO₂nscient</span>
        </div>
        <div class="nav-right">
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

      <!-- ── Main ── -->
      <main class="main">
        <div class="container">

          <!-- Page header -->
          <header class="page-header">
            <div>
              <h1 class="page-title">Tableau de bord</h1>
              <p class="page-subtitle">Suivi de l'empreinte carbone de vos sites</p>
            </div>
            <button (click)="showSiteForm()" class="btn-primary">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
              </svg>
              Nouveau site
            </button>
          </header>

          <!-- ── Search & sort ── -->
          <div class="search-bar" *ngIf="sites.length > 0">
            <div class="search-field">
              <span class="search-icon">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
              </span>
              <input type="search" placeholder="Rechercher un site, une ville…" [(ngModel)]="searchQuery" name="search"/>
              <button *ngIf="searchQuery" (click)="searchQuery = ''" class="search-clear" type="button" aria-label="Effacer">✕</button>
            </div>
            <div class="sort-group" role="group" aria-label="Trier par">
              <button class="sort-btn" [class.active]="sortBy === 'name'"    (click)="sortBy = 'name'"      type="button">Nom</button>
              <button class="sort-btn" [class.active]="sortBy === 'footprint'" (click)="sortBy = 'footprint'" type="button">CO₂ ↓</button>
              <button class="sort-btn" [class.active]="sortBy === 'surface'"  (click)="sortBy = 'surface'"  type="button">Surface ↓</button>
            </div>
          </div>

          <!-- ── KPI Grid ── -->
          <section class="kpi-grid" aria-label="Indicateurs clés">

            <div class="kpi-card kpi-blue">
              <div class="kpi-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <div class="kpi-body">
                <div class="kpi-value">{{ stats?.totalSites ?? 0 }}</div>
                <div class="kpi-label">Sites enregistrés</div>
              </div>
            </div>

            <div class="kpi-card kpi-green">
              <div class="kpi-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="kpi-body">
                <div class="kpi-value">{{ formatTonnes(stats?.totalFootprint) }}</div>
                <div class="kpi-label">t CO₂ total</div>
              </div>
            </div>

            <div class="kpi-card kpi-orange">
              <div class="kpi-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <div class="kpi-body">
                <div class="kpi-value">{{ formatTonnes(stats?.averageFootprint) }}</div>
                <div class="kpi-label">t CO₂ moyen / site</div>
              </div>
            </div>

            <div class="kpi-card kpi-purple">
              <div class="kpi-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                </svg>
              </div>
              <div class="kpi-body">
                <div class="kpi-value">{{ formatKgM2(stats?.averageFootprintPerM2) }}</div>
                <div class="kpi-label">kg CO₂ / m² / an moyen</div>
              </div>
            </div>

          </section>

          <!-- ── Carbon equivalences ── -->
          <div class="equiv-strip" *ngIf="(stats?.totalFootprint ?? 0) > 0">
            <div class="equiv-card">
              <span class="equiv-icon">✈️</span>
              <div class="equiv-body">
                <div class="equiv-value">{{ flightsEquiv }}</div>
                <div class="equiv-label">vols Paris–New York</div>
              </div>
            </div>
            <div class="equiv-card">
              <span class="equiv-icon">🚗</span>
              <div class="equiv-body">
                <div class="equiv-value">{{ carsEquiv }}</div>
                <div class="equiv-label">voitures roulant 1 an</div>
              </div>
            </div>
            <div class="equiv-card">
              <span class="equiv-icon">🌳</span>
              <div class="equiv-body">
                <div class="equiv-value">{{ treesEquiv }}</div>
                <div class="equiv-label">arbres à planter pour compenser</div>
              </div>
            </div>
            <div class="equiv-card">
              <span class="equiv-icon">🏠</span>
              <div class="equiv-body">
                <div class="equiv-value">{{ homesEquiv }}</div>
                <div class="equiv-label">foyers alimentés 1 an</div>
              </div>
            </div>
          </div>

          <!-- ── Charts ── -->
          <section class="chart-grid" aria-label="Graphiques">

            <div class="chart-card" [class.chart-empty]="sites.length === 0">
              <div class="chart-header">
                <h2 class="chart-title">Construction vs Exploitation</h2>
                <span class="chart-badge">Répartition</span>
              </div>
              <div class="chart-body">
                <canvas #pieChart></canvas>
                <p *ngIf="sites.length === 0" class="chart-placeholder">
                  Ajoutez des sites pour voir la répartition
                </p>
              </div>
            </div>

            <div class="chart-card" [class.chart-empty]="sites.length === 0">
              <div class="chart-header">
                <h2 class="chart-title">Empreinte par site</h2>
                <span class="chart-badge">t CO₂</span>
              </div>
              <div class="chart-body">
                <canvas #barChart></canvas>
                <p *ngIf="sites.length === 0" class="chart-placeholder">
                  Ajoutez des sites pour voir les données
                </p>
              </div>
            </div>

            <div class="chart-card" [class.chart-empty]="sites.length === 0">
              <div class="chart-header">
                <h2 class="chart-title">Intensité carbone par site</h2>
                <span class="chart-badge">kg CO₂ / m²</span>
              </div>
              <div class="chart-body">
                <canvas #intensityChart></canvas>
                <p *ngIf="sites.length === 0" class="chart-placeholder">
                  Ajoutez des sites pour voir l'intensité carbone
                </p>
              </div>
            </div>

            <div class="chart-card chart-card--wide" [class.chart-empty]="sites.length === 0">
              <div class="chart-header">
                <h2 class="chart-title">Construction vs Exploitation par site</h2>
                <span class="chart-badge">t CO₂ empilé</span>
              </div>
              <div class="chart-body chart-body--tall">
                <canvas #stackedSitesChart></canvas>
                <p *ngIf="sites.length === 0" class="chart-placeholder">
                  Ajoutez des sites pour voir la répartition par site
                </p>
              </div>
            </div>

            <div class="chart-card" [class.chart-empty]="sites.length === 0">
              <div class="chart-header">
                <h2 class="chart-title">Matériaux de construction</h2>
                <span class="chart-badge">tonnes</span>
              </div>
              <div class="chart-body">
                <canvas #materialsChart></canvas>
                <p *ngIf="sites.length === 0 || !hasMaterialData" class="chart-placeholder">
                  Ajoutez des sites avec des données matériaux
                </p>
              </div>
            </div>

          </section>

          <!-- ── Sites ── -->
          <section class="sites-section">
            <div class="section-header">
              <h2 class="section-title">Mes sites</h2>
              <span class="site-count" *ngIf="sites.length > 0">{{ filteredSites.length }}/{{ sites.length }} site{{ sites.length > 1 ? 's' : '' }}</span>
              <button *ngIf="sites.length > 0" (click)="exportCsv()" class="btn-export" type="button">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                Exporter CSV
              </button>
            </div>

            <!-- Empty state -->
            <div *ngIf="sites.length === 0" class="empty-state">
              <div class="empty-icon">
                <svg viewBox="0 0 64 64" fill="none">
                  <rect x="8" y="8" width="48" height="48" rx="12" fill="var(--bg-tertiary)"/>
                  <path d="M32 20v24M20 32h24" stroke="var(--text-tertiary)" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
              </div>
              <h3>Aucun site enregistré</h3>
              <p>Commencez par ajouter votre premier site pour calculer son empreinte carbone.</p>
              <button (click)="showSiteForm()" class="btn-primary">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
                </svg>
                Ajouter un site
              </button>
            </div>

            <!-- No results -->
            <div *ngIf="sites.length > 0 && filteredSites.length === 0" class="no-results">
              <strong>Aucun résultat pour « {{ searchQuery }} »</strong>
              <p>Essayez un autre nom ou une autre localisation.</p>
            </div>

            <!-- Sites grid -->
            <div *ngIf="filteredSites.length > 0" class="sites-grid">
              <div *ngFor="let site of filteredSites; let i = index" class="site-card"
                   [style.animation-delay]="(i * 60) + 'ms'">

                <!-- Header: grade + actions -->
                <div class="card-header">
                  <div class="card-badges">
                    <div class="grade-wrapper" [class]="'grade-' + getCarbonScore(site).grade.toLowerCase()">
                      <span class="grade-letter" [style.color]="getCarbonScore(site).fg">{{ getCarbonScore(site).grade }}</span>
                      <div class="grade-tooltip">
                        <strong>Efficacité énergétique</strong>
                        <span>{{ formatKgM2(site.footprintPerM2) }} kgCO₂/m²/an</span>
                        <span class="tooltip-hint">Construction amortie 50 ans + exploitation</span>
                      </div>
                    </div>
                    <div class="impact-wrapper">
                      <span class="impact-pill" [style.background]="getImpactLevel(site).bg" [style.color]="getImpactLevel(site).fg">
                        {{ getImpactLevel(site).label }}
                      </span>
                      <div class="impact-tooltip">
                        <strong>Impact absolu</strong>
                        <span>{{ formatTonnes(site.totalFootprint) }} tCO₂/an</span>
                        <span class="tooltip-hint">Émissions annualisées totales du site</span>
                      </div>
                    </div>
                  </div>
                  <div class="card-actions">
                    <button (click)="openSiteDetail(site)" class="action-btn action-report" aria-label="Voir le rapport">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>
                      </svg>
                    </button>
                    <button (click)="editSite(site)" class="action-btn action-edit" aria-label="Modifier">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                      </svg>
                    </button>
                    <button (click)="requestDelete(site.id!)" class="action-btn action-delete" aria-label="Supprimer">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Identity -->
                <div class="card-identity" (click)="openSiteDetail(site)" style="cursor: pointer;">
                  <h3 class="site-name">{{ site.name }}</h3>
                  <div class="site-location" *ngIf="site.location">
                    <svg viewBox="0 0 16 16" fill="currentColor">
                      <path fill-rule="evenodd" d="M8 0C4.686 0 2 2.686 2 6c0 4 6 10 6 10s6-6 6-10c0-3.314-2.686-6-6-6zm0 8.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" clip-rule="evenodd"/>
                    </svg>
                    <span>{{ site.location }}</span>
                  </div>
                </div>

                <!-- Hero metric -->
                <div class="card-hero">
                  <div class="hero-value" [style.color]="getCarbonScore(site).fg">
                    {{ formatKgM2(site.footprintPerM2) }}
                  </div>
                  <div class="hero-unit">kgCO₂/m²/an</div>
                </div>

                <!-- Stats -->
                <div class="card-stats">
                  <div class="stat-cell" title="Surface totale du site">
                    <span class="stat-number">{{ formatInt(site.totalSurface) }}</span>
                    <span class="stat-unit">m²</span>
                  </div>
                  <div class="stat-cell" title="Émissions annualisées totales">
                    <span class="stat-number accent">{{ formatTonnes(site.totalFootprint) }}</span>
                    <span class="stat-unit">tCO₂/an</span>
                  </div>
                  <div class="stat-cell" *ngIf="site.employees" title="Nombre d'employés sur le site">
                    <span class="stat-number">{{ site.employees }}</span>
                    <span class="stat-unit">employés</span>
                  </div>
                </div>

                <!-- Bar -->
                <div class="card-bar" [title]="'Empreinte relative : ' + formatTonnes(site.totalFootprint) + ' t — ' + getBarWidth(site).toFixed(0) + '% du site le plus émetteur'">
                  <div class="bar-track">
                    <div class="bar-fill"
                         [style.width]="getBarWidth(site) + '%'"
                         [style.background]="'linear-gradient(90deg, ' + getCarbonScore(site).fg + '44, ' + getCarbonScore(site).fg + ')'">
                    </div>
                  </div>
                </div>

                <!-- Environmental Context toggle -->
                <button *ngIf="site.latitude && site.longitude" class="env-toggle"
                        (click)="toggleEnvContext(site)"
                        [class.env-toggle--active]="expandedEnvSite === site.id">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                  </svg>
                  Contexte environnemental
                  <svg class="env-chevron" viewBox="0 0 20 20" fill="currentColor" [style.transform]="expandedEnvSite === site.id ? 'rotate(180deg)' : ''">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                  </svg>
                </button>

                <!-- Environmental Context panel -->
                <div *ngIf="expandedEnvSite === site.id" class="env-panel">
                  <div *ngIf="envContextLoading" class="env-loading">
                    <div class="env-spinner"></div>
                    <span>Chargement des données environnementales…</span>
                  </div>

                  <ng-container *ngIf="!envContextLoading && envContextData[site.id!]">

                    <!-- DPE -->
                    <div class="env-section" *ngIf="envContextData[site.id!].dpe?.nearbyBuildingsCount">
                      <div class="env-section-header">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
                        <h4>DPE voisinage</h4>
                        <span class="env-badge">{{ envContextData[site.id!].dpe!.nearbyBuildingsCount }} bâtiments</span>
                      </div>
                      <div class="env-kpi-row">
                        <div class="env-kpi">
                          <span class="env-kpi-value">{{ envContextData[site.id!].dpe!.averageDpe }}</span>
                          <span class="env-kpi-unit">kWhEP/m²/an moy.</span>
                        </div>
                        <div class="env-kpi">
                          <span class="env-kpi-value env-grade" [class]="'dpe-' + (envContextData[site.id!].dpe!.dominantLabel || 'D').toLowerCase()">
                            {{ envContextData[site.id!].dpe!.dominantLabel }}
                          </span>
                          <span class="env-kpi-unit">classe dominante</span>
                        </div>
                      </div>
                      <div class="dpe-bar" *ngIf="envContextData[site.id!].dpe!.distribution">
                        <div *ngFor="let d of envContextData[site.id!].dpe!.distribution"
                             class="dpe-segment" [class]="'dpe-' + d.label.toLowerCase()"
                             [style.flex]="d.count"
                             [title]="d.label + ': ' + d.count + ' bâtiments'">
                          <span *ngIf="d.count > 0">{{ d.label }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Climate -->
                    <div class="env-section" *ngIf="envContextData[site.id!].climate?.annualMeanTemp">
                      <div class="env-section-header">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.547a1 1 0 01.894 1.79l-1.233.422 1.606 2.765a1 1 0 01-1.732 1l-1.604-2.762-3.484 1.19V13h3.5a1 1 0 110 2H6.5a1 1 0 110-2H10V8.763L6.516 7.573l-1.604 2.762a1 1 0 11-1.732-1l1.606-2.765-1.233-.422a1 1 0 11.894-1.79l1.599.547L10 3.323V3a1 1 0 011-1z" clip-rule="evenodd"/></svg>
                        <h4>Climat</h4>
                        <span class="env-badge">Zone {{ envContextData[site.id!].climate!.climateZone }}</span>
                      </div>
                      <div class="env-kpi-row">
                        <div class="env-kpi">
                          <span class="env-kpi-value">{{ envContextData[site.id!].climate!.annualMeanTemp }}°C</span>
                          <span class="env-kpi-unit">temp. moyenne</span>
                        </div>
                        <div class="env-kpi">
                          <span class="env-kpi-value">{{ envContextData[site.id!].climate!.heatingDegreeDays }}</span>
                          <span class="env-kpi-unit">DJU chauffage</span>
                        </div>
                        <div class="env-kpi">
                          <span class="env-kpi-value">{{ envContextData[site.id!].climate!.coolingDegreeDays }}</span>
                          <span class="env-kpi-unit">DJU climatisation</span>
                        </div>
                        <div class="env-kpi" *ngIf="envContextData[site.id!].climate!.annualSolarRadiation">
                          <span class="env-kpi-value">{{ envContextData[site.id!].climate!.annualSolarRadiation }}</span>
                          <span class="env-kpi-unit">kWh/m² solaire</span>
                        </div>
                      </div>
                    </div>

                    <!-- Transport -->
                    <div class="env-section" *ngIf="envContextData[site.id!].transport">
                      <div class="env-section-header">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13 6H7a4 4 0 00-4 4v4a2 2 0 002 2h1l1 2h6l1-2h1a2 2 0 002-2v-4a4 4 0 00-4-4zM7 14a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2zM5 2h10a1 1 0 010 2H5a1 1 0 010-2z"/></svg>
                        <h4>Transports</h4>
                        <span class="env-badge" [class]="'access-' + (envContextData[site.id!].transport!.accessibilityScore || 'Faible').toLowerCase()">
                          {{ envContextData[site.id!].transport!.accessibilityScore }}
                        </span>
                      </div>
                      <div class="env-transport-grid">
                        <div class="transport-item" *ngIf="envContextData[site.id!].transport!.busStopsNearby">
                          <span class="transport-count">{{ envContextData[site.id!].transport!.busStopsNearby }}</span>
                          <span class="transport-label">Bus</span>
                        </div>
                        <div class="transport-item" *ngIf="envContextData[site.id!].transport!.tramStopsNearby">
                          <span class="transport-count">{{ envContextData[site.id!].transport!.tramStopsNearby }}</span>
                          <span class="transport-label">Tram</span>
                        </div>
                        <div class="transport-item" *ngIf="envContextData[site.id!].transport!.metroStopsNearby">
                          <span class="transport-count">{{ envContextData[site.id!].transport!.metroStopsNearby }}</span>
                          <span class="transport-label">Métro</span>
                        </div>
                        <div class="transport-item" *ngIf="envContextData[site.id!].transport!.trainStationsNearby">
                          <span class="transport-count">{{ envContextData[site.id!].transport!.trainStationsNearby }}</span>
                          <span class="transport-label">Gare</span>
                        </div>
                        <div class="transport-item" *ngIf="envContextData[site.id!].transport!.bikeShareNearby">
                          <span class="transport-count">{{ envContextData[site.id!].transport!.bikeShareNearby }}</span>
                          <span class="transport-label">Vélos</span>
                        </div>
                      </div>
                      <div class="transport-nearest" *ngIf="envContextData[site.id!].transport!.nearestStopName">
                        Arrêt le plus proche : <strong>{{ envContextData[site.id!].transport!.nearestStopName }}</strong>
                        à {{ envContextData[site.id!].transport!.nearestStopDistance }}m
                      </div>
                    </div>

                    <!-- No data -->
                    <div *ngIf="!envContextData[site.id!].dpe?.nearbyBuildingsCount && !envContextData[site.id!].climate?.annualMeanTemp && !envContextData[site.id!].transport" class="env-empty">
                      Aucune donnée environnementale disponible pour cette localisation.
                    </div>

                    <!-- Link to full report -->
                    <button class="env-report-link" (click)="openSiteDetail(site)">
                      <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/></svg>
                      Voir le rapport complet et recommandations
                      <svg viewBox="0 0 20 20" fill="currentColor" class="arrow-right"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                    </button>

                  </ng-container>
                </div>

              </div>
            </div>
          </section>

        </div>
      </main>

      <!-- ── MODAL: Site form ── -->
      <div *ngIf="showForm" class="modal-backdrop" (click)="closeForm()" role="dialog" aria-modal="true">
        <div class="modal" (click)="$event.stopPropagation()">

          <div class="modal-header">
            <h2 class="modal-title">{{ editMode ? 'Modifier le site' : 'Nouveau site' }}</h2>
            <button class="modal-close" (click)="closeForm()" aria-label="Fermer">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>

          <form (ngSubmit)="saveSite()" class="modal-form">

            <!-- Sirene hint banner (new site only) -->
            <div *ngIf="!editMode" class="enrich-banner">
              <svg viewBox="0 0 20 20" fill="currentColor" class="enrich-banner-icon">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
              </svg>
              Tapez un nom d'entreprise — les champs sont pré-remplis automatiquement via le registre <strong>Sirene (INSEE)</strong>.
            </div>

            <div class="form-section">
              <h3 class="form-section-title">Informations générales</h3>
              <div class="form-row">
                <div class="form-field enrich-field">
                  <label class="form-label">Nom du site <span class="req">*</span></label>
                  <div class="enrich-input-wrap">
                    <input class="form-input" [(ngModel)]="currentSite.name" name="name" required
                           placeholder="Ex: Capgemini, La Défense…"
                           autocomplete="off"
                           (ngModelChange)="onNameInput($event)"
                           (blur)="hideEnrichSuggest()"/>
                    <span *ngIf="enrichLoading" class="enrich-spinner" aria-hidden="true">
                      <svg viewBox="0 0 20 20" fill="currentColor" class="enrich-spin"><path fill-rule="evenodd" d="M4 10a6 6 0 1112 0A6 6 0 014 10zm6-8a8 8 0 100 16A8 8 0 0010 2z" clip-rule="evenodd" opacity="0.3"/><path d="M10 2a8 8 0 018 8h-2a6 6 0 00-6-6V2z"/></svg>
                    </span>
                    <div *ngIf="showEnrichSuggest && enrichSuggestions.length > 0" class="enrich-dropdown" role="listbox">
                      <div *ngFor="let r of enrichSuggestions" class="enrich-item"
                           role="option" (mousedown)="selectEnterprise(r)">
                        <span class="enrich-name">{{ r.nom_raison_sociale }}</span>
                        <span class="enrich-addr">{{ r.siege?.geo_adresse || r.siege?.libelle_commune || '' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="form-field">
                  <label class="form-label">Localisation</label>
                  <input class="form-input" [(ngModel)]="currentSite.location" name="location" placeholder="Ex: Paris, France"/>
                </div>
              </div>
              <div class="form-row">
                <div class="form-field">
                  <label class="form-label">Surface totale (m²) <span class="req">*</span></label>
                  <input class="form-input" type="number" [(ngModel)]="currentSite.totalSurface" name="surface" required placeholder="0" min="0"/>
                </div>
                <div class="form-field">
                  <label class="form-label">Nombre d'employés</label>
                  <input class="form-input" type="number" [(ngModel)]="currentSite.employees" name="employees" placeholder="0" min="0"/>
                </div>
              </div>
            </div>

            <div class="form-section">
              <h3 class="form-section-title">Énergie &amp; Transport</h3>
              <div class="form-row">
                <div class="form-field">
                  <label class="form-label">Consommation énergétique (MWh/an) <span class="req">*</span></label>
                  <input class="form-input" type="number" [(ngModel)]="currentSite.energyConsumption" name="energy" required placeholder="0" min="0"/>
                </div>
                <div class="form-field">
                  <label class="form-label">Places de parking</label>
                  <input class="form-input" type="number" [(ngModel)]="currentSite.parkingPlaces" name="parking" placeholder="0" min="0"/>
                </div>
              </div>
            </div>

            <div class="form-section">
              <h3 class="form-section-title">Matériaux de construction (tonnes)</h3>
              <div class="form-row form-row-4">
                <div class="form-field">
                  <label class="form-label">Béton</label>
                  <input class="form-input" type="number" [(ngModel)]="currentSite.concreteQuantity" name="concrete" placeholder="0" min="0"/>
                </div>
                <div class="form-field">
                  <label class="form-label">Acier</label>
                  <input class="form-input" type="number" [(ngModel)]="currentSite.steelQuantity" name="steel" placeholder="0" min="0"/>
                </div>
                <div class="form-field">
                  <label class="form-label">Verre</label>
                  <input class="form-input" type="number" [(ngModel)]="currentSite.glassQuantity" name="glass" placeholder="0" min="0"/>
                </div>
                <div class="form-field">
                  <label class="form-label">Bois</label>
                  <input class="form-input" type="number" [(ngModel)]="currentSite.woodQuantity" name="wood" placeholder="0" min="0"/>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" (click)="closeForm()" class="btn-ghost">Annuler</button>
              <button type="submit" class="btn-primary">
                {{ editMode ? 'Enregistrer les modifications' : 'Créer le site' }}
              </button>
            </div>

          </form>
        </div>
      </div>

      <!-- ── MODAL: Delete confirm ── -->
      <div *ngIf="showDeleteConfirm" class="modal-backdrop" (click)="cancelDelete()" role="alertdialog" aria-modal="true">
        <div class="modal modal-sm" (click)="$event.stopPropagation()">
          <div class="confirm-icon-wrap">
            <svg viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="24" fill="rgba(255,59,48,0.12)"/>
              <path d="M24 14v10M24 30v2" stroke="#FF3B30" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </div>
          <h3 class="confirm-title">Supprimer ce site ?</h3>
          <p class="confirm-body">Cette action est irréversible. Toutes les données associées à ce site seront définitivement supprimées.</p>
          <div class="confirm-actions">
            <button (click)="cancelDelete()" class="btn-ghost">Annuler</button>
            <button (click)="confirmDelete()" class="btn-danger">Supprimer</button>
          </div>
        </div>
      </div>

      <!-- ── Toast ── -->
      <div *ngIf="toast" class="toast" [class.toast-success]="toast.type === 'success'" [class.toast-error]="toast.type === 'error'" role="status">
        <svg *ngIf="toast.type === 'success'" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <svg *ngIf="toast.type === 'error'" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        {{ toast.message }}
      </div>

    </div>
  `,
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('pieChart') pieCanvas!: ElementRef;
  @ViewChild('barChart') barCanvas!: ElementRef;
  @ViewChild('intensityChart') intensityCanvas!: ElementRef;
  @ViewChild('stackedSitesChart') stackedSitesCanvas!: ElementRef;
  @ViewChild('materialsChart') materialsCanvas!: ElementRef;

  sites: Site[] = [];
  stats: any = {};
  currentUser: any;
  showForm = false;
  editMode = false;
  currentSite: any = {};
  showDeleteConfirm = false;
  siteToDelete: number | null = null;
  toast: { message: string; type: 'success' | 'error' } | null = null;
  searchQuery = '';
  sortBy: 'name' | 'footprint' | 'surface' = 'name';

  /* ── Environmental context ── */
  envContextData: Record<number, EnvironmentalContext> = {};
  expandedEnvSite: number | null = null;
  envContextLoading = false;

  /* ── Sirene autocomplete ── */
  enrichSuggestions: EnterpriseResult[] = [];
  showEnrichSuggest = false;
  enrichLoading = false;
  private nameSubject = new Subject<string>();
  private enrichSub!: Subscription;

  private pieChartInstance: any;
  private barChartInstance: any;
  private intensityChartInstance: any;
  private stackedSitesChartInstance: any;
  private materialsChartInstance: any;
  private toastTimer: any;
  private maxFootprint = 0;

  constructor(
    private siteService: SiteService,
    private authService: AuthService,
    private router: Router,
    private siteEnrichService: SiteEnrichService,
    private envContextService: EnvironmentalContextService
  ) {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.enrichSub = this.nameSubject.pipe(
      debounceTime(300),
      switchMap(q => {
        if (!q || q.length < 3) {
          this.enrichSuggestions = [];
          this.enrichLoading = false;
          return of([]);
        }
        this.enrichLoading = true;
        return this.siteEnrichService.search(q);
      })
    ).subscribe((results: EnterpriseResult[]) => {
      this.enrichLoading = false;
      this.enrichSuggestions = results;
      this.showEnrichSuggest = results.length > 0;
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initCharts(), 120);
  }

  ngOnDestroy(): void {
    clearTimeout(this.toastTimer);
    this.pieChartInstance?.destroy();
    this.barChartInstance?.destroy();
    this.intensityChartInstance?.destroy();
    this.stackedSitesChartInstance?.destroy();
    this.materialsChartInstance?.destroy();
    this.enrichSub?.unsubscribe();
  }

  loadData(): void {
    this.siteService.getMySites().subscribe(sites => {
      this.sites = sites;
      this.maxFootprint = Math.max(...sites.map(s => s.totalFootprint ?? 0), 1);
      this.updateCharts();
    });
    this.siteService.getStats().subscribe(stats => {
      this.stats = stats;
    });
  }

  initCharts(): void {
    if (this.pieCanvas && this.barCanvas) {
      this.createPieChart();
      this.createBarChart();
      this.createIntensityChart();
      this.createStackedSitesChart();
      this.createMaterialsChart();
    }
  }

  private chartColors = {
    blue:   '#007AFF',
    green:  '#34C759',
    orange: '#FF9F0A',
    purple: '#AF52DE',
    teal:   '#32ADE6',
    red:    '#FF3B30',
  };

  createPieChart(): void {
    const construction = this.sites.reduce((s, x) => s + (x.constructionFootprint ?? 0), 0);
    const exploit      = this.sites.reduce((s, x) => s + (x.operationalFootprint  ?? 0), 0);
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const textColor = isDark ? '#8E8E93' : '#6E6E73';

    this.pieChartInstance = new Chart(this.pieCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Construction', 'Exploitation'],
        datasets: [{
          data: [construction, exploit],
          backgroundColor: [this.chartColors.blue, this.chartColors.green],
          borderWidth: 0,
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: textColor, padding: 16, font: { size: 13 }, usePointStyle: true, pointStyleWidth: 10 }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${(ctx.raw as number / 1000).toFixed(1)} t CO₂`
            }
          }
        }
      }
    });
  }

  createBarChart(): void {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const gridColor = isDark ? 'rgba(84,84,88,0.3)' : 'rgba(60,60,67,0.1)';
    const textColor = isDark ? '#8E8E93' : '#6E6E73';

    this.barChartInstance = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.sites.map(s => s.name),
        datasets: [{
          label: 't CO₂',
          data: this.sites.map(s => +((s.totalFootprint ?? 0) / 1000).toFixed(2)),
          backgroundColor: this.chartColors.blue,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} t CO₂` } }
        },
        scales: {
          x: {
            ticks: { color: textColor, font: { size: 12 } },
            grid:  { display: false },
            border: { display: false }
          },
          y: {
            beginAtZero: true,
            ticks: { color: textColor, font: { size: 12 } },
            grid:  { color: gridColor },
            border: { display: false }
          }
        }
      }
    });
  }

  createIntensityChart(): void {
    if (!this.intensityCanvas) return;
    const sorted = [...this.sites].sort((a, b) => (b.footprintPerM2 ?? 0) - (a.footprintPerM2 ?? 0));
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const gridColor = isDark ? 'rgba(84,84,88,0.3)' : 'rgba(60,60,67,0.1)';
    const textColor = isDark ? '#8E8E93' : '#6E6E73';
    const colors = sorted.map(s => {
      const score = this.getCarbonScore(s);
      return score.fg;
    });

    this.intensityChartInstance = new Chart(this.intensityCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: sorted.map(s => s.name),
        datasets: [{
          label: 'kg CO\u2082/m\u00b2/an',
          data: sorted.map(s => +(s.footprintPerM2 ?? 0).toFixed(2)),
          backgroundColor: colors.map(c => c + '33'),
          borderColor: colors,
          borderWidth: 1.5,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} kg CO\u2082/m\u00b2` } }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { color: textColor, font: { size: 12 } },
            grid: { color: gridColor },
            border: { display: false }
          },
          y: {
            ticks: { color: textColor, font: { size: 12 } },
            grid: { display: false },
            border: { display: false }
          }
        }
      }
    });
  }

  createStackedSitesChart(): void {
    if (!this.stackedSitesCanvas) return;
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const gridColor = isDark ? 'rgba(84,84,88,0.3)' : 'rgba(60,60,67,0.1)';
    const textColor = isDark ? '#8E8E93' : '#6E6E73';

    this.stackedSitesChartInstance = new Chart(this.stackedSitesCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.sites.map(s => s.name),
        datasets: [
          {
            label: 'Construction',
            data: this.sites.map(s => +((s.constructionFootprint ?? 0) / 1000).toFixed(2)),
            backgroundColor: this.chartColors.blue,
            stack: 'co2',
            borderRadius: 0,
            borderSkipped: false,
          },
          {
            label: 'Exploitation',
            data: this.sites.map(s => +((s.operationalFootprint ?? 0) / 1000).toFixed(2)),
            backgroundColor: this.chartColors.green,
            stack: 'co2',
            borderRadius: 6,
            borderSkipped: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { color: textColor, padding: 16, font: { size: 13 }, usePointStyle: true, pointStyleWidth: 10 }
          },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw} t CO\u2082` } }
        },
        scales: {
          x: {
            stacked: true,
            ticks: { color: textColor, font: { size: 12 } },
            grid: { display: false },
            border: { display: false }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: { color: textColor, font: { size: 12 } },
            grid: { color: gridColor },
            border: { display: false }
          }
        }
      }
    });
  }

  createMaterialsChart(): void {
    if (!this.materialsCanvas) return;
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const gridColor = isDark ? 'rgba(84,84,88,0.3)' : 'rgba(60,60,67,0.1)';
    const textColor = isDark ? '#8E8E93' : '#6E6E73';

    this.materialsChartInstance = new Chart(this.materialsCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.sites.map(s => s.name),
        datasets: [
          {
            label: 'B\u00e9ton',
            data: this.sites.map(s => s.concreteQuantity ?? 0),
            backgroundColor: '#8E8E93',
            stack: 'mat',
            borderRadius: 0,
            borderSkipped: false,
          },
          {
            label: 'Acier',
            data: this.sites.map(s => s.steelQuantity ?? 0),
            backgroundColor: this.chartColors.orange,
            stack: 'mat',
            borderRadius: 0,
            borderSkipped: false,
          },
          {
            label: 'Verre',
            data: this.sites.map(s => s.glassQuantity ?? 0),
            backgroundColor: this.chartColors.teal,
            stack: 'mat',
            borderRadius: 0,
            borderSkipped: false,
          },
          {
            label: 'Bois',
            data: this.sites.map(s => s.woodQuantity ?? 0),
            backgroundColor: this.chartColors.green,
            stack: 'mat',
            borderRadius: 6,
            borderSkipped: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { color: textColor, padding: 12, font: { size: 12 }, usePointStyle: true, pointStyleWidth: 10 }
          },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw} t` } }
        },
        scales: {
          x: {
            stacked: true,
            ticks: { color: textColor, font: { size: 12 } },
            grid: { display: false },
            border: { display: false }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: { color: textColor, font: { size: 12 } },
            grid: { color: gridColor },
            border: { display: false }
          }
        }
      }
    });
  }

  updateCharts(): void {
    this.pieChartInstance?.destroy();
    this.barChartInstance?.destroy();
    this.intensityChartInstance?.destroy();
    this.stackedSitesChartInstance?.destroy();
    this.materialsChartInstance?.destroy();
    if (this.pieCanvas && this.barCanvas) {
      this.createPieChart();
      this.createBarChart();
      this.createIntensityChart();
      this.createStackedSitesChart();
      this.createMaterialsChart();
    }
  }

  /* ── Sirene autocomplete handlers ── */
  onNameInput(val: string): void {
    this.nameSubject.next(val);
  }

  selectEnterprise(r: EnterpriseResult): void {
    const data = this.siteEnrichService.buildSiteData(r);
    this.currentSite = { ...this.currentSite, ...data };
    this.showEnrichSuggest = false;
    this.showToast('Données pré-remplies depuis Sirene ✓');
  }

  hideEnrichSuggest(): void {
    // Slight delay so mousedown on a suggestion fires before blur closes the list
    setTimeout(() => { this.showEnrichSuggest = false; }, 150);
  }

  /* ── Environmental context ── */
  toggleEnvContext(site: Site): void {
    if (this.expandedEnvSite === site.id) {
      this.expandedEnvSite = null;
      return;
    }
    this.expandedEnvSite = site.id!;
    if (!this.envContextData[site.id!]) {
      this.envContextLoading = true;
      this.envContextService.getContext(site.id!).subscribe(ctx => {
        this.envContextData[site.id!] = ctx;
        this.envContextLoading = false;
      });
    }
  }

  /* ── Site CRUD ── */
  showSiteForm(): void {
    this.showForm = true;
    this.editMode = false;
    this.currentSite = {};
  }

  openSiteDetail(site: Site): void {
    this.router.navigate(['/site', site.id]);
  }

  editSite(site: Site): void {
    this.showForm = true;
    this.editMode = true;
    this.currentSite = { ...site };
  }

  closeForm(): void {
    this.showForm = false;
    this.currentSite = {};
  }

  saveSite(): void {
    if (this.editMode) {
      this.siteService.updateSite(this.currentSite.id, this.currentSite).subscribe({
        next: () => { this.loadData(); this.closeForm(); this.showToast('Site mis à jour avec succès'); },
        error: ()  => this.showToast('Erreur lors de la mise à jour', 'error')
      });
    } else {
      this.siteService.createSite(this.currentSite).subscribe({
        next: () => { this.loadData(); this.closeForm(); this.showToast('Site créé avec succès'); },
        error: ()  => this.showToast('Erreur lors de la création', 'error')
      });
    }
  }

  requestDelete(id: number): void {
    this.siteToDelete = id;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.siteToDelete = null;
    this.showDeleteConfirm = false;
  }

  confirmDelete(): void {
    if (this.siteToDelete !== null) {
      this.siteService.deleteSite(this.siteToDelete).subscribe({
        next: () => { this.loadData(); this.showToast('Site supprimé'); },
        error: ()  => this.showToast('Erreur lors de la suppression', 'error')
      });
      this.cancelDelete();
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /* ── Helpers ── */
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

  getCarbonScore(site: Site): { grade: string; bg: string; fg: string } {
    const kgPerM2 = site.footprintPerM2 ?? 0;
    if (kgPerM2 < 12)  return { grade: 'A', bg: 'rgba(52,199,89,0.15)',  fg: '#34C759' };
    if (kgPerM2 < 16)  return { grade: 'B', bg: 'rgba(48,209,88,0.12)',  fg: '#30D158' };
    if (kgPerM2 < 20)  return { grade: 'C', bg: 'rgba(255,204,0,0.15)',  fg: '#FFCC00' };
    if (kgPerM2 < 25)  return { grade: 'D', bg: 'rgba(255,159,10,0.15)', fg: '#FF9F0A' };
    if (kgPerM2 < 35)  return { grade: 'E', bg: 'rgba(255,107,0,0.15)',  fg: '#FF6B00' };
    if (kgPerM2 < 50)  return { grade: 'F', bg: 'rgba(255,59,48,0.15)',  fg: '#FF3B30' };
    return                     { grade: 'G', bg: 'rgba(200,30,30,0.15)',  fg: '#C81E1E' };
  }

  getImpactLevel(site: Site): { label: string; bg: string; fg: string } {
    const tonnes = (site.totalFootprint ?? 0) / 1000;
    if (tonnes < 50)   return { label: 'Faible',  bg: 'rgba(52,199,89,0.15)',  fg: '#34C759' };
    if (tonnes < 200)  return { label: 'Modéré',  bg: 'rgba(48,209,88,0.12)',  fg: '#30D158' };
    if (tonnes < 500)  return { label: 'Élevé',   bg: 'rgba(255,159,10,0.15)', fg: '#FF9F0A' };
    if (tonnes < 2000) return { label: 'Très élevé', bg: 'rgba(255,107,0,0.15)', fg: '#FF6B00' };
    return                    { label: 'Majeur',   bg: 'rgba(255,59,48,0.15)',  fg: '#FF3B30' };
  }

  getBarWidth(site: Site): number {
    if (!this.maxFootprint) return 0;
    return Math.min(100, ((site.totalFootprint ?? 0) / this.maxFootprint) * 100);
  }

  private showToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toast = { message, type };
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast = null, 3200);
  }

  /* ── Computed: filtered + sorted ── */
  get filteredSites(): Site[] {
    const q = this.searchQuery.toLowerCase().trim();
    return this.sites
      .filter(s =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.location ?? '').toLowerCase().includes(q)
      )
      .sort((a, b) => {
        if (this.sortBy === 'footprint') return (b.totalFootprint ?? 0) - (a.totalFootprint ?? 0);
        if (this.sortBy === 'surface')   return (b.totalSurface ?? 0) - (a.totalSurface ?? 0);
        return a.name.localeCompare(b.name, 'fr');
      });
  }

  /* ── Carbon equivalences ── */
  get flightsEquiv(): string {
    // avg 0.615 t CO₂ per Paris–NYC flight
    const v = Math.round((this.stats?.totalFootprint ?? 0) / 1000 / 0.615);
    return v.toLocaleString('fr-FR');
  }
  get carsEquiv(): string {
    // avg 2.5 t CO₂/year for a European car
    const v = Math.round((this.stats?.totalFootprint ?? 0) / 1000 / 2.5);
    return v.toLocaleString('fr-FR');
  }
  get treesEquiv(): string {
    // avg tree absorbs 25 kg CO₂/year
    const v = Math.round((this.stats?.totalFootprint ?? 0) / 1000 / 0.025);
    return v.toLocaleString('fr-FR');
  }
  get homesEquiv(): string {
    // avg French home: ~4.7 t CO₂/year
    const v = Math.round((this.stats?.totalFootprint ?? 0) / 1000 / 4.7);
    return v.toLocaleString('fr-FR');
  }

  get hasMaterialData(): boolean {
    return this.sites.some(s =>
      (s.concreteQuantity ?? 0) > 0 ||
      (s.steelQuantity ?? 0) > 0 ||
      (s.glassQuantity ?? 0) > 0 ||
      (s.woodQuantity ?? 0) > 0
    );
  }

  /* ── Export CSV ── */
  exportCsv(): void {
    const headers = ['Nom', 'Localisation', 'Surface (m²)', 'CO₂ total (t/an)', 'CO₂/m²/an (kg)', 'Employés', 'Construction (t)', 'Exploitation (t/an)', 'Grade efficacité', 'Impact absolu'];
    const rows = this.sites.map(s => [
      s.name,
      s.location ?? '',
      s.totalSurface ?? 0,
      ((s.totalFootprint ?? 0) / 1000).toFixed(2),
      (s.footprintPerM2 ?? 0).toFixed(2),
      s.employees ?? '',
      ((s.constructionFootprint ?? 0) / 1000).toFixed(2),
      ((s.operationalFootprint  ?? 0) / 1000).toFixed(2),
      this.getCarbonScore(s).grade,
      this.getImpactLevel(s).label,
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `CO₂nscient-sites-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Export CSV téléchargé');
  }
}

