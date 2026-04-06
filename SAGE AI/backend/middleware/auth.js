/* ================================
   middleware/auth.js
   Verifica JWT — permite guest em rotas /guest
   ================================ */
import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {
  /* rotas /guest passam sem token, mas marcam como guest */
  if (req.path.startsWith('/guest') || req.originalUrl.includes('/guest')) {
    req.user = { id: 'guest', name: 'Visitante', plan: 'guest' };
    return next();
  }

  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: 'Token não fornecido' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
}
