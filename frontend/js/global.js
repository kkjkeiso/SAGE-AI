/* ================================
   SAGE AI — global.js
   Auth state, API config, utilitários compartilhados
   ================================ */

/* ---- CONFIG API (trocar quando tiver back-end) ---- */
const API = {
  BASE:     'http://localhost:3000/api',
  LOGIN:    '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT:   '/auth/logout',
  ME:       '/auth/me',
  CHAT:     '/chat',
  HISTORY:  '/chat/history',
};

/* ---- AUTH ---- */
const Auth = {
  TOKEN_KEY: 'sage_token',
  USER_KEY:  'sage_user',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY)
        || sessionStorage.getItem(this.TOKEN_KEY);
  },

  getUser() {
    const raw = localStorage.getItem(this.USER_KEY)
             || sessionStorage.getItem(this.USER_KEY);
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  save(token, user, remember = false) {
    const store = remember ? localStorage : sessionStorage;
    store.setItem(this.TOKEN_KEY, token);
    store.setItem(this.USER_KEY, JSON.stringify(user));
  },

  clear() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
  },

  /* Redireciona para chat se já logado — chamar no topo de login/register */
  redirectIfLoggedIn() {
    if (this.isLoggedIn()) {
      window.location.href = 'chat.html';
    }
  },

  /* Redireciona para login se não logado — opcional no chat (permite guest) */
  redirectIfGuest(to = '../html/login.html') {
    if (!this.isLoggedIn()) {
      window.location.href = to;
    }
  },
};

/* ---- HTTP ---- */
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
    if (!res.ok) throw new Error(data.message || 'Erro desconhecido');
    return data;
  },

  get(path)         { return this.request('GET', path); },
  post(path, body)  { return this.request('POST', path, body); },
  put(path, body)   { return this.request('PUT', path, body); },
  del(path)         { return this.request('DELETE', path); },
};

/* ---- UTILITÁRIOS ---- */
function now() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

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

function initNav() {
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    nav?.classList.toggle('scrolled', window.scrollY > 10);
  });

  hamburger?.addEventListener('click', () => {
    navLinks?.classList.toggle('open');
  });
}
