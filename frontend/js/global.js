/* ================================
   EQUALITY — global.js
   Auth state, config da API e utilitários compartilhados
   ================================ */

/* ================================
   CONFIG DA API
   Trocar BASE pela URL real do back-end quando disponível
   ================================ */
const API = {
  BASE:     'http://localhost:3000/api',
  LOGIN:    '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT:   '/auth/logout',
  ME:       '/auth/me',
  CHAT:     '/chat',
  HISTORY:  '/chat/history',
};

/* ================================
   AUTH
   Gerencia token e dados do usuário via localStorage/sessionStorage
   ================================ */
const Auth = {
  TOKEN_KEY: 'sage_token',
  USER_KEY:  'sage_user',

  /* Retorna o token salvo, independente do storage utilizado */
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY)
        || sessionStorage.getItem(this.TOKEN_KEY);
  },

  /* Retorna o objeto do usuário salvo, ou null se inválido */
  getUser() {
    const raw = localStorage.getItem(this.USER_KEY)
             || sessionStorage.getItem(this.USER_KEY);
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  },

  /* Retorna true se houver um token ativo */
  isLoggedIn() {
    return !!this.getToken();
  },

  /* Persiste token e usuário. Se remember=true usa localStorage (permanente) */
  save(token, user, remember = false) {
    const store = remember ? localStorage : sessionStorage;
    store.setItem(this.TOKEN_KEY, token);
    store.setItem(this.USER_KEY, JSON.stringify(user));
  },

  /* Remove token e usuário de ambos os storages */
  clear() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
  },

  /* Redireciona para o chat se o usuário já estiver logado (usar no topo de login/register) */
  redirectIfLoggedIn() {
    if (this.isLoggedIn()) window.location.href = 'chat.html';
  },

  /* Redireciona para login se o usuário não estiver logado (opcional — permite guest) */
  redirectIfGuest(to = '../html/login.html') {
    if (!this.isLoggedIn()) window.location.href = to;
  },
};

/* ================================
   HTTP
   Wrapper de fetch com injeção automática de token e tratamento de erros
   ================================ */
const Http = {
  async request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };

    /* Injeta token de autorização se disponível */
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(API.BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    /* Tenta parsear JSON; se falhar retorna objeto vazio */
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Erro desconhecido');
    return data;
  },

  get(path)        { return this.request('GET',    path); },
  post(path, body) { return this.request('POST',   path, body); },
  put(path, body)  { return this.request('PUT',    path, body); },
  del(path)        { return this.request('DELETE', path); },
};

/* ================================
   UTILITÁRIOS
   ================================ */

/* Retorna horário atual formatado como HH:MM */
function now() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/* ================================
   REVEAL (animação de entrada por scroll)
   Observa elementos com .reveal e adiciona .visible ao entrar na viewport
   ================================ */
function initReveal() {
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          /* Escalonamento suave: cada elemento atrasa 80ms a mais que o anterior */
          setTimeout(() => entry.target.classList.add('visible'), i * 80);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ================================
   NAV
   Efeito de scroll na navbar + toggle do menu mobile (hamburguer)
   ================================ */
function initNav() {
  const nav       = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  /* Adiciona .scrolled à nav ao rolar mais de 10px */
  window.addEventListener('scroll', () => {
    nav?.classList.toggle('scrolled', window.scrollY > 10);
  });

  /* Abre/fecha o menu mobile ao clicar no hamburguer */
  hamburger?.addEventListener('click', () => {
    navLinks?.classList.toggle('open');
  });
}

/* ================================
   THEME TOGGLE
   Aplica o tema salvo no carregamento e alterna ao clicar no botão
   ================================ */
function initTheme() {
  /* Aplica tema salvo, ou dark como padrão */
  const saved = localStorage.getItem('eq_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);

  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('eq_theme', next);
  });
}

/* Aplica o tema imediatamente ao carregar o script, evitando flash de tema errado */
initTheme();

/* ================================
   MOCKUP PLACEHOLDER (landing — animação de digitação)
   Rotaciona frases no placeholder do mockup com efeito typewriter
   ================================ */
function initMockupRotation() {
  const mockPlace = document.querySelector('.mockup__placeholder');
  if (!mockPlace) return;

  const variations = [
    'Simplifique este texto para mim...',
    'Traduza isto a partir deste contexto...',
    'Converta minha fala em libras...',
  ];

  let i = 0;

  setInterval(() => {
    i = (i + 1) % variations.length;
    const text = variations[i];
    let j = 0;

    mockPlace.textContent = '';
    mockPlace.style.opacity = '1';

    /* Efeito typewriter: adiciona um caractere a cada 35ms */
    const interval = setInterval(() => {
      mockPlace.textContent = text.substring(0, j + 1);
      j++;
      if (j === text.length) clearInterval(interval);
    }, 35);
  }, 4000);
}

document.addEventListener('DOMContentLoaded', () => {
  initMockupRotation();
});
