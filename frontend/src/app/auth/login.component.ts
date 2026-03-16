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
    <div class="login-container">
      <div class="login-card">
        <h2>{{ isLoginMode ? 'Connexion' : 'Inscription' }}</h2>

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Nom d'utilisateur</label>
            <input
              type="text"
              [(ngModel)]="username"
              name="username"
              required
              class="form-control">
          </div>

          <div class="form-group" *ngIf="!isLoginMode">
            <label>Email</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              class="form-control">
          </div>

          <div class="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              class="form-control">
          </div>

          <div class="error" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <button type="submit" class="btn-primary">
            {{ isLoginMode ? 'Se connecter' : 'S\'inscrire' }}
          </button>

          <p class="toggle-mode">
            {{ isLoginMode ? 'Pas de compte ?' : 'Déjà un compte ?' }}
            <a (click)="toggleMode()">
              {{ isLoginMode ? 'S\'inscrire' : 'Se connecter' }}
            </a>
          </p>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .login-card {
      background: white;
      padding: 2rem;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      width: 100%;
      max-width: 400px;
    }

    h2 {
      text-align: center;
      margin-bottom: 2rem;
      color: #333;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #555;
      font-weight: 500;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 1rem;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
    }

    .btn-primary {
      width: 100%;
      padding: 0.75rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.3s;
    }

    .btn-primary:hover {
      background: #5568d3;
    }

    .toggle-mode {
      text-align: center;
      margin-top: 1rem;
      color: #666;
    }

    .toggle-mode a {
      color: #667eea;
      cursor: pointer;
      text-decoration: none;
    }

    .toggle-mode a:hover {
      text-decoration: underline;
    }

    .error {
      color: #dc3545;
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: #f8d7da;
      border-radius: 5px;
    }
  `]
})
export class LoginComponent {
  username = '';
  email = '';
  password = '';
  isLoginMode = true;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
  }

  onSubmit() {
    this.errorMessage = '';

    if (this.isLoginMode) {
      const credentials: LoginRequest = {
        username: this.username,
        password: this.password
      };

      this.authService.login(credentials).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
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
          this.isLoginMode = true;
          this.errorMessage = '';
          alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erreur lors de l\'inscription';
        }
      });
    }
  }
}
