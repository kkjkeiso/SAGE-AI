/* ================================
   controllers/chatController.js
   ================================ */
import { v4 as uuid } from 'uuid';
import { db, encrypt } from '../services/db.js';
import { route, detectIntent, isInGrade } from '../services/aiRouter.js';

/* ---- ENVIAR MENSAGEM ---- */
export async function sendMessage(req, res) {
  const { message, sessionId } = req.body;
  const userId = req.user.id;

  if (!message?.trim())
    return res.status(400).json({ message: 'Mensagem não pode ser vazia' });

  /* detecta intenção e roteia */
  const intent = detectIntent(message);
  const result = await route(message.trim(), intent);

  /* salva no histórico (apenas usuários logados) */
  if (userId !== 'guest') {
    const sid   = sessionId || uuid();
    const entry = {
      id:        uuid(),
      sessionId: sid,
      userId,
      role:      'user',
      content:   encrypt(message.trim()),  // mensagem criptografada
      createdAt: new Date().toISOString(),
    };
    db.insert('chats', entry);
    db.insert('chats', {
      ...entry,
      id:      uuid(),
      role:    'assistant',
      content: encrypt(result.text),
    });

    /* atualiza ou cria sessão */
    const session = db.findOne('sessions', 'id', sid);
    if (!session) {
      db.insert('sessions', {
        id:        sid,
        userId,
        title:     message.trim().slice(0, 48),
        createdAt: new Date().toISOString(),
      });
    }

    return res.json({ reply: result.text, sessionId: sid, via: result.via });
  }

  return res.json({ reply: result.text, via: result.via });
}

/* ---- HISTÓRICO DE SESSÕES ---- */
export async function getHistory(req, res) {
  const userId = req.user.id;
  const sessions = db.find('sessions', 'userId', userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 30);

  return res.json({ chats: sessions });
}

/* ---- MENSAGENS DE UMA SESSÃO ---- */
export async function getSession(req, res) {
  const { sessionId } = req.params;
  const userId        = req.user.id;

  const session = db.findOne('sessions', 'id', sessionId);
  if (!session || session.userId !== userId)
    return res.status(404).json({ message: 'Sessão não encontrada' });

  const { decrypt } = await import('../services/db.js');
  const messages = db.find('chats', 'sessionId', sessionId)
    .map(m => ({
      role:      m.role,
      content:   (() => { try { return decrypt(m.content); } catch { return m.content; } })(),
      createdAt: m.createdAt,
    }));

  return res.json({ session, messages });
}
