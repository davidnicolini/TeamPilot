import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { OrcamentoService } from '../../core/services/orcamento.service';
import { MotivoPerda, OrcamentoResponse } from '../../core/models/teampilot.models';

type SortField = 'clienteRazaoSocial' | 'rcaNome' | 'dataOrcamento' | 'valorTotal' | 'margemLucro';
type CategoriaFiltro = 'TODOS' | 'NAO_RESPONDIDOS' | 'RESPONDIDOS' | 'FECHADO' | 'PERDIDO';

interface RcaPerformance {
  codigo: string;
  nome: string;
  meta: number;
  emNegociacao: number;
  fechado: number;
  perdido: number;
  qtdFechados: number;
  qtdPerdidos: number;
  qtdAbertos: number;
  conversao: number;
  atingimentoMeta: number;
}

@Component({
  selector: 'app-orcamentos',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, FormsModule],
  template: `
    <div class="layout">
      <nav class="topbar">
        <div class="brand">
          <strong>TeamPilot</strong>
          <span class="user-badge">{{ authService.currentUser() }}</span>
          <span class="role-badge">{{ isSupervisor() ? 'Visão Gerencial (Todos os RCAs)' : 'Carteira Individual' }}</span>
        </div>
        <div class="nav-tabs">
          <button [class.active]="activeTab() === 'dashboard'" (click)="activeTab.set('dashboard')">
            Dashboard & Indicadores
          </button>
          <button [class.active]="activeTab() === 'orcamentos'" (click)="activeTab.set('orcamentos')">
            Orçamentos ({{ orcamentosFiltrados().length }})
          </button>
        </div>
        <button class="btn-logout" (click)="authService.logout()">Sair</button>
      </nav>

      <main class="container">
        @if (importFeedback()) {
          <div class="banner-info">
            <span>{{ importFeedback() }}</span>
            <button class="btn-close-banner" (click)="importFeedback.set(null)">×</button>
          </div>
        }

        <!-- KPIs Principais (Reagem ao filtro de RCA selecionado no Dashboard ou à carteira do RCA logado) -->
        <section class="kpis">
          <div class="kpi-card">
            <span>Em Negociação (Não Respondidos)</span>
            <strong>{{ kpiEmNegociacao() | currency:'BRL' }}</strong>
            <small>{{ kpiQtdAbertos() }} cotações abertas</small>
          </div>
          <div class="kpi-card">
            <span>Total Fechado (Ganho)</span>
            <strong class="text-green">{{ kpiFechado() | currency:'BRL' }}</strong>
            <small>{{ kpiQtdFechados() }} pedidos fechados</small>
          </div>
          <div class="kpi-card">
            <span>Total Perdido</span>
            <strong class="text-red">{{ kpiPerdido() | currency:'BRL' }}</strong>
            <small>{{ kpiQtdPerdidos() }} cotações perdidas</small>
          </div>
          <div class="kpi-card">
            <span>Taxa de Conversão</span>
            <strong>{{ kpiConversao() }}%</strong>
            <small>Ticket médio: {{ kpiTicketMedio() | currency:'BRL' }}</small>
          </div>
        </section>

        @if (activeTab() === 'dashboard') {
          <section class="panel dashboard-panel">
            <div class="panel-header">
              <h2>
                {{ isSupervisor() ? 'Desempenho Comercial por Vendedor (RCA)' : 'Desempenho da Minha Carteira' }}
              </h2>
              @if (isSupervisor()) {
                <div class="header-actions">
                  <select [ngModel]="rcaDashboardFiltro()" (ngModelChange)="rcaDashboardFiltro.set($event)">
                    <option value="TODOS">Todos os RCAs (Consolidado)</option>
                    @for (r of performancePorRca(); track r.codigo) {
                      <option [value]="r.codigo">{{ r.codigo }} - {{ r.nome }}</option>
                    }
                  </select>
                </div>
              }
            </div>

            <div class="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>RCA</th>
                    <th>Em Negociação</th>
                    <th>Fechado</th>
                    <th>Perdido</th>
                    <th>Conversão</th>
                    <th>Meta Mensal</th>
                    <th>Atingimento</th>
                  </tr>
                </thead>
                <tbody>
                  @for (r of performancePorRca(); track r.codigo) {
                    <tr [class.highlight-row]="rcaDashboardFiltro() === r.codigo">
                      <td><strong>{{ r.codigo }}</strong> - {{ r.nome }}</td>
                      <td>{{ r.emNegociacao | currency:'BRL' }} <small class="muted">({{ r.qtdAbertos }})</small></td>
                      <td class="text-green">{{ r.fechado | currency:'BRL' }} <small class="muted">({{ r.qtdFechados }})</small></td>
                      <td class="text-red">{{ r.perdido | currency:'BRL' }} <small class="muted">({{ r.qtdPerdidos }})</small></td>
                      <td><strong>{{ r.conversao }}%</strong></td>
                      <td>{{ r.meta | currency:'BRL' }}</td>
                      <td>
                        <div class="progress-wrapper">
                          <div class="progress-bar">
                            <div class="progress-fill" [style.width.%]="r.atingimentoMeta > 100 ? 100 : r.atingimentoMeta"></div>
                          </div>
                          <span>{{ r.atingimentoMeta | number:'1.0-1' }}%</span>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="dashboard-grid">
              <div class="sub-panel">
                <h3>Motivos de Perda</h3>
                @if (perdasPorMotivo().length === 0) {
                  <p class="muted">Nenhuma perda registrada neste recorte.</p>
                } @else {
                  @for (m of perdasPorMotivo(); track m.motivo) {
                    <div class="stat-row">
                      <span>{{ m.motivo }} ({{ m.qtd }})</span>
                      <strong>{{ m.valor | currency:'BRL' }}</strong>
                    </div>
                  }
                }
              </div>

              <div class="sub-panel">
                <h3>Principais Concorrentes</h3>
                @if (perdasPorConcorrente().length === 0) {
                  <p class="muted">Nenhum concorrente informado nas perdas.</p>
                } @else {
                  @for (c of perdasPorConcorrente(); track c.concorrente) {
                    <div class="stat-row">
                      <span>{{ c.concorrente }} ({{ c.qtd }})</span>
                      <strong>{{ c.valor | currency:'BRL' }}</strong>
                    </div>
                  }
                }
              </div>
            </div>
          </section>
        } @else {
          <section class="panel">
            <div class="panel-header">
              <h2>Orçamentos Comerciais ({{ orcamentosFiltrados().length }} de {{ orcamentos().length }})</h2>
              <div class="header-actions">
                <label class="btn-upload" title="Adiciona novos orçamentos e atualiza os abertos sem alterar os já modificados">
                  {{ uploading() ? 'Importando...' : 'Importar / Atualizar Planilha' }}
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    (change)="onFileSelected($event)"
                    [disabled]="uploading()"
                    hidden
                  />
                </label>

                @if (isSupervisor() && orcamentos().length > 0) {
                  <button class="btn-danger-outline" (click)="limparBaseAnterior()">
                    Limpar Base
                  </button>
                }

                <button class="btn-refresh" (click)="loadOrcamentos()">Atualizar</button>
              </div>
            </div>

            <!-- Barra de Filtros estilo Excel -->
            <div class="excel-filters">
              <div class="filter-item search-box">
                <label>Buscar Cliente / Pedido / Obs</label>
                <input
                  type="text"
                  [ngModel]="buscaTexto()"
                  (ngModelChange)="buscaTexto.set($event)"
                  placeholder="Filtrar por nome, pedido ou observação..."
                />
              </div>

              <div class="filter-item">
                <label>Categoria / Resposta</label>
                <select [ngModel]="categoriaFiltro()" (ngModelChange)="categoriaFiltro.set($event)">
                  <option value="TODOS">Todos os Orçamentos</option>
                  <option value="NAO_RESPONDIDOS">Não Respondidos (Em Negociação)</option>
                  <option value="RESPONDIDOS">Respondidos (Fechados + Perdidos)</option>
                  <option value="FECHADO">Somente Fechados</option>
                  <option value="PERDIDO">Somente Perdidos</option>
                </select>
              </div>

              @if (isSupervisor()) {
                <div class="filter-item">
                  <label>Vendedor (RCA)</label>
                  <select [ngModel]="rcaTabelaFiltro()" (ngModelChange)="rcaTabelaFiltro.set($event)">
                    <option value="TODOS">Todos os RCAs</option>
                    @for (r of performancePorRca(); track r.codigo) {
                      <option [value]="r.codigo">{{ r.codigo }} - {{ r.nome }}</option>
                    }
                  </select>
                </div>
              }

              <div class="filter-item">
                <label>Ordenar Por (Excel)</label>
                <div class="sort-controls">
                  <select [ngModel]="sortField()" (ngModelChange)="sortField.set($event)">
                    <option value="dataOrcamento">Data</option>
                    <option value="clienteRazaoSocial">Cliente (A-Z / Z-A)</option>
                    <option value="rcaNome">RCA (A-Z / Z-A)</option>
                    <option value="valorTotal">Valor (Maior / Menor)</option>
                    <option value="margemLucro">Margem % (Maior / Menor)</option>
                  </select>
                  <button
                    type="button"
                    class="btn-sort-dir"
                    (click)="sortDirection.set(sortDirection() === 'asc' ? 'desc' : 'asc')"
                    [title]="sortDirection() === 'asc' ? 'Crescente (A-Z / Menor-Maior)' : 'Decrescente (Z-A / Maior-Menor)'"
                  >
                    {{ sortDirection() === 'asc' ? '↑ A-Z / Menor' : '↓ Z-A / Maior' }}
                  </button>
                </div>
              </div>

              <div class="filter-item filter-reset">
                <button type="button" class="btn-clear-filters" (click)="resetarFiltros()">
                  Limpar Filtros
                </button>
              </div>
            </div>

            @if (loading()) {
              <p class="empty">Carregando cotações...</p>
            } @else if (orcamentosFiltrados().length === 0) {
              <p class="empty">Nenhum orçamento encontrado para os filtros selecionados.</p>
            } @else {
              <div class="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th class="sortable" (click)="toggleSort('clienteRazaoSocial')">
                        Cliente {{ sortIndicator('clienteRazaoSocial') }}
                      </th>
                      <th class="sortable" (click)="toggleSort('rcaNome')">
                        RCA {{ sortIndicator('rcaNome') }}
                      </th>
                      <th class="sortable" (click)="toggleSort('dataOrcamento')">
                        Data {{ sortIndicator('dataOrcamento') }}
                      </th>
                      <th class="sortable" (click)="toggleSort('valorTotal')">
                        Valor {{ sortIndicator('valorTotal') }}
                      </th>
                      <th class="sortable" (click)="toggleSort('margemLucro')">
                        Margem {{ sortIndicator('margemLucro') }}
                      </th>
                      <th>Status & Observação</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of orcamentosFiltrados(); track item.id) {
                      <tr>
                        <td>{{ item.numeroPedido || '#' + item.id }}</td>
                        <td>{{ item.clienteRazaoSocial }}</td>
                        <td>{{ item.rcaCodigo }} - {{ item.rcaNome }}</td>
                        <td>{{ item.dataOrcamento | date:'dd/MM/yyyy' }}</td>
                        <td><strong>{{ item.valorTotal | currency:'BRL' }}</strong></td>
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
                          @if (item.observacao) {
                            <div class="obs-note">Obs: {{ item.observacao }}</div>
                          }
                        </td>
                        <td class="actions">
                          <button class="btn-obs" (click)="abrirModalObs(item)" title="Adicionar ou editar observação">
                            Obs
                          </button>
                          @if (item.status === 'EM_NEGOCIACAO') {
                            <button class="btn-win" (click)="fechar(item.id)">Fechar</button>
                            <button class="btn-lose" (click)="abrirModalPerda(item)">Perder</button>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </section>
        }
      </main>

      <!-- Modal de Perda -->
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

      <!-- Modal de Observação -->
      @if (orcamentoObsSelecionado()) {
        <div class="modal-backdrop" (click)="fecharModalObs()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Observação do Orçamento</h3>
            <p>Cliente: <strong>{{ orcamentoObsSelecionado()?.clienteRazaoSocial }}</strong></p>

            <label>Anotação / Histórico da Negociação</label>
            <textarea
              rows="4"
              [(ngModel)]="observacaoInput"
              placeholder="Ex: Cliente aguardando aprovação da diretoria até sexta-feira; cobrir oferta de 3%..."
            ></textarea>

            <div class="modal-actions">
              <button class="btn-cancel" (click)="fecharModalObs()">Cancelar</button>
              <button class="btn-save-obs" (click)="salvarObservacao()">Salvar Observação</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .layout { min-height: 100vh; background: #0f172a; color: #f8fafc; }
    .topbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem 1rem;
      padding: 0.85rem 1.5rem;
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(148, 163, 184, 0.14);
      position: sticky;
      top: 0;
      z-index: 20;
    }
    .brand {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.6rem;
      strong { font-size: 1.2rem; color: #38bdf8; }
    }
    .user-badge { font-size: 0.8rem; background: #0f172a; color: #cbd5e1; padding: 0.25rem 0.6rem; border-radius: 999px; }
    .role-badge { font-size: 0.75rem; background: rgba(56, 189, 248, 0.15); color: #7dd3fc; padding: 0.25rem 0.6rem; border-radius: 999px; }
    .nav-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      background: #0f172a;
      padding: 0.25rem;
      border-radius: 8px;
      button {
        background: transparent; border: none; color: #94a3b8; padding: 0.45rem 0.9rem;
        border-radius: 6px; font-weight: 600; cursor: pointer; white-space: nowrap;
        &.active { background: #0284c7; color: white; }
      }
    }
    .btn-logout {
      background: transparent; border: 1px solid #475569; color: #cbd5e1;
      padding: 0.4rem 0.9rem; border-radius: 6px; cursor: pointer; white-space: nowrap;
      &:hover { border-color: #94a3b8; color: #fff; }
    }
    .container { max-width: 1280px; margin: 0 auto; padding: 1.75rem 1rem; }
    .kpis {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem; margin-bottom: 1.5rem;
    }
    .kpi-card {
      background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 1.2rem;
      span { display: block; font-size: 0.82rem; color: #94a3b8; margin-bottom: 0.35rem; }
      strong { display: block; font-size: 1.45rem; }
      small { display: block; font-size: 0.78rem; color: #64748b; margin-top: 0.3rem; }
    }
    .text-green { color: #4ade80; }
    .text-red { color: #f87171; }
    .banner-info {
      display: flex; justify-content: space-between; align-items: center;
      background: rgba(56, 189, 248, 0.15); border: 1px solid #0284c7; color: #bae6fd;
      padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.9rem;
      .btn-close-banner { background: transparent; border: none; color: #bae6fd; font-size: 1.2rem; cursor: pointer; }
    }
    .panel { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 1.5rem; }
    .panel-header {
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.25rem;
      h2 { margin: 0; font-size: 1.15rem; }
      .header-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
      select {
        padding: 0.45rem 0.75rem; border-radius: 6px; border: 1px solid #334155;
        background: #0f172a; color: #f8fafc; max-width: 100%;
      }
    }
    .btn-upload {
      background: #0d9488; color: white; padding: 0.45rem 0.9rem; border-radius: 6px;
      cursor: pointer; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center;
      &:hover { background: #0f766e; }
    }
    .btn-danger-outline {
      background: transparent; border: 1px solid #ef4444; color: #fca5a5;
      padding: 0.45rem 0.85rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem;
      &:hover { background: rgba(239, 68, 68, 0.15); }
    }
    .btn-refresh {
      background: #0284c7; border: none; color: white; padding: 0.45rem 0.9rem; border-radius: 6px; cursor: pointer;
    }
    .excel-filters {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(185px, 1fr));
      gap: 0.85rem;
      background: #0f172a;
      border: 1px solid #334155;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.25rem;
      align-items: end;
      .filter-item {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        min-width: 0;
        label { font-size: 0.75rem; color: #94a3b8; font-weight: 600; white-space: nowrap; }
        input, select {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          padding: 0.5rem 0.65rem;
          border-radius: 6px;
          border: 1px solid #334155;
          background: #1e293b;
          color: #f8fafc;
          font-size: 0.85rem;
        }
      }
      .sort-controls {
        display: flex;
        gap: 0.4rem;
        min-width: 0;
        select { flex: 1; min-width: 0; }
      }
      .btn-sort-dir {
        background: #1e293b; border: 1px solid #475569; color: #38bdf8;
        padding: 0 0.65rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem;
        white-space: nowrap; flex-shrink: 0;
      }
      .filter-reset {
        display: flex;
        justify-content: flex-end;
      }
      .btn-clear-filters {
        width: 100%;
        background: #334155; border: 1px solid #475569; color: #e2e8f0;
        padding: 0.52rem 0.8rem; border-radius: 6px; cursor: pointer;
        font-size: 0.82rem; font-weight: 600; white-space: nowrap;
        &:hover { background: #475569; }
      }
    }
    .table-responsive { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.86rem; }
    th, td { padding: 0.75rem 0.6rem; border-bottom: 1px solid #334155; vertical-align: top; }
    th { color: #94a3b8; font-weight: 600; white-space: nowrap; }
    th.sortable { cursor: pointer; user-select: none; &:hover { color: #38bdf8; } }
    .highlight-row { background: rgba(56, 189, 248, 0.08); }
    .badge {
      padding: 0.2rem 0.55rem; border-radius: 999px; font-size: 0.72rem; font-weight: 600; display: inline-block;
      &[data-status="EM_NEGOCIACAO"] { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
      &[data-status="FECHADO"] { background: rgba(74, 222, 128, 0.15); color: #4ade80; }
      &[data-status="PERDIDO"] { background: rgba(248, 113, 113, 0.15); color: #f87171; }
    }
    .loss-detail { display: block; font-size: 0.75rem; color: #fca5a5; margin-top: 0.25rem; }
    .obs-note {
      margin-top: 0.35rem; padding: 0.35rem 0.5rem; background: #0f172a;
      border-left: 2px solid #38bdf8; border-radius: 4px; font-size: 0.78rem; color: #cbd5e1;
      max-width: 280px; white-space: pre-wrap;
    }
    .actions { display: flex; gap: 0.35rem; flex-wrap: nowrap; }
    .btn-obs { background: #334155; border: none; color: #e2e8f0; padding: 0.35rem 0.6rem; border-radius: 5px; cursor: pointer; font-size: 0.78rem; }
    .btn-win { background: #16a34a; border: none; color: white; padding: 0.35rem 0.6rem; border-radius: 5px; cursor: pointer; font-size: 0.78rem; }
    .btn-lose { background: #dc2626; border: none; color: white; padding: 0.35rem 0.6rem; border-radius: 5px; cursor: pointer; font-size: 0.78rem; }
    .progress-wrapper { display: flex; align-items: center; gap: 0.5rem; }
    .progress-bar { width: 90px; height: 8px; background: #0f172a; border-radius: 999px; overflow: hidden; }
    .progress-fill { height: 100%; background: #22c55e; }
    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-top: 1.5rem; }
    .sub-panel {
      background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 1rem;
      h3 { margin-top: 0; font-size: 0.95rem; color: #38bdf8; }
      .stat-row { display: flex; justify-content: space-between; padding: 0.45rem 0; border-bottom: 1px solid #1e293b; font-size: 0.85rem; }
    }
    .muted, .empty { color: #94a3b8; font-size: 0.85rem; }
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7);
      display: flex; align-items: center; justify-content: center; padding: 1rem; z-index: 50;
    }
    .modal {
      background: #1e293b; border: 1px solid #475569; border-radius: 10px;
      padding: 1.5rem; width: 100%; max-width: 440px;
      h3 { margin-top: 0; }
      label { display: block; font-size: 0.85rem; color: #cbd5e1; margin: 0.9rem 0 0.35rem; }
      select, input, textarea {
        width: 100%; padding: 0.6rem; border-radius: 6px; border: 1px solid #334155;
        background: #0f172a; color: #f8fafc; font-family: inherit;
      }
    }
    .modal-actions {
      display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem;
      button { padding: 0.55rem 1rem; border-radius: 6px; border: none; cursor: pointer; }
      .btn-cancel { background: #334155; color: #f8fafc; }
      .btn-confirm-lose { background: #dc2626; color: white; font-weight: 600; }
      .btn-save-obs { background: #0284c7; color: white; font-weight: 600; }
    }
  `]
})
export class OrcamentosComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly orcamentoService = inject(OrcamentoService);

  readonly activeTab = signal<'dashboard' | 'orcamentos'>('orcamentos');
  readonly orcamentos = signal<OrcamentoResponse[]>([]);
  readonly loading = signal(true);
  readonly uploading = signal(false);
  readonly importFeedback = signal<string | null>(null);

  // Modais
  readonly orcamentoSelecionado = signal<OrcamentoResponse | null>(null);
  readonly orcamentoObsSelecionado = signal<OrcamentoResponse | null>(null);
  motivoSelecionado: MotivoPerda = 'PRECO';
  concorrenteInput = '';
  observacaoInput = '';

  // Filtros estilo Excel
  readonly buscaTexto = signal('');
  readonly categoriaFiltro = signal<CategoriaFiltro>('TODOS');
  readonly rcaTabelaFiltro = signal('TODOS');
  readonly sortField = signal<SortField>('dataOrcamento');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  // Filtro do Dashboard Gerencial
  readonly rcaDashboardFiltro = signal('TODOS');

  readonly isSupervisor = computed(() => {
    const rcasUnicos = new Set(this.orcamentos().map((o) => o.rcaCodigo));
    const user = (this.authService.currentUser() || '').toLowerCase();
    return rcasUnicos.size > 1 || user === 'supervisor' || user === 'david';
  });

  // Dados filtrados para o Dashboard (Supervisor pode filtrar por RCA específico ou ver consolidado)
  readonly orcamentosDashboard = computed(() => {
    const filtroRca = this.rcaDashboardFiltro();
    if (!this.isSupervisor() || filtroRca === 'TODOS') {
      return this.orcamentos();
    }
    return this.orcamentos().filter((o) => o.rcaCodigo === filtroRca);
  });

  readonly kpiEmNegociacao = computed(() =>
    this.orcamentosDashboard()
      .filter((o) => o.status === 'EM_NEGOCIACAO')
      .reduce((acc, o) => acc + o.valorTotal, 0)
  );

  readonly kpiQtdAbertos = computed(() =>
    this.orcamentosDashboard().filter((o) => o.status === 'EM_NEGOCIACAO').length
  );

  readonly kpiFechado = computed(() =>
    this.orcamentosDashboard()
      .filter((o) => o.status === 'FECHADO')
      .reduce((acc, o) => acc + o.valorTotal, 0)
  );

  readonly kpiQtdFechados = computed(() =>
    this.orcamentosDashboard().filter((o) => o.status === 'FECHADO').length
  );

  readonly kpiPerdido = computed(() =>
    this.orcamentosDashboard()
      .filter((o) => o.status === 'PERDIDO')
      .reduce((acc, o) => acc + o.valorTotal, 0)
  );

  readonly kpiQtdPerdidos = computed(() =>
    this.orcamentosDashboard().filter((o) => o.status === 'PERDIDO').length
  );

  readonly kpiConversao = computed(() => {
    const fechados = this.kpiQtdFechados();
    const perdidos = this.kpiQtdPerdidos();
    const total = fechados + perdidos;
    return total === 0 ? 0 : Math.round((fechados * 100) / total);
  });

  readonly kpiTicketMedio = computed(() => {
    const fechados = this.kpiQtdFechados();
    return fechados === 0 ? 0 : this.kpiFechado() / fechados;
  });

  readonly performancePorRca = computed<RcaPerformance[]>(() => {
    const mapa = new Map<string, RcaPerformance>();

    for (const o of this.orcamentos()) {
      let item = mapa.get(o.rcaCodigo);
      if (!item) {
        item = {
          codigo: o.rcaCodigo,
          nome: o.rcaNome,
          meta: o.rcaMetaMensal || 250000,
          emNegociacao: 0,
          fechado: 0,
          perdido: 0,
          qtdFechados: 0,
          qtdPerdidos: 0,
          qtdAbertos: 0,
          conversao: 0,
          atingimentoMeta: 0
        };
        mapa.set(o.rcaCodigo, item);
      }

      if (o.status === 'EM_NEGOCIACAO') {
        item.emNegociacao += o.valorTotal;
        item.qtdAbertos++;
      } else if (o.status === 'FECHADO') {
        item.fechado += o.valorTotal;
        item.qtdFechados++;
      } else if (o.status === 'PERDIDO') {
        item.perdido += o.valorTotal;
        item.qtdPerdidos++;
      }
    }

    return Array.from(mapa.values())
      .map((r) => {
        const respondidos = r.qtdFechados + r.qtdPerdidos;
        r.conversao = respondidos === 0 ? 0 : Math.round((r.qtdFechados * 100) / respondidos);
        r.atingimentoMeta = r.meta > 0 ? (r.fechado * 100) / r.meta : 0;
        return r;
      })
      .sort((a, b) => b.fechado - a.fechado);
  });

  readonly perdasPorMotivo = computed(() => {
    const mapa = new Map<string, { motivo: string; qtd: number; valor: number }>();
    for (const o of this.orcamentosDashboard().filter((x) => x.status === 'PERDIDO')) {
      const key = o.motivoPerda || 'OUTRO';
      const atual = mapa.get(key) || { motivo: key, qtd: 0, valor: 0 };
      atual.qtd++;
      atual.valor += o.valorTotal;
      mapa.set(key, atual);
    }
    return Array.from(mapa.values()).sort((a, b) => b.valor - a.valor);
  });

  readonly perdasPorConcorrente = computed(() => {
    const mapa = new Map<string, { concorrente: string; qtd: number; valor: number }>();
    for (const o of this.orcamentosDashboard().filter((x) => x.status === 'PERDIDO' && x.concorrente)) {
      const key = (o.concorrente || '').toUpperCase();
      const atual = mapa.get(key) || { concorrente: o.concorrente!, qtd: 0, valor: 0 };
      atual.qtd++;
      atual.valor += o.valorTotal;
      mapa.set(key, atual);
    }
    return Array.from(mapa.values()).sort((a, b) => b.valor - a.valor);
  });

  // Tabela com filtros estilo Excel
  readonly orcamentosFiltrados = computed(() => {
    const texto = this.buscaTexto().trim().toLowerCase();
    const cat = this.categoriaFiltro();
    const rcaFiltro = this.rcaTabelaFiltro();
    const campo = this.sortField();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;

    return this.orcamentos()
      .filter((o) => {
        if (rcaFiltro !== 'TODOS' && o.rcaCodigo !== rcaFiltro) return false;

        if (cat === 'NAO_RESPONDIDOS' && o.status !== 'EM_NEGOCIACAO') return false;
        if (cat === 'RESPONDIDOS' && o.status === 'EM_NEGOCIACAO') return false;
        if (cat === 'FECHADO' && o.status !== 'FECHADO') return false;
        if (cat === 'PERDIDO' && o.status !== 'PERDIDO') return false;

        if (texto) {
          const alvo = `${o.clienteRazaoSocial} ${o.numeroPedido || ''} ${o.observacao || ''} ${o.rcaNome}`.toLowerCase();
          if (!alvo.includes(texto)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const valA = a[campo];
        const valB = b[campo];

        if (typeof valA === 'number' || typeof valB === 'number') {
          return ((Number(valA) || 0) - (Number(valB) || 0)) * dir;
        }
        return String(valA || '').localeCompare(String(valB || ''), 'pt-BR') * dir;
      });
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

  toggleSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set(field === 'valorTotal' || field === 'margemLucro' || field === 'dataOrcamento' ? 'desc' : 'asc');
    }
  }

  sortIndicator(field: SortField): string {
    if (this.sortField() !== field) return '↕';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  resetarFiltros(): void {
    this.buscaTexto.set('');
    this.categoriaFiltro.set('TODOS');
    this.rcaTabelaFiltro.set('TODOS');
    this.sortField.set('dataOrcamento');
    this.sortDirection.set('desc');
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

  limparBaseAnterior(): void {
    if (!confirm('Tem certeza que deseja apagar TODOS os orçamentos importados da base antes de subir uma nova planilha?')) {
      return;
    }
    this.orcamentoService.clearAll().subscribe({
      next: (res) => {
        this.importFeedback.set(res.mensagem);
        this.loadOrcamentos();
      },
      error: () => {
        this.importFeedback.set('Apenas supervisores podem limpar a base de orçamentos.');
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

  abrirModalObs(orcamento: OrcamentoResponse): void {
    this.orcamentoObsSelecionado.set(orcamento);
    this.observacaoInput = orcamento.observacao || '';
  }

  fecharModalObs(): void {
    this.orcamentoObsSelecionado.set(null);
  }

  salvarObservacao(): void {
    const alvo = this.orcamentoObsSelecionado();
    if (!alvo) return;

    this.orcamentoService.updateObservation(alvo.id, this.observacaoInput).subscribe(() => {
      this.fecharModalObs();
      this.loadOrcamentos();
    });
  }
}
