/* ================================
   SAGE AI — app.js
   Chat, sidebar, perfil e interações
   ================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ================================
     AUTH STATE — Sidebar Guest vs User
     ================================ */
  const sidebarGuest = document.getElementById('sidebarGuest');
  const sidebarUser  = document.getElementById('sidebarUser');

  function updateSidebarAuth() {
    if (Auth.isLoggedIn()) {
      const user = Auth.getUser();
      sidebarGuest.style.display = 'none';
      sidebarUser.classList.add('visible');

      /* Preencher avatar com iniciais */
      const avatar = document.getElementById('userAvatar');
      const name   = user?.name || 'Usuário';
      const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
      avatar.textContent = initials;

      /* Preencher nome e email */
      document.getElementById('userNameDisplay').textContent = name.split(' ')[0];
      document.getElementById('userEmailDisplay').textContent = user?.email || '';

      /* Preencher modal de perfil */
      document.getElementById('profileAvatar').textContent = initials;
      document.getElementById('profileName').textContent = name;
      document.getElementById('profileEmail').textContent = user?.email || '—';
      document.getElementById('profileJoined').textContent = new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      loadSidebarSessions();
    } else {
      sidebarGuest.style.display = 'flex';
      sidebarUser.classList.remove('visible');
    }
  }

  /* ================================
     CHAT STATE & HISTORY
     ================================ */
  let currentSessionId = null;
  const chatHistoryList = document.getElementById('chatHistoryList');

  async function loadSidebarSessions() {
    if (!chatHistoryList) return;
    try {
      const sessions = await Http.get('/chat/sessions');
      chatHistoryList.innerHTML = '';
      
      sessions.forEach(session => {
        const btn = document.createElement('button');
        btn.className = 'sidebar__link';
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path></svg>
          <span class="truncate">${session.title || 'Nova Conversa'}</span>
        `;
        btn.addEventListener('click', () => {
          loadSessionMessages(session.id);
          // Update active class
          document.querySelectorAll('#chatHistoryList .sidebar__link').forEach(el => el.classList.remove('active'));
          btn.classList.add('active');
        });
        chatHistoryList.appendChild(btn);
      });
    } catch (err) {
      console.error("Erro ao carregar histórico", err);
    }
  }

  async function loadSessionMessages(sessionId) {
    currentSessionId = sessionId;
    const chatHistoryBox = document.getElementById('eqChatHistoryBox');
    const chatEmpty      = document.getElementById('chatEmpty');
    
    // Clear chat area
    const messages = chatHistoryBox.querySelectorAll('.bot-msg, .user-msg, .typing-indicator');
    messages.forEach(msg => msg.remove());

    try {
      const history = await Http.get(`/chat/sessions/${sessionId}/messages`);
      if (history.length > 0) {
        if (chatEmpty) chatEmpty.style.display = 'none';
        history.forEach(msg => {
          addMessage(msg.content, msg.role === 'user');
        });
      } else {
        if (chatEmpty) chatEmpty.style.display = 'flex';
      }
    } catch (err) {
      console.error("Erro ao carregar mensagens da sessão", err);
    }
  }

  updateSidebarAuth();

  /* ================================
     USER DROPDOWN MENU
     ================================ */
  const userMenuBtn  = document.getElementById('userMenuBtn');
  const userDropdown = document.getElementById('userDropdown');

  if (userMenuBtn) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('open');
    });

    document.addEventListener('click', () => {
      userDropdown.classList.remove('open');
    });
  }

  /* ================================
     PROFILE MODAL
     ================================ */
  const profileModal = document.getElementById('profileModal');
  const btnProfile   = document.getElementById('btnProfile');
  const modalClose   = document.getElementById('modalClose');

  function openModal()  { profileModal.classList.add('open'); }
  function closeModal() { profileModal.classList.remove('open'); }

  if (btnProfile)  btnProfile.addEventListener('click', openModal);
  if (modalClose)  modalClose.addEventListener('click', closeModal);

  profileModal?.addEventListener('click', (e) => {
    if (e.target === profileModal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  /* ================================
     LOGOUT
     ================================ */
  const btnLogout   = document.getElementById('btnLogout');
  const modalLogout = document.getElementById('modalLogout');

  function logout() {
    Auth.clear();
    window.location.href = 'login.html';
  }

  if (btnLogout)   btnLogout.addEventListener('click', logout);
  if (modalLogout) modalLogout.addEventListener('click', logout);

  /* ================================
     SIDEBAR — Mobile toggle + Desktop hover collapse
     ================================ */
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const sidebar   = document.getElementById('sidebar');

  if (window.innerWidth > 768) {
    sidebar.classList.add('collapsed');
  }

  sidebar.addEventListener('mouseenter', () => {
    if (window.innerWidth > 768) sidebar.classList.remove('collapsed');
  });

  sidebar.addEventListener('mouseleave', () => {
    if (window.innerWidth > 768 && !sidebar.hasAttribute('data-hold-open')) {
      sidebar.classList.add('collapsed');
    }
  });

  if (mobileBtn && sidebar) {
    mobileBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

    document.addEventListener('click', (e) => {
      if (
        window.innerWidth <= 768 &&
        !sidebar.contains(e.target) &&
        !mobileBtn.contains(e.target) &&
        sidebar.classList.contains('open')
      ) {
        sidebar.classList.remove('open');
      }
    });
  }

  /* ================================
     CHAT — Core elements
     ================================ */
  const btnSendChat    = document.getElementById('btnEqSendChat');
  const chatInput      = document.getElementById('SAGEAIchatInput');
  const chatHistoryBox = document.getElementById('eqChatHistoryBox');
  const chatEmpty      = document.getElementById('chatEmpty');

  /* ================================
     NEW CHAT — Clear conversation
     ================================ */
  const btnNewChat = document.getElementById('btnNewChat');

  if (btnNewChat) {
    btnNewChat.addEventListener('click', () => {
      currentSessionId = null;
      document.querySelectorAll('#chatHistoryList .sidebar__link').forEach(el => el.classList.remove('active'));
      /* Remove all messages from chat history */
      const messages = chatHistoryBox.querySelectorAll('.bot-msg, .user-msg, .typing-indicator');
      messages.forEach(msg => msg.remove());

      /* Show empty state again */
      if (chatEmpty) {
        chatEmpty.style.display = 'flex';
      }

      /* Clear and focus input */
      if (chatInput) {
        chatInput.value = '';
        chatInput.style.height = 'auto';
        chatInput.focus();
      }
    });
  }

  /* ================================
     CHAT — Empty state chips
     ================================ */
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (prompt && chatInput) {
        chatInput.value = prompt;
        chatInput.focus();
        autoResize();
      }
    });
  });

  /* ================================
     CHAT — Auto-resize textarea
     ================================ */
  function autoResize() {
    if (!chatInput) return;
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 160) + 'px';
  }

  if (chatInput) {
    chatInput.addEventListener('input', autoResize);
  }

  /* ================================
     CHAT — Add message
     ================================ */
  const addMessage = (text, isUser = false) => {
    /* Hide empty state on first message */
    if (chatEmpty) chatEmpty.style.display = 'none';

    const div = document.createElement('div');
    div.className = isUser ? 'user-msg' : 'bot-msg';
    div.innerHTML = `
      <span class="${isUser ? 'user-icon' : 'bot-icon'}">
        ${isUser
          ? (Auth.getUser()?.name?.[0]?.toUpperCase() || 'U')
          : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>'
        }
      </span>
      <div class="bubble">${text}</div>
    `;
    chatHistoryBox.appendChild(div);
    chatHistoryBox.scrollTop = chatHistoryBox.scrollHeight;
  };

  /* ================================
     CHAT — Typing indicator
     ================================ */
  function showTyping() {
    const el = document.createElement('div');
    el.className = 'typing-indicator';
    el.id = 'typingIndicator';
    el.innerHTML = `
      <span class="bot-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
      </span>
      <div class="typing-dots"><span></span><span></span><span></span></div>
    `;
    chatHistoryBox.appendChild(el);
    chatHistoryBox.scrollTop = chatHistoryBox.scrollHeight;
  }

  function hideTyping() {
    document.getElementById('typingIndicator')?.remove();
  }

  /* ================================
     CHAT — Send message
     ================================ */
  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(text, true);
    chatInput.value = '';
    chatInput.style.height = 'auto';

    /* Show typing */
    showTyping();
    btnSendChat.disabled = true;

    try {
      const data = await Http.post(API.CHAT, { 
        message: text,
        sessionId: currentSessionId
      });
      hideTyping();
      btnSendChat.disabled = false;
      addMessage(data.reply);
      
      if (!currentSessionId && data.sessionId) {
        currentSessionId = data.sessionId;
        loadSidebarSessions(); // Recarrega a barra lateral para exibir a nova conversa
      }
    } catch (err) {
      hideTyping();
      btnSendChat.disabled = false;
      addMessage(
        `⚠️ <i>Erro ao conectar com a SAGE AI: ${err.message || 'Servidor indisponível'}. Verifique se o backend está rodando.</i>`
      );
    }
  }

  if (btnSendChat && chatInput) {
    btnSendChat.addEventListener('click', sendMessage);

    /* Enter para enviar (Shift+Enter para nova linha) */
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  /* ================================
     PLACEHOLDER ANIMADO
     ================================ */
  if (chatInput) {
    const examples = [
      "Envie uma mensagem para SAGE AI...",
      "Ex: \"Sage, qual a diferença entre 'muy' e 'mucho'?\"",
      "Ex: \"Sage, como centralizo uma div no CSS?\"",
      "Ex: \"Sage, qual a fórmula de Bhaskara?\"",
    ];
    let extIdx = 0;

    function typeWriterEffect() {
      if (chatInput.value.trim() !== '') return;
      extIdx = (extIdx + 1) % examples.length;
      const text = examples[extIdx];
      let i = 0;
      chatInput.setAttribute('placeholder', '');

      const interval = setInterval(() => {
        if (chatInput.value.trim() !== '') { clearInterval(interval); return; }
        chatInput.setAttribute('placeholder', text.substring(0, i + 1));
        i++;
        if (i === text.length) clearInterval(interval);
      }, 30);
    }

    /* Start the first effect after a short delay, then cycle */
    setTimeout(typeWriterEffect, 2000);
    setInterval(typeWriterEffect, 6000);
  }

});
