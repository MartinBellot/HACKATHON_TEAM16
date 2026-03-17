import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { LoginRequest } from '../models/site.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="scene">
      <!-- Animated topographic background -->
      <div class="topo-bg">
        <svg class="topo-lines" viewBox="0 0 800 600" preserveAspectRatio="none">
          <path class="contour c1" d="M-50,300 Q150,220 300,280 T600,240 T900,300" fill="none"/>
          <path class="contour c2" d="M-50,340 Q200,260 350,320 T650,270 T900,340" fill="none"/>
          <path class="contour c3" d="M-50,380 Q180,310 320,360 T620,310 T900,380" fill="none"/>
          <path class="contour c4" d="M-50,420 Q160,360 340,400 T640,350 T900,420" fill="none"/>
          <path class="contour c5" d="M-50,260 Q200,180 360,230 T620,190 T900,260" fill="none"/>
          <path class="contour c6" d="M-50,460 Q220,400 380,440 T660,390 T900,460" fill="none"/>
          <path class="contour c7" d="M-50,220 Q170,150 330,190 T610,160 T900,220" fill="none"/>
          <circle class="pulse-dot d1" cx="300" cy="280" r="3"/>
          <circle class="pulse-dot d2" cx="550" cy="250" r="2.5"/>
          <circle class="pulse-dot d3" cx="150" cy="350" r="2"/>
          <circle class="pulse-dot d4" cx="680" cy="380" r="3"/>
        </svg>
        <div class="grain"></div>
      </div>

      <!-- Left branding panel -->
      <div class="panel-left">
        <div class="brand-block">
          <div class="logo-mark">
            <svg viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" stroke="url(#grd)" stroke-width="1.5" opacity="0.4"/>
              <circle cx="24" cy="24" r="13" stroke="url(#grd)" stroke-width="1.5" opacity="0.6"/>
              <circle cx="24" cy="24" r="6" fill="url(#grd)"/>
              <path d="M24 4 L24 8 M24 40 L24 44 M4 24 L8 24 M40 24 L44 24" stroke="url(#grd)" stroke-width="1" opacity="0.3"/>
              <defs>
                <linearGradient id="grd" x1="0" y1="0" x2="48" y2="48">
                  <stop offset="0%" stop-color="#00e88f"/>
                  <stop offset="100%" stop-color="#00b4d8"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 class="brand-title">CO₂nscient</h1>
          <p class="brand-sub">Plateforme de mesure et d'optimisation<br/>de l'empreinte carbone de vos sites</p>
        </div>

        <div class="stats-row">
          <div class="stat-pill" *ngFor="let s of stats; let i = index"
               [style.animation-delay]="(0.8 + i * 0.15) + 's'">
            <span class="stat-value">{{ s.value }}</span>
            <span class="stat-label">{{ s.label }}</span>
          </div>
        </div>

        <div class="bottom-tag">
          <span class="tag-dot"></span>
          Hackathon #26 &mdash; Capgemini
        </div>
      </div>

      <!-- Right form panel -->
      <div class="panel-right">
        <div class="form-shell" [class.register-mode]="!isLoginMode">
          <div class="form-header">
            <div class="mode-tabs">
              <button class="tab" [class.active]="isLoginMode" (click)="setMode(true)">Connexion</button>
              <button class="tab" [class.active]="!isLoginMode" (click)="setMode(false)">Inscription</button>
              <div class="tab-indicator" [class.right]="!isLoginMode"></div>
            </div>
          </div>

          <form (ngSubmit)="onSubmit()" class="auth-form">
            <div class="field">
              <label for="username">Identifiant</label>
              <input
                id="username"
                type="text"
                [(ngModel)]="username"
                name="username"
                placeholder="votre identifiant"
                required
                autocomplete="username">
            </div>

            <div class="field" *ngIf="!isLoginMode" [@.disabled]="true">
              <label for="email">Adresse email</label>
              <input
                id="email"
                type="email"
                [(ngModel)]="email"
                name="email"
                placeholder="nom@capgemini.com"
                required
                autocomplete="email">
            </div>

            <div class="field">
              <label for="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                [(ngModel)]="password"
                name="password"
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                required
                autocomplete="current-password">
            </div>

            <div class="msg msg-error" *ngIf="errorMessage">
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"/>
              </svg>
              {{ errorMessage }}
            </div>

            <div class="msg msg-success" *ngIf="successMessage">
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/>
              </svg>
              {{ successMessage }}
            </div>

            <button type="submit" class="btn-submit" [disabled]="loading">
              <span class="btn-text" *ngIf="!loading">
                {{ isLoginMode ? 'Entrer' : 'Creer le compte' }}
              </span>
              <span class="btn-loader" *ngIf="loading"></span>
              <svg class="btn-arrow" *ngIf="!loading" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                <path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L11.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 11-1.04-1.08l3.158-2.96H3.75A.75.75 0 013 10z" clip-rule="evenodd"/>
              </svg>
            </button>
          </form>

          <p class="demo-hint" *ngIf="isLoginMode">
            Compte demo : <code>demo</code> / <code>password</code>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }

    .scene {
      display: flex;
      height: 100%;
      position: relative;
      overflow: hidden;
      background: #070b09;
    }

    /* ── Topographic animated background ── */
    .topo-bg {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }

    .topo-lines {
      width: 100%;
      height: 100%;
    }

    .contour {
      stroke-width: 0.8;
      stroke: rgba(0, 232, 143, 0.08);
      animation: drift 20s ease-in-out infinite alternate;
    }
    .c1 { animation-delay: 0s; }
    .c2 { stroke: rgba(0, 180, 216, 0.07); animation-delay: -3s; animation-duration: 24s; }
    .c3 { animation-delay: -6s; animation-duration: 22s; }
    .c4 { stroke: rgba(0, 180, 216, 0.06); animation-delay: -9s; animation-duration: 26s; }
    .c5 { animation-delay: -2s; animation-duration: 18s; }
    .c6 { stroke: rgba(0, 232, 143, 0.05); animation-delay: -5s; animation-duration: 28s; }
    .c7 { stroke: rgba(0, 180, 216, 0.06); animation-delay: -7s; animation-duration: 21s; }

    @keyframes drift {
      0% { transform: translateX(0) translateY(0); }
      100% { transform: translateX(40px) translateY(-20px); }
    }

    .pulse-dot {
      fill: #00e88f;
      animation: pulse 3s ease-in-out infinite;
    }
    .d1 { animation-delay: 0s; }
    .d2 { animation-delay: -1s; fill: #00b4d8; }
    .d3 { animation-delay: -2s; }
    .d4 { animation-delay: -0.5s; fill: #00b4d8; }

    @keyframes pulse {
      0%, 100% { opacity: 0.15; r: 2; }
      50% { opacity: 0.7; r: 5; }
    }

    .grain {
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
      background-repeat: repeat;
      background-size: 256px;
    }

    /* ── Left panel ── */
    .panel-left {
      flex: 1.1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 4rem 5rem;
      position: relative;
      z-index: 1;
    }

    .brand-block { margin-bottom: 3.5rem; }

    .logo-mark {
      width: 64px;
      height: 64px;
      margin-bottom: 2rem;
      animation: fadeUp 0.6s ease-out both;
    }

    .logo-mark svg { width: 100%; height: 100%; }

    .brand-title {
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      font-size: 3.2rem;
      line-height: 1.05;
      letter-spacing: -2px;
      color: #f0ede8;
      margin-bottom: 1.25rem;
      animation: fadeUp 0.6s ease-out 0.1s both;
    }

    .brand-sub {
      font-family: 'Outfit', sans-serif;
      font-weight: 300;
      font-size: 1.05rem;
      line-height: 1.6;
      color: rgba(240, 237, 232, 0.45);
      animation: fadeUp 0.6s ease-out 0.2s both;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ── Stats pills ── */
    .stats-row {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 3rem;
    }

    .stat-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: 1px solid rgba(0, 232, 143, 0.12);
      border-radius: 100px;
      background: rgba(0, 232, 143, 0.04);
      animation: fadeUp 0.5s ease-out both;
    }

    .stat-value {
      font-family: 'Syne', sans-serif;
      font-weight: 700;
      font-size: 0.9rem;
      color: #00e88f;
    }

    .stat-label {
      font-size: 0.78rem;
      color: rgba(240, 237, 232, 0.35);
      font-weight: 400;
    }

    .bottom-tag {
      position: absolute;
      bottom: 2.5rem;
      left: 5rem;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.75rem;
      color: rgba(240, 237, 232, 0.25);
      letter-spacing: 0.5px;
      text-transform: uppercase;
      font-weight: 500;
    }

    .tag-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #00e88f;
      animation: pulse 2s ease-in-out infinite;
    }

    /* ── Right panel ── */
    .panel-right {
      flex: 0.9;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      position: relative;
      z-index: 1;
    }

    .form-shell {
      width: 100%;
      max-width: 400px;
      background: rgba(16, 22, 18, 0.85);
      backdrop-filter: blur(40px);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 20px;
      padding: 2.5rem;
      animation: fadeUp 0.6s ease-out 0.3s both;
    }

    /* ── Mode tabs ── */
    .form-header { margin-bottom: 2rem; }

    .mode-tabs {
      display: flex;
      position: relative;
      background: rgba(255,255,255,0.04);
      border-radius: 12px;
      padding: 4px;
    }

    .tab {
      flex: 1;
      padding: 0.65rem 0;
      background: none;
      border: none;
      color: rgba(240, 237, 232, 0.4);
      font-family: 'Outfit', sans-serif;
      font-size: 0.88rem;
      font-weight: 500;
      cursor: pointer;
      position: relative;
      z-index: 1;
      transition: color 0.3s;
    }

    .tab.active { color: #f0ede8; }

    .tab-indicator {
      position: absolute;
      top: 4px;
      left: 4px;
      width: calc(50% - 4px);
      height: calc(100% - 8px);
      background: rgba(0, 232, 143, 0.12);
      border: 1px solid rgba(0, 232, 143, 0.15);
      border-radius: 9px;
      transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .tab-indicator.right {
      transform: translateX(100%);
    }

    /* ── Form fields ── */
    .auth-form { display: flex; flex-direction: column; gap: 1.25rem; }

    .field label {
      display: block;
      font-size: 0.78rem;
      font-weight: 500;
      color: rgba(240, 237, 232, 0.4);
      margin-bottom: 0.45rem;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }

    .field input {
      width: 100%;
      padding: 0.8rem 1rem;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 11px;
      color: #f0ede8;
      font-family: 'Outfit', sans-serif;
      font-size: 0.95rem;
      font-weight: 400;
      transition: all 0.25s;
    }

    .field input::placeholder {
      color: rgba(240, 237, 232, 0.2);
    }

    .field input:focus {
      outline: none;
      border-color: rgba(0, 232, 143, 0.35);
      background: rgba(0, 232, 143, 0.04);
      box-shadow: 0 0 0 3px rgba(0, 232, 143, 0.06), inset 0 0 20px rgba(0, 232, 143, 0.02);
    }

    /* ── Messages ── */
    .msg {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.7rem 1rem;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 400;
    }

    .msg-error {
      color: #ff6b6b;
      background: rgba(255, 107, 107, 0.08);
      border: 1px solid rgba(255, 107, 107, 0.15);
    }

    .msg-success {
      color: #00e88f;
      background: rgba(0, 232, 143, 0.08);
      border: 1px solid rgba(0, 232, 143, 0.15);
    }

    /* ── Submit button ── */
    .btn-submit {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      width: 100%;
      padding: 0.85rem 1.5rem;
      margin-top: 0.5rem;
      background: linear-gradient(135deg, #00e88f 0%, #00b4d8 100%);
      border: none;
      border-radius: 12px;
      color: #070b09;
      font-family: 'Syne', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: -0.3px;
      cursor: pointer;
      transition: all 0.25s;
      position: relative;
      overflow: hidden;
    }

    .btn-submit::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%);
      opacity: 0;
      transition: opacity 0.25s;
    }

    .btn-submit:hover::before { opacity: 1; }

    .btn-submit:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 30px rgba(0, 232, 143, 0.2), 0 2px 8px rgba(0, 232, 143, 0.15);
    }

    .btn-submit:active { transform: translateY(0); }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .btn-arrow { flex-shrink: 0; }

    .btn-loader {
      width: 20px;
      height: 20px;
      border: 2.5px solid rgba(7, 11, 9, 0.2);
      border-top-color: #070b09;
      border-radius: 50%;
      animation: spin 0.65s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Demo hint ── */
    .demo-hint {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.8rem;
      color: rgba(240, 237, 232, 0.25);
    }

    .demo-hint code {
      display: inline-block;
      padding: 0.15rem 0.45rem;
      background: rgba(0, 232, 143, 0.08);
      border: 1px solid rgba(0, 232, 143, 0.12);
      border-radius: 5px;
      color: #00e88f;
      font-family: 'Outfit', monospace;
      font-size: 0.78rem;
      font-weight: 500;
    }

    /* ── Responsive ── */
    @media (max-width: 900px) {
      .scene { flex-direction: column; }
      .panel-left {
        padding: 2rem 2rem 1.5rem;
        flex: none;
      }
      .brand-title { font-size: 2rem; }
      .stats-row, .bottom-tag { display: none; }
      .brand-block { margin-bottom: 0; }
      .panel-right { flex: 1; padding: 1rem 1.5rem 2rem; }
      .form-shell { max-width: 100%; }
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {
  username = '';
  email = '';
  password = '';
  isLoginMode = true;
  errorMessage = '';
  successMessage = '';
  loading = false;

  stats = [
    { value: '2.4t', label: 'CO\u2082 moyen/m\u00B2' },
    { value: '47%', label: 'construction' },
    { value: '53%', label: 'exploitation' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {}
  ngOnDestroy() {}

  setMode(login: boolean) {
    this.isLoginMode = login;
    this.errorMessage = '';
    this.successMessage = '';
  }

  toggleMode() {
    this.setMode(!this.isLoginMode);
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    if (this.isLoginMode) {
      const credentials: LoginRequest = {
        username: this.username,
        password: this.password
      };

      this.authService.login(credentials).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.loading = false;
          this.errorMessage = 'Identifiants invalides';
        }
      });
    } else {
      this.authService.signup({
        username: this.username,
        email: this.email,
        password: this.password
      }).subscribe({
        next: () => {
          this.loading = false;
          this.isLoginMode = true;
          this.successMessage = 'Compte cr\u00E9\u00E9 ! Connectez-vous maintenant.';
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.message || 'Erreur lors de l\'inscription';
        }
      });
    }
  }
}
