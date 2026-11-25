import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MotivoPerda, OrcamentoRequest, OrcamentoResponse } from '../models/teampilot.models';

@Injectable({ providedIn: 'root' })
export class OrcamentoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/orcamentos';

  list() {
    return this.http.get<OrcamentoResponse[]>(this.apiUrl);
  }

  create(payload: OrcamentoRequest) {
    return this.http.post<OrcamentoResponse>(this.apiUrl, payload);
  }

  importFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ importados: number; ignorados: number; mensagem: string }>(
      `${this.apiUrl}/importar`,
      formData
    );
  }

  closeQuote(id: number) {
    return this.http.patch<OrcamentoResponse>(`${this.apiUrl}/${id}/fechar`, {});
  }

  markAsLost(id: number, motivo: MotivoPerda, concorrente?: string) {
    let params = new HttpParams().set('motivo', motivo);
    if (concorrente?.trim()) {
      params = params.set('concorrente', concorrente.trim());
    }
    return this.http.patch<OrcamentoResponse>(`${this.apiUrl}/${id}/perder`, {}, { params });
  }
}
