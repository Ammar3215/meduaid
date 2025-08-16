import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // Try to get token from Authorization header first (primary method), then fallback to cookies
  let token: string | undefined;
  let tokenSource = '';
  
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
    tokenSource = 'Bearer header';
  }
  
  // Fallback to cookie if no Authorization header
  if (!token) {
    token = req.cookies?.jwt;
    if (token) {
      tokenSource = 'httpOnly cookie';
    }
  }
  
  if (!token) {
    console.log(`[AUTH] No token found - User-Agent: ${req.get('User-Agent')}, IP: ${req.ip}, Path: ${req.path}`);
    res.status(401).json({ 
      message: 'Authentication required. Please log in again.',
      error: 'NO_TOKEN',
      details: 'No authentication token found in request headers or cookies'
    });
    return;
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string };
    (req as any).user = { id: decoded.id, role: decoded.role };
    console.log(`[AUTH] Success - User: ${decoded.id}, Role: ${decoded.role}, Source: ${tokenSource}, Path: ${req.path}`);
    next();
  } catch (err) {
    const errorType = err instanceof jwt.TokenExpiredError ? 'EXPIRED_TOKEN' : 
                     err instanceof jwt.JsonWebTokenError ? 'INVALID_TOKEN' : 'TOKEN_ERROR';
    
    console.log(`[AUTH] Failed - Error: ${errorType}, Source: ${tokenSource}, User-Agent: ${req.get('User-Agent')}, IP: ${req.ip}, Path: ${req.path}`);
    
    res.status(401).json({ 
      message: errorType === 'EXPIRED_TOKEN' ? 'Your session has expired. Please log in again.' : 
               'Invalid authentication token. Please log in again.',
      error: errorType,
      details: err instanceof Error ? err.message : 'Token verification failed'
    });
  }
}; 