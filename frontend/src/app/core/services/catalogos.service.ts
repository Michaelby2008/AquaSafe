import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Paginado } from '../models/models';

export type Recurso = 'zonas' | 'tipos-fuga' | 'cuadrillas';

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api`;

  listar<T>(recurso: Recurso, filtros: { q?: string; page?: number; limit?: number } = {}) {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== '') params = params.set(clave, String(valor));
    }
    return this.http.get<Paginado<T>>(`${this.base}/${recurso}`, { params });
  }

  crear(recurso: Recurso, datos: object) {
    return this.http.post<{ id: number; mensaje: string }>(`${this.base}/${recurso}`, datos);
  }

  actualizar(recurso: Recurso, id: number, datos: object) {
    return this.http.put<{ mensaje: string }>(`${this.base}/${recurso}/${id}`, datos);
  }

  eliminar(recurso: Recurso, id: number) {
    return this.http.delete<{ mensaje: string }>(`${this.base}/${recurso}/${id}`);
  }
}