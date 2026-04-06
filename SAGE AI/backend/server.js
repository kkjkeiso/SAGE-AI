import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes    from './routes/auth.js';
import chatRoutes    from './routes/chat.js';
import contentRoutes from './routes/content.js';
import { authMiddleware } from './middleware/auth.js';

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
console.log('OpenAI key carregada:', !!process.env.OPENAI_API_KEY);
console.log('Anthropic key carregada:', !!process.env.ANTHROPIC_API_KEY);

/* ---- ROTAS PÚBLICAS ---- */
app.use('/api/auth', authRoutes);

/* ---- ROTAS PROTEGIDAS (JWT) ---- */
app.use('/api/chat',    authMiddleware, chatRoutes);
app.use('/api/content', authMiddleware, contentRoutes);

/* ---- ROTA GUEST (sem auth, uso limitado) ---- */
app.use('/api/guest', chatRoutes);

app.get('/', (_, res) => res.json({ status: 'SAGE AI online' }));

app.listen(PORT, () => console.log(`SAGE AI rodando em http://localhost:${PORT}`));