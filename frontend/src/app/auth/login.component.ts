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
    <div class="login-page">
      <div class="login-left">
        <div class="brand">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707"/>
              <circle cx="12" cy="12" r="4"/>
            </svg>
          </div>
          <h1>Carbon Calculator</h1>
          <p class="brand-tagline">Mesurez et optimisez l'empreinte carbone de vos sites</p>
        </div>
        <div class="features">
          <div class="feature">
            <span class="feature-icon">&#9889;</span>
            <div>
              <strong>Analyse en temps reel</strong>
              <p>Suivez vos emissions de CO2 en direct</p>
            </div>
          </div>
          <div class="feature">
            <span class="feature-icon">&#9881;</span>
            <div>
              <strong>Recommandations</strong>
              <p>Identifiez les leviers de reduction</p>
            </div>
          </div>
          <div class="feature">
            <span class="feature-icon">&#128202;</span>
            <div>
              <strong>Tableaux de bord</strong>
              <p>Visualisez vos donnees carbone</p>
            </div>
          </div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-card">
          <div class="card-header">
            <h2>{{ isLoginMode ? 'Connexion' : 'Inscription' }}</h2>
            <p class="card-subtitle">{{ isLoginMode ? 'Accedez a votre espace' : 'Creez votre compte' }}</p>
          </div>

          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="username">Nom d'utilisateur</label>
              <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <input
                  id="username"
                  type="text"
                  [(ngModel)]="username"
                  name="username"
                  placeholder="Entrez votre identifiant"
                  required
                  class="form-control">
              </div>
            </div>

            <div class="form-group" *ngIf="!isLoginMode">
              <label for="email">Email</label>
              <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M22 4l-10 8L2 4"/>
                </svg>
                <input
                  id="email"
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  placeholder="votre@email.com"
                  required
                  class="form-control">
              </div>
            </div>

            <div class="form-group">
              <label for="password">Mot de passe</label>
              <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <input
                  id="password"
                  type="password"
                  [(ngModel)]="password"
                  name="password"
                  placeholder="Entrez votre mot de passe"
                  required
                  class="form-control">
              </div>
            </div>

            <div class="error" *ngIf="errorMessage">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="error-icon">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {{ errorMessage }}
            </div>

            <div class="success" *ngIf="successMessage">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="success-icon">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {{ successMessage }}
            </div>

            <button type="submit" class="btn-primary" [disabled]="loading">
              <span *ngIf="loading" class="spinner"></span>
              {{ loading ? '' : (isLoginMode ? 'Se connecter' : 'Creer mon compte') }}
            </button>
          </form>

          <div class="divider">
            <span>ou</span>
          </div>

          <p class="toggle-mode">
            {{ isLoginMode ? 'Pas encore de compte ?' : 'Deja un compte ?' }}
            <a (click)="toggleMode()">
              {{ isLoginMode ? 'Creer un compte' : 'Se connecter' }}
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }

    .login-page {
      display: flex;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .login-left {
      flex: 1;
      background: linear-gradient(160deg, #0b3d2e 0%, #145a3e 40%, #1a7a52 100%);
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 4rem;
      position: relative;
      overflow: hidden;
    }

    .login-left::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: rgba(255,255,255,0.03);
    }

    .login-left::after {
      content: '';
      position: absolute;
      bottom: -30%;
      left: -10%;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: rgba(255,255,255,0.04);
    }

    .brand {
      position: relative;
      z-index: 1;
      margin-bottom: 3rem;
    }

    .brand-icon {
      width: 56px;
      height: 56px;
      background: rgba(255,255,255,0.15);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
    }

    .brand-icon svg {
      width: 32px;
      height: 32px;
      color: #4ade80;
    }

    .brand h1 {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 0.75rem;
      letter-spacing: -0.5px;
    }

    .brand-tagline {
      font-size: 1.1rem;
      opacity: 0.8;
      margin: 0;
      line-height: 1.5;
    }

    .features {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .feature {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255,255,255,0.08);
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }

    .feature-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .feature strong {
      display: block;
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
    }

    .feature p {
      margin: 0;
      font-size: 0.85rem;
      opacity: 0.7;
    }

    .login-right {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: #f8faf9;
    }

    .login-card {
      width: 100%;
      max-width: 420px;
      background: white;
      padding: 2.5rem;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
    }

    .card-header {
      margin-bottom: 2rem;
    }

    .card-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111;
      margin: 0 0 0.5rem;
    }

    .card-subtitle {
      color: #6b7280;
      margin: 0;
      font-size: 0.95rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #374151;
      font-weight: 500;
      font-size: 0.9rem;
    }

    .input-wrapper {
      position: relative;
    }

    .input-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
      color: #9ca3af;
      pointer-events: none;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem 0.75rem 0.75rem 2.5rem;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      font-size: 0.95rem;
      background: #f9fafb;
      transition: all 0.2s;
      color: #111;
    }

    .form-control::placeholder {
      color: #9ca3af;
    }

    .form-control:focus {
      outline: none;
      border-color: #1a7a52;
      background: white;
      box-shadow: 0 0 0 3px rgba(26, 122, 82, 0.1);
    }

    .btn-primary {
      width: 100%;
      padding: 0.85rem;
      background: #1a7a52;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .btn-primary:hover {
      background: #145a3e;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(26, 122, 82, 0.3);
    }

    .btn-primary:active {
      transform: translateY(0);
    }

    .btn-primary:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .divider {
      display: flex;
      align-items: center;
      margin: 1.5rem 0;
      color: #9ca3af;
      font-size: 0.85rem;
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #e5e7eb;
    }

    .divider span {
      padding: 0 1rem;
    }

    .toggle-mode {
      text-align: center;
      color: #6b7280;
      font-size: 0.9rem;
      margin: 0;
    }

    .toggle-mode a {
      color: #1a7a52;
      cursor: pointer;
      text-decoration: none;
      font-weight: 600;
    }

    .toggle-mode a:hover {
      text-decoration: underline;
    }

    .error {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #dc2626;
      margin-bottom: 1rem;
      padding: 0.75rem 1rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      font-size: 0.9rem;
    }

    .error-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .success {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #16a34a;
      margin-bottom: 1rem;
      padding: 0.75rem 1rem;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      font-size: 0.9rem;
    }

    .success-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    @media (max-width: 768px) {
      .login-page {
        flex-direction: column;
      }

      .login-left {
        padding: 2rem;
        min-height: auto;
      }

      .features {
        display: none;
      }

      .login-right {
        padding: 1.5rem;
      }

      .login-card {
        box-shadow: none;
        background: transparent;
        padding: 1.5rem 0;
      }
    }
  `]
})
export class LoginComponent {
  username = '';
  email = '';
  password = '';
  isLoginMode = true;
  errorMessage = '';
  successMessage = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
    this.successMessage = '';
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
          this.successMessage = 'Inscription reussie ! Connectez-vous maintenant.';
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.message || 'Erreur lors de l\'inscription';
        }
      });
    }
  }
}
