import jwt from 'jsonwebtoken';
import { env } from '../config/environment.js';

export function generateToken(payload, expiresIn = env.JWT.EXPIRATION) {
  return jwt.sign(payload, env.JWT.SECRET, { expiresIn });
}

export function generateRefreshToken(userId) {
  return jwt.sign({ userId }, env.JWT.SECRET, { expiresIn: env.JWT.REFRESH_EXPIRATION });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT.SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function decodeToken(token) {
  return jwt.decode(token);
}
