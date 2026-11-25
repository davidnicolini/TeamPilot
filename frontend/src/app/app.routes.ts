import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { LoginComponent } from './features/login/login.component';
import { OrcamentosComponent } from './features/orcamentos/orcamentos.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'orcamentos', component: OrcamentosComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'orcamentos', pathMatch: 'full' },
  { path: '**', redirectTo: 'orcamentos' }
];
