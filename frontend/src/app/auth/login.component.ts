import { Component } from '@angular/core';
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
    <div class="auth-root">

      <!-- Ambient background orbs -->
      <div class="ambient" aria-hidden="true">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>

      <!-- Card -->
      <div class="card" [class.shake]="shaking">

        <!-- Brand -->
        <div class="brand">
          <div class="brand-icon">
            <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="56" height="56" rx="14" fill="#007AFF"/>
              <path d="M28 14C20.268 14 14 20.268 14 28s6.268 14 14 14 14-6.268 14-14S35.732 14 28 14z"
                    fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
              <circle cx="28" cy="18" r="2" fill="white"/>
              <path d="M20 29l5.5 5.5L37 22"
                    stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1 class="brand-name">Carbon<span>Track</span></h1>
          <p class="brand-tagline">Calculateur d'empreinte carbone</p>
        </div>

        <!-- Segment toggle -->
        <div class="segment" role="tablist">
          <button class="seg-btn" [class.active]="isLoginMode"
                  role="tab" [attr.aria-selected]="isLoginMode"
                  (click)="setMode(true)" type="button">
            Connexion
          </button>
          <button class="seg-btn" [class.active]="!isLoginMode"
                  role="tab" [attr.aria-selected]="!isLoginMode"
                  (click)="setMode(false)" type="button">
            Inscription
          </button>
        </div>

        <!-- Form -->
        <form (ngSubmit)="onSubmit()" autocomplete="off" novalidate>

          <div class="fields">

            <div class="field">
              <span class="field-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6z"/>
                  <path fill-rule="evenodd"
                        d="M6 8a4 4 0 118 0 4 4 0 01-8 0zM2 17a8 8 0 1116 0H2z"
                        clip-rule="evenodd"/>
                </svg>
              </span>
              <input type="text" [(ngModel)]="username" name="username"
                     placeholder="Nom d'utilisateur" required
                     class="field-input" autocomplete="username"/>
            </div>

            <div class="field" *ngIf="!isLoginMode" style="animation: slideDown 0.25s ease">
              <span class="field-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
              </span>
              <input type="email" [(ngModel)]="email" name="email"
                     placeholder="Adresse email" [required]="!isLoginMode"
                     class="field-input" autocomplete="email"/>
            </div>

            <div class="field">
              <span class="field-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clip-rule="evenodd"/>
                </svg>
              </span>
              <input [type]="showPwd ? 'text' : 'password'" [(ngModel)]="password" name="password"
                     placeholder="Mot de passe" required
                     class="field-input" autocomplete="current-password"/>
              <button type="button" class="pwd-toggle" (click)="showPwd = !showPwd"
                      [attr.aria-label]="showPwd ? 'Masquer' : 'Afficher'">
                <svg *ngIf="!showPwd" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fill-rule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clip-rule="evenodd"/>
                </svg>
                <svg *ngIf="showPwd" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                        d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                        clip-rule="evenodd"/>
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                </svg>
              </button>
            </div>

          </div>

          <!-- Error -->
          <div class="error-msg" *ngIf="errorMessage" role="alert">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"/>
            </svg>
            {{ errorMessage }}
          </div>

          <!-- CTA -->
          <button type="submit" class="cta" [class.loading]="isLoading" [disabled]="isLoading">
            <span *ngIf="!isLoading">{{ isLoginMode ? 'Se connecter' : 'Créer un compte' }}</span>
            <span *ngIf="isLoading" class="spinner" aria-hidden="true"></span>
          </button>

        </form>

        <p class="footer-note">
          Un outil Capgemini pour mesurer et réduire l'impact carbone de vos sites physiques.
        </p>
      </div>
    </div>
  `,
  styles: [`
    /* ── Layout ── */
    .auth-root {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-primary);
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
    }

    /* ── Ambient orbs ── */
    .ambient { position: absolute; inset: 0; pointer-events: none; }

    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(90px);
    }
    .orb-1 {
      width: 560px; height: 560px;
      background: radial-gradient(circle, rgba(0,122,255,0.55), transparent 68%);
      top: -180px; right: -60px;
      animation: floatA 9s ease-in-out infinite;
    }
    .orb-2 {
      width: 420px; height: 420px;
      background: radial-gradient(circle, rgba(52,199,89,0.4), transparent 68%);
      bottom: -120px; left: -80px;
      animation: floatB 11s ease-in-out infinite;
    }
    .orb-3 {
      width: 280px; height: 280px;
      background: radial-gradient(circle, rgba(175,82,222,0.4), transparent 68%);
      top: 45%; left: 35%;
      animation: floatC 13s ease-in-out infinite;
    }
    @keyframes floatA { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-28px,24px)} }
    @keyframes floatB { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-18px)} }
    @keyframes floatC { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(12px,10px) scale(1.08)} }

    @media (prefers-color-scheme: dark) {
      .orb-1 { opacity: 0.22; }
      .orb-2 { opacity: 0.18; }
      .orb-3 { opacity: 0.16; }
    }

    /* ── Card ── */
    .card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 420px;
      background: var(--bg-blur);
      backdrop-filter: blur(44px) saturate(180%);
      -webkit-backdrop-filter: blur(44px) saturate(180%);
      border: 1px solid var(--separator);
      border-radius: var(--r-2xl);
      padding: 2.5rem 2.25rem;
      box-shadow: var(--shadow-xl);
      animation: cardAppear 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    @keyframes cardAppear {
      from { opacity: 0; transform: translateY(28px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0)    scale(1); }
    }
    .card.shake {
      animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards;
    }
    @keyframes shake {
      0%,100% { transform: translateX(0); }
      15%, 45%, 75% { transform: translateX(-7px); }
      30%, 60%, 90% { transform: translateX(7px); }
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Brand ── */
    .brand { text-align: center; margin-bottom: 2rem; }

    .brand-icon {
      width: 64px; height: 64px;
      margin: 0 auto 1rem;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 6px 20px rgba(0,122,255,0.35);
    }
    .brand-icon svg { width: 100%; height: 100%; }

    .brand-name {
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.6px;
      color: var(--text-primary);
    }
    .brand-name span { color: #007AFF; }

    .brand-tagline {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-top: 0.3rem;
    }

    /* ── Segment control ── */
    .segment {
      display: flex;
      background: var(--bg-input);
      border-radius: 10px;
      padding: 3px;
      margin-bottom: 1.75rem;
      gap: 2px;
    }
    .seg-btn {
      flex: 1;
      padding: 0.5rem 0;
      border: none;
      background: transparent;
      border-radius: 8px;
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    .seg-btn.active {
      background: var(--bg-elevated);
      color: var(--text-primary);
      box-shadow: var(--shadow-sm);
    }

    /* ── Fields ── */
    .fields {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      margin-bottom: 1.25rem;
    }

    .field {
      position: relative;
      display: flex;
      align-items: center;
    }

    .field-icon {
      position: absolute;
      left: 0.9rem;
      color: var(--text-tertiary);
      width: 18px; height: 18px;
      pointer-events: none;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .field-icon svg { width: 18px; height: 18px; }

    .field-input {
      width: 100%;
      padding: 0.875rem 2.8rem 0.875rem 2.75rem;
      background: var(--bg-input);
      border: 1.5px solid transparent;
      border-radius: var(--r-md);
      font-size: 1rem;
      color: var(--text-primary);
      font-family: inherit;
      transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
    }
    .field-input::placeholder { color: var(--text-tertiary); }
    .field-input:focus {
      outline: none;
      border-color: #007AFF;
      background: var(--bg-input-focus);
      box-shadow: 0 0 0 4px rgba(0,122,255,0.14);
    }

    .pwd-toggle {
      position: absolute;
      right: 0.85rem;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-tertiary);
      padding: 4px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 6px;
      transition: color 0.15s, background 0.15s;
    }
    .pwd-toggle:hover {
      color: var(--text-secondary);
      background: var(--bg-input);
    }
    .pwd-toggle svg { width: 18px; height: 18px; }

    /* ── Error ── */
    .error-msg {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: rgba(255,59,48,0.10);
      border: 1px solid rgba(255,59,48,0.25);
      border-radius: var(--r-md);
      color: #FF3B30;
      font-size: 0.875rem;
      margin-bottom: 1rem;
      animation: fadeInUp 0.2s ease;
    }
    .error-msg svg { width: 16px; height: 16px; flex-shrink: 0; }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── CTA Button ── */
    .cta {
      width: 100%;
      padding: 0.9rem;
      background: #007AFF;
      color: white;
      border: none;
      border-radius: var(--r-md);
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      display: flex; align-items: center; justify-content: center;
      min-height: 50px;
      transition: background 0.2s, transform 0.18s, box-shadow 0.2s;
    }
    .cta:hover:not(:disabled) {
      background: #0066DD;
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(0,122,255,0.4);
    }
    .cta:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: none;
    }
    .cta:disabled { opacity: 0.55; cursor: not-allowed; }
    .cta.loading { pointer-events: none; }

    /* ── Spinner ── */
    .spinner {
      width: 20px; height: 20px;
      border: 2.5px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Footer ── */
    .footer-note {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.78rem;
      color: var(--text-tertiary);
      line-height: 1.5;
    }
  `]
})
export class LoginComponent {
  isLoginMode = true;
  username = '';
  email = '';
  password = '';
  showPwd = false;
  isLoading = false;
  shaking = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  setMode(loginMode: boolean): void {
    this.isLoginMode = loginMode;
    this.errorMessage = '';
    this.email = '';
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.isLoading = true;

    if (this.isLoginMode) {
      this.authService.login({ username: this.username, password: this.password })
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.router.navigate(['/dashboard']);
          },
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = err.status === 401
              ? 'Identifiants incorrects. Vérifiez votre nom d\'utilisateur et mot de passe.'
              : 'Une erreur est survenue. Veuillez réessayer.';
            this.triggerShake();
          }
        });
    } else {
      this.authService.signup({ username: this.username, email: this.email, password: this.password })
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.setMode(true);
            this.errorMessage = '';
          },
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = err.error?.message || 'Erreur lors de l\'inscription. Ce nom d\'utilisateur est peut-être déjà pris.';
            this.triggerShake();
          }
        });
    }
  }

  private triggerShake(): void {
    this.shaking = true;
    setTimeout(() => this.shaking = false, 450);
  }
}


