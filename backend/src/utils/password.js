import bcrypt from 'bcryptjs';
import { env } from '../config/environment.js';

export async function hashPassword(password) {
  return bcrypt.hash(password, env.SECURITY.BCRYPT_ROUNDS);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
