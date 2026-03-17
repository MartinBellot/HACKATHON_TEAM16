import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface ConfigEntry {
  id: number;
  configKey: string;
  configValue: number;
  label: string;
  unit: string;
  category: string;
  source: string;
  editing?: boolean;
  editValue?: number;
}

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="config-shell">

      <nav class="navbar">
        <button class="nav-brand" (click)="goToDashboard()">
          <div class="nav-logo">
            <img src="assets/icons/icon-192x192.png" alt="CO₂nscient">
          </div>
          <span class="nav-title">CO₂nscient</span>
        </button>
        <div class="nav-right">
          <button class="nav-pill" (click)="goToDashboard()">Dashboard</button>
          <button class="nav-pill" (click)="goToMethodology()">Méthodologie</button>
        </div>
      </nav>

      <header class="hero">
        <div class="hero-glow"></div>
        <div class="hero-content">
          <span class="hero-tag">Administration</span>
          <h1 class="hero-title">Paramètres de calcul</h1>
          <p class="hero-sub">Modifiez les facteurs d'émission, seuils de notation et paramètres utilisés dans tous les calculs. Les changements s'appliquent immédiatement.</p>
        </div>
      </header>

      <div class="config-container" *ngIf="!loading">

        <div class="config-actions-bar">
          <div class="config-search">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
            <input type="text" [(ngModel)]="searchTerm" placeholder="Rechercher un paramètre..." class="search-input">
          </div>
          <div class="config-btns">
            <button class="btn-save" (click)="saveAll()" [disabled]="!hasChanges">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
              Sauvegarder tout
            </button>
            <span class="save-status" *ngIf="saveMessage" [class.success]="saveSuccess" [class.error]="!saveSuccess">{{ saveMessage }}</span>
          </div>
        </div>

        <div *ngFor="let cat of categories" class="category-block">
          <div class="category-header">
            <span class="category-icon">{{ getCategoryIcon(cat) }}</span>
            <h2>{{ cat }}</h2>
            <span class="category-count">{{ getFilteredByCategory(cat).length }}</span>
          </div>

          <div class="config-table">
            <div class="config-row config-header-row">
              <span class="col-label">Paramètre</span>
              <span class="col-value">Valeur</span>
              <span class="col-unit">Unité</span>
              <span class="col-source">Source</span>
            </div>

            <div *ngFor="let c of getFilteredByCategory(cat)"
                 class="config-row"
                 [class.config-row-changed]="c.editValue !== c.configValue">

              <div class="col-label">
                <span class="config-label">{{ c.label }}</span>
                <span class="config-key">{{ c.configKey }}</span>
              </div>

              <div class="col-value">
                <input type="number" [(ngModel)]="c.editValue"
                       class="value-input"
                       [class.value-changed]="c.editValue !== c.configValue"
                       step="any">
                <span class="original-value" *ngIf="c.editValue !== c.configValue">
                  ({{ c.configValue }})
                </span>
              </div>

              <span class="col-unit">{{ c.unit }}</span>
              <span class="col-source">{{ c.source }}</span>
            </div>
          </div>
        </div>

      </div>

      <div class="loading-state" *ngIf="loading">
        <div class="loading-spinner"></div>
        <span>Chargement de la configuration...</span>
      </div>

      <footer class="config-footer">
        <span>Les modifications sont appliquées au prochain calcul d'empreinte.</span>
        <span class="footer-sep">·</span>
        <span>{{ configs.length }} paramètres configurables</span>
      </footer>

    </div>
  `,
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent implements OnInit {
  configs: ConfigEntry[] = [];
  categories: string[] = [];
  searchTerm = '';
  loading = true;
  hasChanges = false;
  saveMessage = '';
  saveSuccess = false;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.http.get<ConfigEntry[]>('/api/config').subscribe({
      next: data => {
        this.configs = data.map(c => ({ ...c, editing: false, editValue: c.configValue }));
        this.categories = [...new Set(data.map(c => c.category))];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get filteredConfigs(): ConfigEntry[] {
    if (!this.searchTerm) return this.configs;
    const term = this.searchTerm.toLowerCase();
    return this.configs.filter(c =>
      c.label.toLowerCase().includes(term) ||
      c.configKey.toLowerCase().includes(term) ||
      c.category.toLowerCase().includes(term)
    );
  }

  getFilteredByCategory(cat: string): ConfigEntry[] {
    return this.filteredConfigs.filter(c => c.category === cat);
  }

  get changedConfigs(): ConfigEntry[] {
    return this.configs.filter(c => c.editValue !== c.configValue);
  }

  ngDoCheck(): void {
    this.hasChanges = this.configs.some(c => c.editValue !== c.configValue);
  }

  saveAll(): void {
    const updates = this.changedConfigs.map(c => ({
      id: c.id,
      configValue: c.editValue
    }));

    if (updates.length === 0) return;

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.put<ConfigEntry[]>('/api/config/batch', updates, { headers }).subscribe({
      next: data => {
        this.configs = data.map(c => ({ ...c, editing: false, editValue: c.configValue }));
        this.saveMessage = `${updates.length} paramètre(s) mis à jour`;
        this.saveSuccess = true;
        setTimeout(() => this.saveMessage = '', 3000);
      },
      error: () => {
        this.saveMessage = 'Erreur lors de la sauvegarde';
        this.saveSuccess = false;
        setTimeout(() => this.saveMessage = '', 3000);
      }
    });
  }

  getCategoryIcon(cat: string): string {
    const icons: Record<string, string> = {
      'Matériaux': '🧱',
      'Énergie': '⚡',
      'Bâtiment': '🏢',
      'Échelle': '📏',
      'Notation': '🏷️',
      'Impact': '📊',
      'Historisation': '📈',
      'Équivalences': '🔄'
    };
    return icons[cat] || '⚙️';
  }

  goToDashboard(): void { this.router.navigate(['/dashboard']); }
  goToMethodology(): void { this.router.navigate(['/methodology']); }
}
