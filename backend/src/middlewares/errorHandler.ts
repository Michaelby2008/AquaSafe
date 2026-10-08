import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError)
    return res.status(400).json({ mensaje: 'Datos inválidos', errores: err.issues.map(i => ({ campo: i.path.join('.'), mensaje: i.message })) });
  if (err instanceof AppError) return res.status(err.status).json({ mensaje: err.message });
  if (err?.code === 'ER_DUP_ENTRY') return res.status(409).json({ mensaje: 'Ya existe un registro con ese valor' });
  if (err?.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ mensaje: 'No se puede eliminar: tiene registros relacionados' });
  if (err?.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ mensaje: 'Una referencia indicada no existe' });
  if (err?.name === 'MulterError') return res.status(400).json({ mensaje: 'Error al subir el archivo: ' + err.message });
  console.error(err);
  res.status(500).json({ mensaje: 'Error interno del servidor' });
}