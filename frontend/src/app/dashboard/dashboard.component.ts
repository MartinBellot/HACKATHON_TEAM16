import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { SiteService } from '../services/site.service';
import { AuthService } from '../services/auth.service';
import { SiteEnrichService, EnterpriseResult } from '../services/site-enrich.service';
import { Site } from '../models/site.model';
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
          <span class="nav-title">CarbonTrack</span>
        </div>
        <div class="nav-right">
          <button *ngIf="canInstallPwa" (click)="installPwa()" class="btn-install" aria-label="Installer l'application">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v7.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 10.586V3a1 1 0 011-1zm-6 13a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clip-rule="evenodd"/>
            </svg>
            <span>Installer</span>
          </button>
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

          <section class="app-banner" *ngIf="canInstallPwa || showIosInstallHint || !isOnline">
            <div class="app-banner-copy">
              <span class="app-banner-kicker">{{ isOnline ? 'Mode application' : 'Connexion perdue' }}</span>
              <h2>{{ isOnline ? 'Installez CarbonTrack sur votre mobile' : 'Vous êtes hors ligne' }}</h2>
              <p>
                {{ isOnline
                  ? (showIosInstallHint
                    ? 'Sur iPhone ou iPad, utilisez le bouton Partager puis "Sur l’écran d’accueil" pour installer l’application.'
                    : 'Accédez plus vite au tableau de bord, profitez d’une interface plein écran et gardez en cache les ressources principales.')
                  : 'Les écrans déjà visités restent disponibles. Reconnectez-vous pour synchroniser les données et l’API Sirene.' }}
              </p>
            </div>
            <div class="app-banner-actions">
              <button *ngIf="canInstallPwa" (click)="installPwa()" class="btn-primary" type="button">
                Installer l’app
              </button>
              <button *ngIf="showIosInstallHint" (click)="showInstallInstructions()" class="btn-ghost btn-install-help" type="button">
                Voir comment
              </button>
              <span class="network-pill" [class.network-pill-offline]="!isOnline">
                {{ isOnline ? 'En ligne' : 'Hors ligne' }}
              </span>
            </div>
          </section>

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
                <div class="kpi-label">kg CO₂ / m² moyen</div>
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

                <div class="site-card-top">
                  <div class="site-info">
                    <div class="site-name-row">
                      <h3 class="site-name">{{ site.name }}</h3>
                      <span class="score-badge" [style.background]="getCarbonScore(site).bg" [style.color]="getCarbonScore(site).fg">
                        {{ getCarbonScore(site).grade }}
                      </span>
                    </div>
                    <div class="site-location" *ngIf="site.location">
                      <svg viewBox="0 0 16 16" fill="currentColor">
                        <path fill-rule="evenodd" d="M8 0C4.686 0 2 2.686 2 6c0 4 6 10 6 10s6-6 6-10c0-3.314-2.686-6-6-6zm0 8.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" clip-rule="evenodd"/>
                      </svg>
                      {{ site.location }}
                    </div>
                  </div>
                  <div class="site-actions">
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

                <div class="divider"></div>

                <div class="site-stats">
                  <div class="stat-item">
                    <span class="stat-label">Surface</span>
                    <span class="stat-val">{{ formatInt(site.totalSurface) }} m²</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">CO₂ total</span>
                    <span class="stat-val accent">{{ formatTonnes(site.totalFootprint) }} t</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">CO₂ / m²</span>
                    <span class="stat-val">{{ formatKgM2(site.footprintPerM2) }} kg</span>
                  </div>
                  <div class="stat-item" *ngIf="site.employees">
                    <span class="stat-label">Employés</span>
                    <span class="stat-val">{{ site.employees }}</span>
                  </div>
                </div>

                <div class="footprint-bar" [title]="'CO₂ : ' + formatTonnes(site.totalFootprint) + ' t'">
                  <div class="footprint-fill"
                       [style.width]="getBarWidth(site) + '%'"
                       [style.background]="getCarbonScore(site).bg">
                  </div>
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
  canInstallPwa = false;
  isStandalone = false;
  isOnline = navigator.onLine;
  showIosInstallHint = false;
  private deferredInstallPrompt: any = null;

  /* ── Sirene autocomplete ── */
  enrichSuggestions: EnterpriseResult[] = [];
  showEnrichSuggest = false;
  enrichLoading = false;
  private nameSubject = new Subject<string>();
  private enrichSub!: Subscription;

  private pieChartInstance: any;
  private barChartInstance: any;
  private toastTimer: any;
  private maxFootprint = 0;

  constructor(
    private siteService: SiteService,
    private authService: AuthService,
    private router: Router,
    private siteEnrichService: SiteEnrichService
  ) {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnInit(): void {
    this.updateDisplayMode();
    window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', this.handleAppInstalled);
    window.addEventListener('online', this.handleConnectivityChange);
    window.addEventListener('offline', this.handleConnectivityChange);
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
    this.enrichSub?.unsubscribe();
    window.removeEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', this.handleAppInstalled);
    window.removeEventListener('online', this.handleConnectivityChange);
    window.removeEventListener('offline', this.handleConnectivityChange);
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

  updateCharts(): void {
    this.pieChartInstance?.destroy();
    this.barChartInstance?.destroy();
    if (this.pieCanvas && this.barCanvas) {
      this.createPieChart();
      this.createBarChart();
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

  private handleBeforeInstallPrompt = (event: Event): void => {
    event.preventDefault();
    this.deferredInstallPrompt = event;
    this.updateDisplayMode();
  };

  private handleAppInstalled = (): void => {
    this.deferredInstallPrompt = null;
    this.updateDisplayMode();
    this.showToast('CarbonTrack est installé sur cet appareil');
  };

  private handleConnectivityChange = (): void => {
    this.isOnline = navigator.onLine;
  };

  private updateDisplayMode(): void {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = isIos && /safari/.test(userAgent) && !/crios|fxios|edgios/.test(userAgent);
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    this.canInstallPwa = !this.isStandalone && !!this.deferredInstallPrompt;
    this.showIosInstallHint = !this.isStandalone && !this.canInstallPwa && isSafari;
  }

  async installPwa(): Promise<void> {
    if (!this.deferredInstallPrompt) {
      this.showToast('Utilisez le menu du navigateur pour installer l’application', 'error');
      return;
    }

    this.deferredInstallPrompt.prompt();
    const choice = await this.deferredInstallPrompt.userChoice;
    this.deferredInstallPrompt = null;
    this.updateDisplayMode();

    if (choice?.outcome === 'accepted') {
      this.showToast('Installation lancée');
    }
  }

  showInstallInstructions(): void {
    this.showToast('Safari > Partager > Sur l’écran d’accueil');
  }

  /* ── Site CRUD ── */
  showSiteForm(): void {
    this.showForm = true;
    this.editMode = false;
    this.currentSite = {};
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
    return (n / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  }

  formatInt(n: any): string {
    if (!n) return '0';
    return Number(n).toLocaleString('fr-FR');
  }

  getCarbonScore(site: Site): { grade: string; bg: string; fg: string } {
    const kgPerM2 = (site.footprintPerM2 ?? 0) / 1000;
    if (kgPerM2 < 50)  return { grade: 'A', bg: 'rgba(52,199,89,0.15)',  fg: '#34C759' };
    if (kgPerM2 < 100) return { grade: 'B', bg: 'rgba(48,209,88,0.12)',  fg: '#30D158' };
    if (kgPerM2 < 200) return { grade: 'C', bg: 'rgba(255,159,10,0.15)', fg: '#FF9F0A' };
    if (kgPerM2 < 300) return { grade: 'D', bg: 'rgba(255,107,0,0.15)',  fg: '#FF6B00' };
    return                     { grade: 'E', bg: 'rgba(255,59,48,0.15)',  fg: '#FF3B30' };
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

  /* ── Export CSV ── */
  exportCsv(): void {
    const headers = ['Nom', 'Localisation', 'Surface (m²)', 'CO₂ total (t)', 'CO₂/m² (kg)', 'Employés', 'Construction (t)', 'Exploitation (t)'];
    const rows = this.sites.map(s => [
      s.name,
      s.location ?? '',
      s.totalSurface ?? 0,
      ((s.totalFootprint ?? 0) / 1000).toFixed(2),
      ((s.footprintPerM2 ?? 0) / 1000).toFixed(3),
      s.employees ?? '',
      ((s.constructionFootprint ?? 0) / 1000).toFixed(2),
      ((s.operationalFootprint  ?? 0) / 1000).toFixed(2),
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `carbontrack-sites-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Export CSV téléchargé');
  }
}

