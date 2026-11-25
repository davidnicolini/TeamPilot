import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { OrcamentoService } from '../../core/services/orcamento.service';
import { MotivoPerda, OrcamentoResponse } from '../../core/models/teampilot.models';

@Component({
  selector: 'app-orcamentos',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="layout">
      <nav class="topbar">
        <div class="brand">
          <strong>TeamPilot</strong>
          <span class="user-badge">{{ authService.currentUser() }}</span>
        </div>
        <button class="btn-logout" (click)="authService.logout()">Sair</button>
      </nav>

      <main class="container">
        <section class="kpis">
          <div class="kpi-card">
            <span>Total em Negociação</span>
            <strong>{{ totalEmNegociacao() | currency:'BRL' }}</strong>
          </div>
          <div class="kpi-card">
            <span>Total Fechado</span>
            <strong class="text-green">{{ totalFechado() | currency:'BRL' }}</strong>
          </div>
          <div class="kpi-card">
            <span>Taxa de Conversão</span>
            <strong>{{ taxaConversao() }}%</strong>
          </div>
        </section>

        @if (importFeedback()) {
          <div class="banner-info">{{ importFeedback() }}</div>
        }

        <section class="panel">
          <div class="panel-header">
            <h2>Orçamentos Comerciais ({{ orcamentos().length }})</h2>
            <div class="header-actions">
              <label class="btn-upload">
                {{ uploading() ? 'Importando...' : 'Importar CSV / Excel' }}
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  (change)="onFileSelected($event)"
                  [disabled]="uploading()"
                  hidden
                />
              </label>
              <button class="btn-refresh" (click)="loadOrcamentos()">Atualizar</button>
            </div>
          </div>

          @if (loading()) {
            <p class="empty">Carregando cotações...</p>
          } @else if (orcamentos().length === 0) {
            <p class="empty">Nenhum orçamento encontrado. Importe uma planilha CSV/Excel ou cadastre cotações.</p>
          } @else {
            <div class="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Pedido / RE</th>
                    <th>Cliente</th>
                    <th>RCA</th>
                    <th>Data</th>
                    <th>Valor</th>
                    <th>Margem</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of orcamentos(); track item.id) {
                    <tr>
                      <td>{{ item.numeroPedido || '#' + item.id }}</td>
                      <td>{{ item.clienteRazaoSocial }}</td>
                      <td>{{ item.rcaNome }}</td>
                      <td>{{ item.dataOrcamento | date:'dd/MM/yyyy' }}</td>
                      <td>{{ item.valorTotal | currency:'BRL' }}</td>
                      <td>{{ item.margemLucro ? item.margemLucro + '%' : '-' }}</td>
                      <td>
                        <span class="badge" [attr.data-status]="item.status">
                          {{ item.status }}
                        </span>
                        @if (item.status === 'PERDIDO' && item.motivoPerda) {
                          <small class="loss-detail">
                            {{ item.motivoPerda }} {{ item.concorrente ? '(' + item.concorrente + ')' : '' }}
                          </small>
                        }
                      </td>
                      <td class="actions">
                        @if (item.status === 'EM_NEGOCIACAO') {
                          <button class="btn-win" (click)="fechar(item.id)">Fechar</button>
                          <button class="btn-lose" (click)="abrirModalPerda(item)">Perder</button>
                        } @else {
                          <span class="muted">Finalizado</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      </main>

      @if (orcamentoSelecionado()) {
        <div class="modal-backdrop" (click)="fecharModalPerda()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Registrar Perda de Orçamento</h3>
            <p>Cliente: <strong>{{ orcamentoSelecionado()?.clienteRazaoSocial }}</strong></p>

            <label>Motivo da Perda *</label>
            <select [(ngModel)]="motivoSelecionado">
              <option value="PRECO">Preço</option>
              <option value="CONCORRENCIA">Concorrência</option>
              <option value="PRAZO">Prazo de Entrega</option>
              <option value="FALTA_DE_ESTOQUE">Falta de Estoque</option>
              <option value="OUTRO">Outro</option>
            </select>

            <label>Concorrente (opcional)</label>
            <input type="text" [(ngModel)]="concorrenteInput" placeholder="Ex: Condor, Objetiva..." />

            <div class="modal-actions">
              <button class="btn-cancel" (click)="fecharModalPerda()">Cancelar</button>
              <button class="btn-confirm-lose" (click)="confirmarPerda()">Confirmar Perda</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .layout { min-height: 100vh; background: #0f172a; color: #f8fafc; }
    .topbar {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1rem 2rem; background: #1e293b; border-bottom: 1px solid #334155;
      .brand { display: flex; align-items: center; gap: 0.75rem; font-size: 1.2rem; color: #38bdf8; }
      .user-badge { font-size: 0.8rem; background: #0f172a; color: #cbd5e1; padding: 0.25rem 0.6rem; border-radius: 999px; }
    }
    .btn-logout {
      background: transparent; border: 1px solid #475569; color: #cbd5e1;
      padding: 0.4rem 0.9rem; border-radius: 6px; cursor: pointer;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem 1rem; }
    .kpis {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem; margin-bottom: 1.5rem;
    }
    .kpi-card {
      background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 1.25rem;
      span { display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 0.4rem; }
      strong { font-size: 1.5rem; }
      .text-green { color: #4ade80; }
    }
    .banner-info {
      background: rgba(56, 189, 248, 0.15); border: 1px solid #0284c7; color: #bae6fd;
      padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.9rem;
    }
    .panel { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 1.5rem; }
    .panel-header {
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;
      h2 { margin: 0; font-size: 1.15rem; }
      .header-actions { display: flex; gap: 0.5rem; }
    }
    .btn-upload {
      background: #0d9488; color: white; padding: 0.45rem 0.9rem; border-radius: 6px;
      cursor: pointer; font-size: 0.875rem; font-weight: 600; display: inline-flex; align-items: center;
      &:hover { background: #0f766e; }
    }
    .btn-refresh {
      background: #0284c7; border: none; color: white; padding: 0.45rem 0.9rem; border-radius: 6px; cursor: pointer;
    }
    .table-responsive { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem; }
    th, td { padding: 0.8rem 0.65rem; border-bottom: 1px solid #334155; }
    th { color: #94a3b8; font-weight: 600; }
    .badge {
      padding: 0.2rem 0.55rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600;
      &[data-status="EM_NEGOCIACAO"] { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
      &[data-status="FECHADO"] { background: rgba(74, 222, 128, 0.15); color: #4ade80; }
      &[data-status="PERDIDO"] { background: rgba(248, 113, 113, 0.15); color: #f87171; }
    }
    .loss-detail { display: block; font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem; }
    .actions { display: flex; gap: 0.4rem; }
    .btn-win { background: #16a34a; border: none; color: white; padding: 0.35rem 0.65rem; border-radius: 5px; cursor: pointer; }
    .btn-lose { background: #dc2626; border: none; color: white; padding: 0.35rem 0.65rem; border-radius: 5px; cursor: pointer; }
    .muted, .empty { color: #94a3b8; font-size: 0.85rem; }
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7);
      display: flex; align-items: center; justify-content: center; padding: 1rem;
    }
    .modal {
      background: #1e293b; border: 1px solid #475569; border-radius: 10px;
      padding: 1.5rem; width: 100%; max-width: 400px;
      h3 { margin-top: 0; }
      label { display: block; font-size: 0.85rem; color: #cbd5e1; margin: 0.9rem 0 0.35rem; }
      select, input {
        width: 100%; padding: 0.6rem; border-radius: 6px; border: 1px solid #334155;
        background: #0f172a; color: #f8fafc;
      }
    }
    .modal-actions {
      display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem;
      button { padding: 0.55rem 1rem; border-radius: 6px; border: none; cursor: pointer; }
      .btn-cancel { background: #334155; color: #f8fafc; }
      .btn-confirm-lose { background: #dc2626; color: white; font-weight: 600; }
    }
  `]
})
export class OrcamentosComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly orcamentoService = inject(OrcamentoService);

  readonly orcamentos = signal<OrcamentoResponse[]>([]);
  readonly loading = signal(true);
  readonly uploading = signal(false);
  readonly importFeedback = signal<string | null>(null);
  readonly orcamentoSelecionado = signal<OrcamentoResponse | null>(null);

  motivoSelecionado: MotivoPerda = 'PRECO';
  concorrenteInput = '';

  readonly totalEmNegociacao = computed(() =>
    this.orcamentos()
      .filter((o) => o.status === 'EM_NEGOCIACAO')
      .reduce((acc, o) => acc + o.valorTotal, 0)
  );

  readonly totalFechado = computed(() =>
    this.orcamentos()
      .filter((o) => o.status === 'FECHADO')
      .reduce((acc, o) => acc + o.valorTotal, 0)
  );

  readonly taxaConversao = computed(() => {
    const fechados = this.orcamentos().filter((o) => o.status === 'FECHADO').length;
    const perdidos = this.orcamentos().filter((o) => o.status === 'PERDIDO').length;
    const total = fechados + perdidos;
    return total === 0 ? 0 : Math.round((fechados * 100) / total);
  });

  ngOnInit(): void {
    this.loadOrcamentos();
  }

  loadOrcamentos(): void {
    this.loading.set(true);
    this.orcamentoService.list().subscribe({
      next: (data) => {
        this.orcamentos.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    this.importFeedback.set(null);

    this.orcamentoService.importFile(file).subscribe({
      next: (res) => {
        this.uploading.set(false);
        this.importFeedback.set(`${res.mensagem} (${res.ignorados} linhas ignoradas).`);
        input.value = '';
        this.loadOrcamentos();
      },
      error: () => {
        this.uploading.set(false);
        this.importFeedback.set('Falha ao importar planilha. Verifique se o layout corresponde ao relatório de orçamentos.');
        input.value = '';
      }
    });
  }

  fechar(id: number): void {
    this.orcamentoService.closeQuote(id).subscribe(() => this.loadOrcamentos());
  }

  abrirModalPerda(orcamento: OrcamentoResponse): void {
    this.orcamentoSelecionado.set(orcamento);
    this.motivoSelecionado = 'PRECO';
    this.concorrenteInput = '';
  }

  fecharModalPerda(): void {
    this.orcamentoSelecionado.set(null);
  }

  confirmarPerda(): void {
    const alvo = this.orcamentoSelecionado();
    if (!alvo) return;

    this.orcamentoService
      .markAsLost(alvo.id, this.motivoSelecionado, this.concorrenteInput)
      .subscribe(() => {
        this.fecharModalPerda();
        this.loadOrcamentos();
      });
  }
}
