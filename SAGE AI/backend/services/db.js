/* ================================
   services/db.js
   Banco JSON flat com criptografia hex (AES-256-CTR via Node crypto)
   ================================ */
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir  = dirname(fileURLToPath(import.meta.url));
const DB_DIR = join(__dir, '../data');

const ALGO    = 'aes-256-ctr';
const HEX_KEY = process.env.CRYPTO_HEX_KEY || '0'.repeat(64); // 32 bytes em hex = 64 chars
const KEY     = Buffer.from(HEX_KEY.slice(0, 64), 'hex');     // garante 32 bytes

/* ---- CRIPTOGRAFIA HEX ---- */

/**
 * Criptografa uma string e retorna hex: IV:CIPHERTEXT
 */
export function encrypt(text) {
  const iv         = randomBytes(16);
  const cipher     = createCipheriv(ALGO, KEY, iv);
  const encrypted  = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Descriptografa um hex no formato IV:CIPHERTEXT
 */
export function decrypt(hex) {
  const [ivHex, encHex] = hex.split(':');
  const iv       = Buffer.from(ivHex, 'hex');
  const encBuf   = Buffer.from(encHex, 'hex');
  const decipher = createDecipheriv(ALGO, KEY, iv);
  const decrypted = Buffer.concat([decipher.update(encBuf), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Criptografa campos sensíveis de um objeto.
 * @param {object} obj
 * @param {string[]} fields - campos a criptografar
 */
export function encryptFields(obj, fields) {
  const out = { ...obj };
  fields.forEach(f => { if (out[f] !== undefined) out[f] = encrypt(String(out[f])); });
  return out;
}

/**
 * Descriptografa campos sensíveis de um objeto.
 */
export function decryptFields(obj, fields) {
  const out = { ...obj };
  fields.forEach(f => {
    if (out[f] && out[f].includes(':')) {
      try { out[f] = decrypt(out[f]); } catch { /* mantém cifrado se falhar */ }
    }
  });
  return out;
}

/* ---- JSON DB ---- */

function dbPath(collection) {
  const dir = join(DB_DIR, collection);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return join(dir, 'db.json');
}

function readDb(collection) {
  const path = dbPath(collection);
  if (!existsSync(path)) return [];
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return []; }
}

function writeDb(collection, data) {
  writeFileSync(dbPath(collection), JSON.stringify(data, null, 2), 'utf8');
}

/* ---- OPERAÇÕES CRUD ---- */

export const db = {
  /**
   * Retorna todos os registros de uma collection.
   */
  all(collection) {
    return readDb(collection);
  },

  /**
   * Busca por campo:valor exato.
   */
  find(collection, field, value) {
    return readDb(collection).filter(r => r[field] === value);
  },

  /**
   * Retorna o primeiro registro onde campo === valor.
   */
  findOne(collection, field, value) {
    return readDb(collection).find(r => r[field] === value) || null;
  },

  /**
   * Insere um novo registro.
   */
  insert(collection, record) {
    const data = readDb(collection);
    data.push(record);
    writeDb(collection, data);
    return record;
  },

  /**
   * Atualiza registros onde campo === valor.
   */
  update(collection, field, value, changes) {
    const data = readDb(collection).map(r =>
      r[field] === value ? { ...r, ...changes, updatedAt: new Date().toISOString() } : r
    );
    writeDb(collection, data);
  },

  /**
   * Remove registros onde campo === valor.
   */
  delete(collection, field, value) {
    const data = readDb(collection).filter(r => r[field] !== value);
    writeDb(collection, data);
  },
};
