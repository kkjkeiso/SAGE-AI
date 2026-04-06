# SAGE AI — Backend

## Setup rápido

```bash
cd sage-backend
npm install
cp .env.example .env
# edite o .env com suas chaves de API
npm run dev
```

## Estrutura

```
sage-backend/
├── server.js                  ← entry point (porta 3000)
├── .env.example               ← copie para .env e preencha
├── routes/
│   ├── auth.js                ← POST /api/auth/register, /login  GET /me
│   ├── chat.js                ← POST /api/chat  GET /history  /session/:id
│   └── content.js             ← GET/POST/DELETE /api/content
├── controllers/
│   ├── authController.js      ← registro/login com hash SHA-256 hex
│   ├── chatController.js      ← roteamento de mensagens + histórico
│   └── contentController.js  ← gerencia PDFs/textos indexados
├── services/
│   ├── db.js                  ← JSON flat DB + criptografia AES-256-CTR hex
│   └── aiRouter.js            ← roteador das IAs (Cohere→Claude→GPT→Gemini)
├── middleware/
│   └── auth.js                ← JWT guard (guest passa sem token)
└── data/
    ├── users/db.json          ← usuários (emails cifrados)
    ├── chats/db.json          ← histórico (mensagens cifradas)
    ├── sessions/db.json       ← sessões de chat
    └── content/index.json     ← índice de conteúdo educacional
```

## Fluxo da IA

```
Pergunta do estudante
  ↓
Verifica grade curricular
  ↓ (dentro)
Detecta intenção: explain | exercise | mindmap
  ├── exercise → GPT-4o-mini (gera 3 questões)
  ├── mindmap  → Gemini (retorna JSON do mapa)
  └── explain  → Cohere RAG (busca nos PDFs)
                   ↓ (sem resultado)
                 Claude Sonnet (raciocínio)
```

## Adicionar conteúdo educacional (PDFs futuros)

```bash
POST /api/content
{
  "title": "Biologia - Célula",
  "subject": "biologia",
  "grade": "ensino médio",
  "content": "texto extraído do PDF..."
}
```

## Segurança

- Senhas: SHA-256 com salt (JWT_SECRET) → hex
- E-mails e mensagens: AES-256-CTR → hex (IV:CIPHERTEXT)
- Auth: JWT com expiração de 7 dias
- Guest: acesso sem token, sem histórico salvo
