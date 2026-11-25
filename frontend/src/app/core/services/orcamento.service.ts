import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ImportResponse, MotivoPerda, OrcamentoResponse } from '../models/teampilot.models';

@Injectable({ providedIn: 'root' })
export class OrcamentoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/orcamentos';

  list(): Observable<OrcamentoResponse[]> {
    return this.http.get<OrcamentoResponse[]>(this.apiUrl);
  }

  closeQuote(id: number): Observable<OrcamentoResponse> {
    return this.http.patch<OrcamentoResponse>(`${this.apiUrl}/${id}/fechar`, {});
  }

  markAsLost(id: number, motivo: MotivoPerda, concorrente?: string): Observable<OrcamentoResponse> {
    let params = new HttpParams().set('motivo', motivo);
    if (concorrente && concorrente.trim()) {
      params = params.set('concorrente', concorrente.trim());
    }
    return this.http.patch<OrcamentoResponse>(`${this.apiUrl}/${id}/perder`, {}, { params });
  }

  updateObservation(id: number, observacao: string): Observable<OrcamentoResponse> {
    return this.http.patch<OrcamentoResponse>(`${this.apiUrl}/${id}/observacao`, { observacao });
  }

  importFile(file: File): Observable<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportResponse>(`${this.apiUrl}/importar`, formData);
  }

  clearAll(): Observable<{ mensagem: string; removidos: number }> {
    return this.http.delete<{ mensagem: string; removidos: number }>(`${this.apiUrl}/limpar`);
  }
}
