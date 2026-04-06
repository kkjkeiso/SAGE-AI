/* ================================
   controllers/contentController.js
   Gerencia conteúdo educacional (PDFs/textos)
   Os PDFs são indexados em /data/content/index.json
   ================================ */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';

const __dir       = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dir, '../data/content');
const INDEX_FILE  = join(CONTENT_DIR, 'index.json');

function readIndex() {
  if (!existsSync(INDEX_FILE)) return [];
  try { return JSON.parse(readFileSync(INDEX_FILE, 'utf8')); } catch { return []; }
}

function writeIndex(data) {
  if (!existsSync(CONTENT_DIR)) mkdirSync(CONTENT_DIR, { recursive: true });
  writeFileSync(INDEX_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/* ---- LISTAR CONTEÚDOS ---- */
export function listContent(req, res) {
  const index = readIndex().map(({ id, title, subject, grade, createdAt }) =>
    ({ id, title, subject, grade, createdAt })
  );
  return res.json({ content: index });
}

/* ---- ADICIONAR CONTEÚDO (texto) ---- */
export function addContent(req, res) {
  const { title, subject, grade, content } = req.body;
  if (!title || !content)
    return res.status(400).json({ message: 'title e content são obrigatórios' });

  const index = readIndex();
  const entry = {
    id:        uuid(),
    title,
    subject:   subject || 'geral',
    grade:     grade   || 'ensino médio',
    content,
    createdAt: new Date().toISOString(),
  };
  index.push(entry);
  writeIndex(index);

  return res.status(201).json({ message: 'Conteúdo adicionado', id: entry.id });
}

/* ---- REMOVER CONTEÚDO ---- */
export function removeContent(req, res) {
  const { id } = req.params;
  const index  = readIndex().filter(c => c.id !== id);
  writeIndex(index);
  return res.json({ message: 'Conteúdo removido' });
}
