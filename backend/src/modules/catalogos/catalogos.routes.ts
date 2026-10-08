import { z } from 'zod';
import { crearCrud } from '../../utils/crudFactory';

export const zonasRoutes = crearCrud('zonas', z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  municipio: z.string().min(2).max(100),
  activa: z.boolean().optional(),
}), 'nombre');

export const tiposFugaRoutes = crearCrud('tipos_fuga', z.object({
  nombre: z.string().min(3).max(80),
  descripcion: z.string().max(255).optional(),
}), 'nombre');

export const cuadrillasRoutes = crearCrud('cuadrillas', z.object({
  nombre: z.string().min(3).max(100),
  telefono: z.string().max(20).optional(),
  zona_id: z.number().int().positive().nullable().optional(),
  disponible: z.boolean().optional(),
}), 'nombre');