import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';

export interface Payload { id: number; rol: 'ciudadano' | 'administrador'; }

export function auth(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new AppError(401, 'Debes iniciar sesión');
  try {
    (req as any).user = jwt.verify(token, process.env.JWT_SECRET!) as Payload;
    next();
  } catch { throw new AppError(401, 'Sesión inválida o expirada'); }
}

export const permitir = (...roles: Payload['rol'][]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!roles.includes((req as any).user.rol)) throw new AppError(403, 'No tienes permiso');
    next();
  };