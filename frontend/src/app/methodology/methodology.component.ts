import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-methodology',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="methodo-shell">

      <!-- ── Navbar ── -->
      <nav class="navbar">
        <button class="nav-brand" (click)="goToDashboard()">
          <div class="nav-logo">
            <img src="assets/icons/icon-192x192.png" alt="CO₂nscient">
          </div>
          <span class="nav-title">CO₂nscient</span>
        </button>
        <div class="nav-right">
          <button class="nav-pill" (click)="goToDashboard()">Dashboard</button>
        </div>
      </nav>

      <!-- ── Hero ── -->
      <header class="hero">
        <div class="hero-glow"></div>
        <div class="hero-content">
          <span class="hero-tag">Documentation technique</span>
          <h1 class="hero-title">Méthodologie de calcul</h1>
          <p class="hero-sub">Détail complet des indices, facteurs d'émission, formules et sources de données utilisés par CO₂nscient pour évaluer l'empreinte carbone de vos sites tertiaires.</p>
        </div>
      </header>

      <!-- ── Table of contents ── -->
      <nav class="toc">
        <span class="toc-label">Sommaire</span>
        <a *ngFor="let s of sections" class="toc-link" (click)="scrollTo(s.id)">
          <span class="toc-num">{{ s.num }}</span>
          {{ s.title }}
        </a>
      </nav>

      <!-- ═══ 1. CONSTRUCTION ═══ -->
      <section class="section" id="construction">
        <div class="section-header">
          <span class="section-num">01</span>
          <h2>Empreinte de construction</h2>
        </div>

        <div class="card">
          <h3>Formule générale</h3>
          <div class="formula">
            <code>Empreinte construction = &Sigma; (quantité matériau × facteur d'émission)</code>
          </div>
          <p class="card-note">Si aucune donnée matériau n'est renseignée, une estimation de <strong>800 kgCO₂e/m²</strong> est appliquée (moyenne bâtiment tertiaire RE2020).</p>
        </div>

        <div class="card">
          <h3>Facteurs d'émission des matériaux</h3>
          <p class="card-source">Source : ADEME Base Carbone® v22</p>
          <table class="data-table">
            <thead>
              <tr>
                <th>Matériau</th>
                <th>Facteur (kgCO₂e/tonne)</th>
                <th>Remarque</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="dot dot-concrete"></span> Béton</td>
                <td class="mono">235</td>
                <td>CEM II/A - Béton prêt à l'emploi</td>
              </tr>
              <tr>
                <td><span class="dot dot-steel"></span> Acier</td>
                <td class="mono">1 850</td>
                <td>Acier de construction (filière intégrée)</td>
              </tr>
              <tr>
                <td><span class="dot dot-glass"></span> Verre</td>
                <td class="mono">850</td>
                <td>Verre plat (double vitrage)</td>
              </tr>
              <tr>
                <td><span class="dot dot-wood"></span> Bois</td>
                <td class="mono green">−500</td>
                <td>Stockage carbone biogénique (NF EN 16449)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ═══ 2. EXPLOITATION ═══ -->
      <section class="section" id="exploitation">
        <div class="section-header">
          <span class="section-num">02</span>
          <h2>Empreinte d'exploitation</h2>
        </div>

        <div class="card">
          <h3>Formule</h3>
          <div class="formula">
            <code>Empreinte opérationnelle = (conso énergie × facteur grid + places parking × 150) × facteur d'échelle</code>
          </div>
        </div>

        <div class="card">
          <h3>Facteur d'émission énergétique</h3>
          <p class="card-source">Source : ADEME Base Carbone® — Mix résidentiel France</p>
          <table class="data-table">
            <thead>
              <tr><th>Paramètre</th><th>Valeur</th><th>Unité</th></tr>
            </thead>
            <tbody>
              <tr><td>Mix électrique français</td><td class="mono">52</td><td>kgCO₂e/MWh</td></tr>
              <tr><td>Parking (exploitation annuelle)</td><td class="mono">150</td><td>kgCO₂e/place/an</td></tr>
            </tbody>
          </table>
        </div>

        <div class="card">
          <h3>Facteur d'échelle (mutualisation)</h3>
          <p>Les grands bâtiments mutualisent mieux les équipements techniques (CVC, éclairage, ascenseurs). Un facteur correctif est appliqué :</p>
          <div class="formula">
            <code>scaleFactor = 1.0 + 0.3 × e<sup>−surface/2000</sup> − 0.15 × (1 − e<sup>−surface/20000</sup>)</code>
          </div>
          <table class="data-table compact">
            <thead>
              <tr><th>Surface</th><th>Facteur</th><th>Effet</th></tr>
            </thead>
            <tbody>
              <tr><td>500 m²</td><td class="mono">~1.27</td><td class="red">+27% pénalité</td></tr>
              <tr><td>2 000 m²</td><td class="mono">~1.10</td><td class="red">+10% pénalité</td></tr>
              <tr><td>5 000 m²</td><td class="mono">~1.00</td><td>Neutre (référence)</td></tr>
              <tr><td>20 000 m²</td><td class="mono">~0.92</td><td class="green">−8% bonus</td></tr>
              <tr><td>50 000 m²</td><td class="mono">~0.86</td><td class="green">−14% bonus</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ═══ 3. ANNUALISATION ═══ -->
      <section class="section" id="annualisation">
        <div class="section-header">
          <span class="section-num">03</span>
          <h2>Annualisation & indicateurs</h2>
        </div>

        <div class="card">
          <h3>Empreinte totale annualisée</h3>
          <div class="formula">
            <code>Total annuel = (construction ÷ 50 ans) + exploitation annuelle</code>
          </div>
          <p>La durée de vie de référence est <strong>50 ans</strong> (norme RE2020, NF EN 15978). L'empreinte de construction est amortie linéairement.</p>
        </div>

        <div class="card">
          <h3>Indicateurs dérivés</h3>
          <table class="data-table">
            <thead>
              <tr><th>Indicateur</th><th>Formule</th><th>Unité</th></tr>
            </thead>
            <tbody>
              <tr><td>Intensité carbone</td><td class="mono">total ÷ surface</td><td>kgCO₂e/m²/an</td></tr>
              <tr><td>Empreinte par employé</td><td class="mono">total ÷ nb employés</td><td>kgCO₂e/pers/an</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ═══ 4. NOTATION ═══ -->
      <section class="section" id="notation">
        <div class="section-header">
          <span class="section-num">04</span>
          <h2>Système de notation A–G</h2>
        </div>

        <div class="card">
          <h3>Échelle de performance carbone</h3>
          <p class="card-source">Inspirée du DPE (Diagnostic de Performance Énergétique), adaptée aux bâtiments tertiaires avec empreinte combinée construction + exploitation.</p>
          <div class="grade-scale">
            <div *ngFor="let g of grades" class="grade-row">
              <span class="grade-letter" [style.background]="g.bg" [style.color]="g.fg">{{ g.grade }}</span>
              <div class="grade-bar" [style.width]="g.width" [style.background]="g.bg"></div>
              <span class="grade-range">{{ g.range }}</span>
              <span class="grade-desc">{{ g.desc }}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <h3>Niveaux d'impact absolu</h3>
          <p>Basé sur l'empreinte totale annualisée (tCO₂/an) :</p>
          <table class="data-table">
            <thead>
              <tr><th>Niveau</th><th>Seuil</th><th>Cas typique</th></tr>
            </thead>
            <tbody>
              <tr><td><span class="pill pill-green">Faible</span></td><td class="mono">&lt; 50 tCO₂/an</td><td>Petit bureau, coworking</td></tr>
              <tr><td><span class="pill pill-teal">Modéré</span></td><td class="mono">50–200 tCO₂/an</td><td>Immeuble de bureaux moyen</td></tr>
              <tr><td><span class="pill pill-orange">Élevé</span></td><td class="mono">200–500 tCO₂/an</td><td>Grand site tertiaire</td></tr>
              <tr><td><span class="pill pill-red-light">Très élevé</span></td><td class="mono">500–2 000 tCO₂/an</td><td>Campus, data center</td></tr>
              <tr><td><span class="pill pill-red">Majeur</span></td><td class="mono">&gt; 2 000 tCO₂/an</td><td>Siège social, complexe industriel</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ═══ 5. HISTORISATION ═══ -->
      <section class="section" id="historisation">
        <div class="section-header">
          <span class="section-num">05</span>
          <h2>Historisation (2020–2025)</h2>
        </div>

        <div class="card">
          <h3>Principe</h3>
          <p>L'historique est <strong>reconstruit rétroactivement</strong> à partir de données externes réelles. Dès la création d'un site, une courbe d'évolution sur 5 ans est disponible.</p>
        </div>

        <div class="card">
          <h3>Intensité carbone du réseau électrique</h3>
          <p class="card-source">Source : RTE éCO2mix — Bilan électrique annuel</p>
          <table class="data-table">
            <thead>
              <tr><th>Année</th><th>Intensité (gCO₂/kWh)</th><th>Contexte</th></tr>
            </thead>
            <tbody>
              <tr><td>2020</td><td class="mono">52</td><td>Référence pré-COVID</td></tr>
              <tr><td>2021</td><td class="mono">55</td><td>Reprise économique</td></tr>
              <tr><td>2022</td><td class="mono red">62</td><td>Arrêts réacteurs nucléaires (corrosion sous contrainte)</td></tr>
              <tr><td>2023</td><td class="mono">56</td><td>Redémarrage progressif du parc</td></tr>
              <tr><td>2024</td><td class="mono">52</td><td>Parc nucléaire restauré + éolien/solaire</td></tr>
              <tr><td>2025</td><td class="mono green">50</td><td>Projection (mix décarboné)</td></tr>
            </tbody>
          </table>
        </div>

        <div class="card">
          <h3>Variation climatique (Open-Meteo Archive)</h3>
          <p>Les DJU (Degrés-Jours Unifiés) de chauffage et climatisation sont récupérés pour chaque année et chaque localisation :</p>
          <div class="formula">
            <code>DJU chauffage = &Sigma; max(0, 18°C − T<sub>moy jour</sub>)</code>
          </div>
          <div class="formula">
            <code>DJU climatisation = &Sigma; max(0, T<sub>moy jour</sub> − 24°C)</code>
          </div>
          <p>La consommation d'énergie est ajustée selon la répartition estimée :</p>
          <table class="data-table compact">
            <thead>
              <tr><th>Poste</th><th>Part</th><th>Variation</th></tr>
            </thead>
            <tbody>
              <tr><td>Chauffage</td><td class="mono">70%</td><td>Proportionnel aux DJU chauffage</td></tr>
              <tr><td>Climatisation</td><td class="mono">20%</td><td>Proportionnel aux DJU climatisation</td></tr>
              <tr><td>Base (éclairage, IT...)</td><td class="mono">10%</td><td>Constant</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ═══ 6. CONTEXTE ENVIRONNEMENTAL ═══ -->
      <section class="section" id="contexte">
        <div class="section-header">
          <span class="section-num">06</span>
          <h2>Contexte environnemental</h2>
        </div>

        <div class="card">
          <h3>DPE voisinage</h3>
          <p class="card-source">Source : ADEME — DPE v2 logements existants + DPE tertiaire</p>
          <p>Récupération des diagnostics de performance énergétique dans un rayon de <strong>500m</strong> autour du site. Calcul de la consommation moyenne (kWhEP/m²/an), de la classe dominante et de la distribution A→G.</p>
        </div>

        <div class="card">
          <h3>Données climatiques</h3>
          <p class="card-source">Source : Open-Meteo Archive API</p>
          <ul class="feature-list">
            <li>Température moyenne annuelle</li>
            <li>DJU chauffage (base 18°C) et climatisation (base 24°C)</li>
            <li>Rayonnement solaire annuel (kWh/m²)</li>
            <li>Zone climatique estimée (H1a → H3)</li>
          </ul>
        </div>

        <div class="card">
          <h3>Accessibilité transports</h3>
          <p class="card-source">Source : OpenStreetMap via Overpass API</p>
          <p>Recherche des arrêts de transport en commun dans un rayon de <strong>500m</strong> :</p>
          <ul class="feature-list">
            <li>Bus, tram, métro, gare, vélos en libre-service</li>
            <li>Distance à l'arrêt le plus proche</li>
            <li>Score d'accessibilité : Excellent / Bon / Moyen / Faible</li>
          </ul>
          <table class="data-table compact">
            <thead>
              <tr><th>Score</th><th>Condition</th></tr>
            </thead>
            <tbody>
              <tr><td><span class="pill pill-green">Excellent</span></td><td>Métro/gare ou &ge; 10 arrêts TC</td></tr>
              <tr><td><span class="pill pill-teal">Bon</span></td><td>Tram ou &ge; 5 arrêts TC</td></tr>
              <tr><td><span class="pill pill-orange">Moyen</span></td><td>&ge; 2 arrêts TC</td></tr>
              <tr><td><span class="pill pill-red">Faible</span></td><td>&lt; 2 arrêts TC</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ═══ 7. EQUIVALENCES ═══ -->
      <section class="section" id="equivalences">
        <div class="section-header">
          <span class="section-num">07</span>
          <h2>Équivalences carbone</h2>
        </div>

        <div class="card">
          <h3>Facteurs de conversion</h3>
          <p class="card-source">Source : ADEME, DGAC, Agence Européenne pour l'Environnement</p>
          <table class="data-table">
            <thead>
              <tr><th>Équivalence</th><th>Facteur</th><th>Détail</th></tr>
            </thead>
            <tbody>
              <tr><td>Vols Paris–New York</td><td class="mono">1 750 kgCO₂e/vol</td><td>A/R, classe éco, traînées incluses</td></tr>
              <tr><td>Km en voiture thermique</td><td class="mono">0.218 kgCO₂e/km</td><td>Véhicule moyen, puits à la roue</td></tr>
              <tr><td>Arbres pour absorption</td><td class="mono">25 kgCO₂e/arbre/an</td><td>Arbre feuillu mature, tempéré</td></tr>
              <tr><td>Foyers français</td><td class="mono">10 000 kgCO₂e/foyer/an</td><td>Empreinte résidentielle moyenne</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ═══ 8. SOURCES ═══ -->
      <section class="section" id="sources">
        <div class="section-header">
          <span class="section-num">08</span>
          <h2>Sources & références</h2>
        </div>

        <div class="sources-grid">
          <div class="source-card" *ngFor="let src of sources">
            <div class="source-icon">{{ src.icon }}</div>
            <div class="source-body">
              <h4>{{ src.name }}</h4>
              <p>{{ src.desc }}</p>
              <span class="source-url">{{ src.url }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Footer ── -->
      <footer class="methodo-footer">
        <span>CO₂nscient — Méthodologie v1.0</span>
        <span class="footer-sep">·</span>
        <span>Dernière mise à jour : mars 2025</span>
      </footer>

    </div>
  `,
  styleUrls: ['./methodology.component.scss']
})
export class MethodologyComponent {
  constructor(private router: Router) {}

  sections = [
    { id: 'construction', num: '01', title: 'Empreinte de construction' },
    { id: 'exploitation', num: '02', title: 'Empreinte d\'exploitation' },
    { id: 'annualisation', num: '03', title: 'Annualisation & indicateurs' },
    { id: 'notation', num: '04', title: 'Système de notation A–G' },
    { id: 'historisation', num: '05', title: 'Historisation (2020–2025)' },
    { id: 'contexte', num: '06', title: 'Contexte environnemental' },
    { id: 'equivalences', num: '07', title: 'Équivalences carbone' },
    { id: 'sources', num: '08', title: 'Sources & références' },
  ];

  grades = [
    { grade: 'A', range: '< 12 kgCO₂/m²/an', desc: 'Performance exemplaire', bg: 'rgba(52,199,89,0.9)', fg: '#fff', width: '20%' },
    { grade: 'B', range: '12–16', desc: 'Très performant', bg: 'rgba(48,209,88,0.85)', fg: '#fff', width: '28%' },
    { grade: 'C', range: '16–20', desc: 'Performant', bg: 'rgba(255,204,0,0.9)', fg: '#1a1a1a', width: '36%' },
    { grade: 'D', range: '20–25', desc: 'Moyen', bg: 'rgba(255,159,10,0.9)', fg: '#fff', width: '48%' },
    { grade: 'E', range: '25–35', desc: 'Peu performant', bg: 'rgba(255,107,0,0.9)', fg: '#fff', width: '62%' },
    { grade: 'F', range: '35–50', desc: 'Très peu performant', bg: 'rgba(255,59,48,0.9)', fg: '#fff', width: '78%' },
    { grade: 'G', range: '> 50', desc: 'Énergivore', bg: 'rgba(200,30,30,0.9)', fg: '#fff', width: '100%' },
  ];

  sources = [
    { icon: '🏛️', name: 'ADEME Base Carbone®', desc: 'Facteurs d\'émission officiels pour les matériaux, l\'énergie et les transports en France.', url: 'bilans-ges.ademe.fr' },
    { icon: '⚡', name: 'RTE éCO2mix', desc: 'Données en temps réel et historiques sur l\'intensité carbone du réseau électrique français.', url: 'odre.opendatasoft.com' },
    { icon: '🌡️', name: 'Open-Meteo Archive', desc: 'Données météorologiques historiques (température, rayonnement solaire) par coordonnées GPS.', url: 'open-meteo.com' },
    { icon: '🏠', name: 'ADEME DPE v2', desc: 'Base de données des diagnostics de performance énergétique des bâtiments français.', url: 'data.ademe.fr' },
    { icon: '🗺️', name: 'OpenStreetMap / Overpass', desc: 'Données géographiques collaboratives : arrêts de transport, infrastructures de mobilité.', url: 'overpass-api.de' },
    { icon: '📐', name: 'RE2020 / NF EN 15978', desc: 'Réglementation environnementale et norme d\'évaluation de la performance environnementale des bâtiments.', url: 'rt-re-batiment.developpement-durable.gouv.fr' },
  ];

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
