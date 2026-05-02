/* SAGE AI — global.js: API config, auth, HTTP e utilitários */

/* --- API endpoints --- */
const API = {
  BASE:     'http://localhost:3000/api',
  LOGIN:    '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT:   '/auth/logout',
  ME:       '/auth/me',
  CHAT:     '/chat',
  HISTORY:  '/chat/history',
};

/* --- Auth: gerencia token e dados do usuário --- */
const Auth = {
  TOKEN_KEY: 'sage_token',
  USER_KEY:  'sage_user',

  /* Retorna token salvo */
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY)
        || sessionStorage.getItem(this.TOKEN_KEY)
        || null;
  },

  /* Retorna objeto do usuário */
  getUser() {
    const raw = localStorage.getItem(this.USER_KEY)
             || sessionStorage.getItem(this.USER_KEY);
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  },

  /* Verifica se há token ativo */
  isLoggedIn() {
    return !!this.getToken();
  },

  /* Salva token e usuário (sem foto — ela vem da API sob demanda) */
  save(token, user, remember = false) {
    this.clear();
    const store = remember ? localStorage : sessionStorage;
    store.setItem(this.TOKEN_KEY, token);
    /* Remove foto base64 para não estourar quota do storage */
    const slim = { ...user, profilePictureUrl: '' };
    store.setItem(this.USER_KEY, JSON.stringify(slim));
  },

  /* Limpa token e usuário */
  clear() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
  },
};

/* --- HTTP: fetch wrapper com token automático --- */
const Http = {
  async request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(API.BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    const data = await res.json().catch(() => ({}));

    /* Redireciona ao login se o token expirou */
    if (!res.ok) {
      if (res.status === 401) {
        Auth.clear();
        window.location.href = 'login.html';
        return;
      }
      throw new Error(data.message || 'Erro desconhecido');
    }
    return data;
  },

  get(path)        { return this.request('GET',    path); },
  post(path, body) { return this.request('POST',   path, body); },
  put(path, body)  { return this.request('PUT',    path, body); },
  del(path)        { return this.request('DELETE', path); },
};

/* --- Utilitários --- */

/* Horário atual HH:MM */
function now() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/* --- Reveal: animação de entrada por scroll --- */
function initReveal() {
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 80);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* --- Nav: scroll effect + mobile hamburger --- */
function initNav() {
  const nav       = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    nav?.classList.toggle('scrolled', window.scrollY > 10);
  });

  hamburger?.addEventListener('click', () => {
    navLinks?.classList.toggle('open');
  });
}

/* --- Theme toggle: aplica e alterna dark/light --- */
function initTheme() {
  const saved = localStorage.getItem('sage_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);

  const btn = document.getElementById('themeToggle');
  const btnModal = document.getElementById('themeToggleModal');

  const toggleFn = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('sage_theme', next);
  };

  if (btn) btn.addEventListener('click', toggleFn);
  if (btnModal) btnModal.addEventListener('click', toggleFn);
}

/* Aplica tema imediatamente */
initTheme();

/* --- Mockup placeholder: typewriter na landing --- */
function initMockupRotation() {
  const mockPlace = document.querySelector('.mockup__placeholder');
  if (!mockPlace) return;

  const variations = [
    'Me explique a fórmula de Bhaskara...',
    'Como eu centralizo uma div no CSS?',
    'Qual a diferença entre muy e mucho?',
  ];

  let i = 0;

  setInterval(() => {
    i = (i + 1) % variations.length;
    const text = variations[i];
    let j = 0;

    mockPlace.textContent = '';
    mockPlace.style.opacity = '1';

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
