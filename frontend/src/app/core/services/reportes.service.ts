import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Estado, Paginado, ReporteDetalle, ReporteResumen } from '../models/models';

export interface FiltrosReportes {
  q?: string;
  estado?: string;
  gravedad?: string;
  zona_id?: string | number;
  orden?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/api/reportes`;

  listar(filtros: FiltrosReportes) {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== null && valor !== '') params = params.set(clave, String(valor));
    }
    return this.http.get<Paginado<ReporteResumen>>(this.api, { params });
  }

  obtener(id: number) {
    return this.http.get<ReporteDetalle>(`${this.api}/${id}`);
  }

  crear(datos: FormData) {
    return this.http.post<{ id: number; mensaje: string }>(this.api, datos);
  }

  actualizar(id: number, datos: Record<string, unknown>) {
    return this.http.put<{ mensaje: string }>(`${this.api}/${id}`, datos);
  }

  eliminar(id: number) {
    return this.http.delete<{ mensaje: string }>(`${this.api}/${id}`);
  }

  // Los dos siguientes los usaremos en el panel del administrador
  cambiarEstado(id: number, estado: Estado, comentario?: string) {
    return this.http.patch<{ mensaje: string }>(`${this.api}/${id}/estado`, { estado, comentario });
  }

  asignar(id: number, cuadrilla_id: number, notas?: string) {
    return this.http.post<{ mensaje: string }>(`${this.api}/${id}/asignar`, { cuadrilla_id, notas });
  }
}