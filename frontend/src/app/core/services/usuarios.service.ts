import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Paginado, Rol, UsuarioAdmin } from '../models/models';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/api/usuarios`;

  listar(filtros: { q?: string; page?: number; limit?: number } = {}) {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== '') params = params.set(clave, String(valor));
    }
    return this.http.get<Paginado<UsuarioAdmin>>(this.api, { params });
  }

  // El backend solo permite cambiar el rol y activar o desactivar (PATCH)
  actualizar(id: number, datos: { rol?: Rol; activo?: boolean }) {
    return this.http.patch<{ mensaje: string }>(`${this.api}/${id}`, datos);
  }
}
