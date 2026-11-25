import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <header>
          <h1>TeamPilot</h1>
          <p>Gestão de Orçamentos & Inteligência Comercial</p>
        </header>

        <div class="tabs">
          <button type="button" [class.active]="mode() === 'login'" (click)="switchMode('login')">
            Entrar
          </button>
          <button type="button" [class.active]="mode() === 'register'" (click)="switchMode('register')">
            Cadastrar Usuário
          </button>
        </div>

        @if (mode() === 'login') {
          <form [formGroup]="loginForm" (ngSubmit)="onLogin()">
            <div class="field">
              <label for="login">Usuário</label>
              <input id="login" type="text" formControlName="login" placeholder="Ex: supervisor" />
            </div>

            <div class="field">
              <label for="senha">Senha</label>
              <input id="senha" type="password" formControlName="senha" placeholder="••••••" />
            </div>

            @if (feedback()) {
              <div [class]="isError() ? 'alert-error' : 'alert-ok'">{{ feedback() }}</div>
            }

            <button type="submit" class="btn-primary" [disabled]="loginForm.invalid || loading()">
              {{ loading() ? 'Autenticando...' : 'Entrar' }}
            </button>
          </form>

          <div class="demo-box">
            <span>Acesso rápido (Ambiente Dev):</span>
            <div class="demo-actions">
              <button type="button" class="btn-ghost" (click)="fillDemo('supervisor')">
                Supervisor
              </button>
              <button type="button" class="btn-ghost" (click)="fillDemo('joao.rca')">
                Vendedor (RCA)
              </button>
            </div>
          </div>
        } @else {
          <form [formGroup]="registerForm" (ngSubmit)="onRegister()">
            <div class="field">
              <label>Perfil de Acesso</label>
              <select formControlName="role">
                <option value="ROLE_SUPERVISOR">Supervisor Comercial</option>
                <option value="ROLE_RCA">Vendedor (RCA)</option>
              </select>
            </div>

            <div class="field">
              <label>Login de Acesso *</label>
              <input type="text" formControlName="login" placeholder="Ex: katia.rca ou gerente" />
            </div>

            <div class="field">
              <label>Senha *</label>
              <input type="password" formControlName="senha" placeholder="Mínimo 6 caracteres" />
            </div>

            @if (registerForm.controls.role.value === 'ROLE_RCA') {
              <div class="grid-2">
                <div class="field">
                  <label>Código RCA *</label>
                  <input type="text" formControlName="codigoRca" placeholder="Ex: 2496" />
                </div>
                <div class="field">
                  <label>Meta Mensal (R$)</label>
                  <input type="number" formControlName="metaMensal" placeholder="250000" />
                </div>
              </div>

              <div class="field">
                <label>Nome Completo do RCA *</label>
                <input type="text" formControlName="nomeRca" placeholder="Ex: Katia Moreira" />
              </div>

              <div class="field">
                <label>Telefone</label>
                <input type="text" formControlName="telefoneRca" placeholder="(61) 99999-9999" />
              </div>
            }

            @if (feedback()) {
              <div [class]="isError() ? 'alert-error' : 'alert-ok'">{{ feedback() }}</div>
            }

            <button type="submit" class="btn-primary" [disabled]="registerForm.invalid || loading()">
              {{ loading() ? 'Cadastrando...' : 'Criar Conta' }}
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f172a;
      padding: 1rem;
    }
    .login-card {
      width: 100%;
      max-width: 440px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 2rem;
      color: #f8fafc;
    }
    header {
      text-align: center;
      margin-bottom: 1.25rem;
      h1 { margin: 0; font-size: 1.75rem; color: #38bdf8; }
      p { margin: 0.4rem 0 0; font-size: 0.875rem; color: #94a3b8; }
    }
    .tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      background: #0f172a;
      padding: 0.3rem;
      border-radius: 8px;
      button {
        padding: 0.5rem;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: #94a3b8;
        font-weight: 600;
        cursor: pointer;
        &.active { background: #0284c7; color: white; }
      }
    }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .field {
      margin-bottom: 1rem;
      label { display: block; font-size: 0.82rem; margin-bottom: 0.35rem; color: #cbd5e1; }
      input, select {
        width: 100%;
        padding: 0.6rem 0.75rem;
        border-radius: 8px;
        border: 1px solid #334155;
        background: #0f172a;
        color: #f8fafc;
        font-size: 0.92rem;
      }
    }
    .alert-error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid #ef4444;
      color: #fca5a5;
      padding: 0.6rem;
      border-radius: 6px;
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }
    .alert-ok {
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid #22c55e;
      color: #86efac;
      padding: 0.6rem;
      border-radius: 6px;
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }
    .btn-primary {
      width: 100%;
      padding: 0.75rem;
      border: none;
      border-radius: 8px;
      background: #0284c7;
      color: white;
      font-weight: 600;
      cursor: pointer;
      &:disabled { opacity: 0.6; cursor: not-allowed; }
      &:hover:not(:disabled) { background: #0369a1; }
    }
    .demo-box {
      margin-top: 1.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid #334155;
      text-align: center;
      span { display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.6rem; }
      .demo-actions { display: flex; gap: 0.5rem; justify-content: center; }
    }
    .btn-ghost {
      background: transparent;
      border: 1px solid #475569;
      color: #cbd5e1;
      padding: 0.4rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
      &:hover { border-color: #38bdf8; color: #38bdf8; }
    }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly mode = signal<'login' | 'register'>('login');
  readonly loading = signal(false);
  readonly feedback = signal<string | null>(null);
  readonly isError = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    login: ['', Validators.required],
    senha: ['', Validators.required]
  });

  readonly registerForm = this.fb.nonNullable.group({
    role: ['ROLE_RCA' as 'ROLE_SUPERVISOR' | 'ROLE_RCA', Validators.required],
    login: ['', Validators.required],
    senha: ['', [Validators.required, Validators.minLength(6)]],
    codigoRca: [''],
    nomeRca: [''],
    telefoneRca: [''],
    metaMensal: [250000]
  });

  switchMode(newMode: 'login' | 'register'): void {
    this.mode.set(newMode);
    this.feedback.set(null);
  }

  fillDemo(login: string): void {
    this.loginForm.patchValue({ login, senha: '123456' });
  }

  onLogin(): void {
    if (this.loginForm.invalid) return;
    this.loading.set(true);
    this.feedback.set(null);

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: () => this.router.navigate(['/orcamentos']),
      error: () => {
        this.isError.set(true);
        this.feedback.set('Usuário ou senha inválidos.');
        this.loading.set(false);
      }
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) return;
    this.loading.set(true);
    this.feedback.set(null);

    const raw = this.registerForm.getRawValue();
    this.authService.register(raw).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.isError.set(false);
        this.mode.set('login');
        this.loginForm.patchValue({ login: raw.login, senha: raw.senha });
        this.feedback.set(res.message + ' Faça login agora.');
      },
      error: (err) => {
        this.loading.set(false);
        this.isError.set(true);
        this.feedback.set(err?.error?.message || 'Erro ao cadastrar usuário.');
      }
    });
  }
}
