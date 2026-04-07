/* ================================
   services/aiRouter.js
   Roteador de IAs da SAGE:
   1. Cohere  — RAG: busca conteúdo nos PDFs/textos
   2. Claude  — raciocínio profundo e respostas complexas
   3. GPT     — geração de exercícios e explicações
   4. Gemini  — mapas mentais (futuro)
   ================================ */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir       = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dir, '../data/content');

/* ================================
   GPT — resposta e exercícios
   ================================ */
async function gptReply(message, intent) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const systemPrompt = intent === 'exercise'
      ? 'Você é a SAGE AI, tutora de ensino básico e médio brasileiro. Gere exercícios claros com enunciado, alternativas (A-D) e gabarito comentado.'
      : 'Você é a SAGE AI, tutora inteligente de ensino básico e médio brasileiro. Seja claro, didático e amigável. Use exemplos do cotidiano.';

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model:      'gpt-4o-mini',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: message },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.log('GPT erro status:', res.status);
    console.log('GPT erro body:', JSON.stringify(err));
    return null;
  }

  const data = await res.json();
  return { text: data.choices?.[0]?.message?.content, via: 'gpt' };
}

/* ================================
   CLAUDE — raciocínio
   ================================ */
async function claudeReply(message) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         key,
      'anthropic-version': '2023-06-01',
      'Content-Type':      'application/json',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-5',
      max_tokens: 1024,
      system:     'Você é a SAGE AI, tutora inteligente de ensino básico e médio brasileiro. Seja claro, didático e amigável. Use exemplos do cotidiano.',
      messages:   [{ role: 'user', content: message }],
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.log('Claude erro status:', res.status);
    console.log('Claude erro body:', JSON.stringify(err));
    return null;
  }

  const data = await res.json();
  console.log('Claude respondeu ok');
  return { text: data.content?.[0]?.text, via: 'claude' };
}

/* ================================
   COHERE — RAG
   ================================ */
async function cohereRAG(message) {
  const key       = process.env.COHERE_API_KEY;
  const documents = loadDocuments();
  if (!key || !documents.length) return null;

  const res = await fetch('https://api.cohere.com/v1/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model:     'command-r-plus',
      message,
      documents: documents.slice(0, 20),
      preamble:  'Você é a SAGE AI, tutora de ensino básico e médio brasileiro. Use apenas os documentos fornecidos para responder.',
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return { text: data.text, via: 'cohere-rag' };
}

/* ================================
   GEMINI — mapa mental
   ================================ */
async function geminiMindMap(topic) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Crie um mapa mental em JSON para: "${topic}". Formato: { "center": "...", "branches": [{ "label": "...", "children": ["..."] }] }` }] }],
        }),
      }
  );

  if (!res.ok) return null;
  const data = await res.json();
  const raw  = data.candidates?.[0]?.content?.parts?.[0]?.text;
  try {
    return { mindMap: JSON.parse(raw.replace(/```json|```/g, '').trim()), via: 'gemini' };
  } catch { return null; }
}

/* ================================
   ROTEADOR PRINCIPAL
   ================================ */
export async function route(message, intent = 'explain') {
  /* mapa mental → Gemini */
  if (intent === 'mindmap') {
    const r = await geminiMindMap(message);
    if (r) return r;
  }

  /* RAG com Cohere se houver documentos */
  const rag = await cohereRAG(message);
  if (rag?.text) return rag;

  /* GPT como principal */
  const gpt = await gptReply(message, intent);
  if (gpt?.text) return gpt;

  /* Claude como fallback */
  const claude = await claudeReply(message);
  if (claude?.text) return claude;

  return { text: 'Estou com dificuldade de acessar meus recursos agora. Tente novamente.', via: 'error' };
}

/* ================================
   DETECTA INTENÇÃO
   ================================ */
export function detectIntent(message) {
  const m = message.toLowerCase();
  if (/exerc[ií]cio|questão|praticar|treinar|teste|quiz/.test(m)) return 'exercise';
  if (/mapa mental|esquema|resumo visual|diagrama/.test(m))        return 'mindmap';
  return 'explain';
}

/* ================================
   CARREGA DOCUMENTOS
   ================================ */
function loadDocuments() {
  if (!existsSync(CONTENT_DIR)) return [];
  const index = join(CONTENT_DIR, 'index.json');
  if (!existsSync(index)) return [];
  try {
    const list = JSON.parse(readFileSync(index, 'utf8'));
    return list.map(item => ({ id: item.id, title: item.title, snippet: item.content?.slice(0, 500) || '' }));
  } catch { return []; }
}

/* isInGrade exportado como true sempre — filtro desativado por ora */
export function isInGrade() { return true; }