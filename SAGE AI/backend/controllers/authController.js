/* ================================
   controllers/authController.js
   Registro, login, perfil
   Senhas em hex criptografado (AES-256-CTR)
   ================================ */
import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { db, encrypt, decrypt, encryptFields, decryptFields } from '../services/db.js';

const JWT_SECRET  = process.env.JWT_SECRET  || 'dev_secret';
const SENSITIVE    = ['email'];          // campos criptografados no banco
const HASH_FIELD   = 'passwordHex';     // senha: SHA-256 → hex

/* Gera hash hex da senha (SHA-256) */
function hashPassword(plain) {
  return createHash('sha256').update(plain + JWT_SECRET).digest('hex');
}

/* ---- REGISTER ---- */
export async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: 'Preencha todos os campos' });

  if (password.length < 8)
    return res.status(400).json({ message: 'Senha deve ter no mínimo 8 caracteres' });

  /* checa email duplicado (comparando cifrado) */
  const emailEnc = encrypt(email.toLowerCase().trim());
  const users    = db.all('users');
  const exists   = users.some(u => {
    try { return decrypt(u.email) === email.toLowerCase().trim(); } catch { return false; }
  });

  if (exists) return res.status(409).json({ message: 'E-mail já cadastrado' });

  const user = {
    id:          uuid(),
    name:        name.trim(),
    email:       emailEnc,            // criptografado
    passwordHex: hashPassword(password), // hash hex
    plan:        'free',
    createdAt:   new Date().toISOString(),
  };

  db.insert('users', user);

  const token = jwt.sign(
    { id: user.id, name: user.name, plan: user.plan },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email, plan: user.plan },
  });
}

/* ---- LOGIN ---- */
export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'E-mail e senha obrigatórios' });

  const users = db.all('users');
  const user  = users.find(u => {
    try { return decrypt(u.email) === email.toLowerCase().trim(); } catch { return false; }
  });

  if (!user || user.passwordHex !== hashPassword(password))
    return res.status(401).json({ message: 'E-mail ou senha incorretos' });

  const token = jwt.sign(
    { id: user.id, name: user.name, plan: user.plan },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    user: { id: user.id, name: user.name, email, plan: user.plan },
  });
}

/* ---- ME ---- */
export async function me(req, res) {
  const user = db.findOne('users', 'id', req.user.id);
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

  let email = user.email;
  try { email = decrypt(user.email); } catch {}

  return res.json({
    id:   user.id,
    name: user.name,
    email,
    plan: user.plan,
  });
}
