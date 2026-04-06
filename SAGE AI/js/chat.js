/* ================================
   SAGE AI — chat.js (atualizado)
   Sidebar funcional + integração real com back-end
   ================================ */

const chatState = { sessionId: null, messages: [], isTyping: false };

const messagesEl    = document.getElementById('messages');
const inputEl       = document.getElementById('chatInput');
const sendBtn       = document.getElementById('sendBtn');
const chatList      = document.getElementById('chatList');
const sidebarEl     = document.getElementById('sidebar');
const overlay       = document.getElementById('sidebarOverlay');
const sidebarUser   = document.getElementById('sidebarUser');
const guestCta      = document.getElementById('guestCta');
const logoutBtn     = document.getElementById('logoutBtn');
const newChatBtn    = document.getElementById('newChat');
const sidebarToggle = document.getElementById('sidebarToggle');

(function init() {
  setupUserArea();
  setupInput();
  setupSidebar();
  loadHistory();
})();

function setupSidebar() {
  sidebarToggle?.addEventListener('click', toggleSidebar);
  overlay?.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSidebar(); });
  newChatBtn?.addEventListener('click', startNewChat);
}

function toggleSidebar() {
  sidebarEl.classList.contains('open') ? closeSidebar() : openSidebar();
}
function openSidebar()  { sidebarEl.classList.add('open'); overlay.classList.add('open'); }
function closeSidebar() { sidebarEl.classList.remove('open'); overlay.classList.remove('open'); }

function setupUserArea() {
  const user = Auth.getUser();
  if (user) {
    const initials = user.name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase();
    sidebarUser.innerHTML = `<div class="user-info"><div class="user-avatar">${initials}</div><div><div class="user-name">${user.name}</div><div class="user-plan">Plano ${user.plan||'free'}</div></div></div>`;
    guestCta.style.display  = 'none';
    logoutBtn.style.display = 'flex';
  }
  logoutBtn?.addEventListener('click', () => { Auth.clear(); window.location.href = '../index.html'; });
}

function setupInput() {
  inputEl?.addEventListener('input', () => {
    sendBtn.disabled = !inputEl.value.trim();
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 160) + 'px';
  });
  inputEl?.addEventListener('keydown', (e) => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); if (!sendBtn.disabled) sendMessage(); } });
  sendBtn?.addEventListener('click', sendMessage);
}

function useChip(btn) { inputEl.value = btn.textContent; sendBtn.disabled = false; sendMessage(); }

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text || chatState.isTyping) return;
  hideWelcome();
  appendBubble('user', text);
  inputEl.value = ''; inputEl.style.height = 'auto'; sendBtn.disabled = true;
  const typing = showTyping();
  chatState.isTyping = true;
  try {
    const { reply, sessionId } = await fetchReply(text);
    if (sessionId) chatState.sessionId = sessionId;
    removeTyping(typing);
    appendBubble('sage', reply);
    if (Auth.isLoggedIn()) saveToHistoryUI(text);
  } catch { removeTyping(typing); appendBubble('sage', 'Ops, algo deu errado. Tente novamente.'); }
  finally { chatState.isTyping = false; }
}

async function fetchReply(message) {
  const token    = Auth.getToken();
  const endpoint = token ? `${API.BASE}${API.CHAT}` : `${API.BASE}/guest`;
  const headers  = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(endpoint, { method:'POST', headers, body: JSON.stringify({ message, sessionId: chatState.sessionId||null }) });
  if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.message||'Erro na API'); }
  return res.json();
}

async function loadHistory() {
  if (!Auth.isLoggedIn()) return;
  try {
    const res  = await fetch(`${API.BASE}${API.HISTORY}`, { headers: { 'Authorization': `Bearer ${Auth.getToken()}` } });
    const data = await res.json();
    renderHistory(data.chats||[]);
  } catch {}
}

function renderHistory(chats) {
  if (!chatList||!chats.length) return;
  chatList.innerHTML = chats.map(c=>`<li class="chat-list__item" data-id="${c.id}"><span class="chat-list__dot"></span>${escapeHtml(c.title)}</li>`).join('');
  chatList.querySelectorAll('.chat-list__item').forEach(item => {
    item.addEventListener('click', () => { chatList.querySelectorAll('.chat-list__item').forEach(i=>i.classList.remove('active')); item.classList.add('active'); loadSessionMessages(item.dataset.id); closeSidebar(); });
  });
}

async function loadSessionMessages(sessionId) {
  try {
    const res  = await fetch(`${API.BASE}${API.CHAT}/session/${sessionId}`, { headers: { 'Authorization': `Bearer ${Auth.getToken()}` } });
    const data = await res.json();
    messagesEl.innerHTML = '';
    data.messages?.forEach(m => appendBubble(m.role==='user'?'user':'sage', m.content));
    chatState.sessionId = sessionId;
  } catch {}
}

function saveToHistoryUI(text) {
  if (!chatList) return;
  if (!chatList.querySelector(`[data-id="${chatState.sessionId}"]`)) {
    const li = document.createElement('li');
    li.className = 'chat-list__item active'; li.dataset.id = chatState.sessionId||'';
    li.innerHTML = `<span class="chat-list__dot"></span>${escapeHtml(text.slice(0,40))}`;
    chatList.querySelectorAll('.chat-list__item').forEach(i=>i.classList.remove('active'));
    chatList.prepend(li);
  }
}

function startNewChat() {
  chatState.messages=[]; chatState.sessionId=null;
  messagesEl.innerHTML=`<div class="welcome" id="welcome"><div class="welcome__logo">SAGE <span>AI</span></div><h2>O que há para hoje?</h2><p>Pode perguntar qualquer coisa — como uma conversa mesmo.</p><div class="welcome__chips"><button class="chip" onclick="useChip(this)">O que é fotossíntese?</button><button class="chip" onclick="useChip(this)">Como funciona a Lei de Newton?</button><button class="chip" onclick="useChip(this)">Me dê um exercício de matemática</button><button class="chip" onclick="useChip(this)">Explique a Segunda Guerra Mundial</button></div></div>`;
  chatList?.querySelectorAll('.chat-list__item').forEach(i=>i.classList.remove('active'));
  closeSidebar();
}

function appendBubble(type, text) {
  const div = document.createElement('div'); div.className=`bubble bubble--${type}`;
  div.innerHTML=`<div class="bubble__text">${escapeHtml(text)}</div><span class="bubble__time">${now()}</span>`;
  messagesEl.appendChild(div); scrollBottom();
}
function showTyping()   { const el=document.createElement('div'); el.className='typing'; el.innerHTML='<span></span><span></span><span></span>'; messagesEl.appendChild(el); scrollBottom(); return el; }
function removeTyping(el) { el?.remove(); }
function hideWelcome()    { document.getElementById('welcome')?.remove(); }
function scrollBottom()   { messagesEl.scrollTop=messagesEl.scrollHeight; }
function escapeHtml(str)  { return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
