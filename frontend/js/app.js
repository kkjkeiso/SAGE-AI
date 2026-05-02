/* SAGE AI — app.js: chat, sidebar, perfil e interações */

document.addEventListener('DOMContentLoaded', () => {

  /* --- Sidebar: alterna guest vs user logado --- */
  const sidebarGuest    = document.getElementById('sidebarGuest');
  const sidebarUser     = document.getElementById('sidebarUser');
  const sidebarBranding = document.getElementById('sidebarBranding');

  async function updateSidebarAuth() {
    const isLogged = Auth.isLoggedIn();
    document.documentElement.setAttribute('data-auth', isLogged ? 'true' : 'false');

    if (isLogged) {
      let user = Auth.getUser();
      const avatar   = document.getElementById('userAvatar');
      const profileAvatar    = document.getElementById('profileAvatar');
      const profileAvatarImg = document.getElementById('profileAvatarImg');

      /* Busca dados atualizados do backend (inclui foto de perfil) */
      try {
        const freshUser = await Http.get('/auth/me');
        if (freshUser) user = { ...user, ...freshUser };
      } catch (e) { /* usa dados locais se falhar */ }

      const name     = user?.displayName || user?.name || 'Usuário';
      const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

      /* Preenche avatar com foto ou iniciais */
      if (user?.profilePictureUrl) {
        avatar.innerHTML = `<img src="${user.profilePictureUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        profileAvatarImg.src = user.profilePictureUrl;
        profileAvatarImg.style.display = 'block';
        profileAvatar.style.display = 'none';
      } else {
        avatar.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
        profileAvatarImg.style.display = 'none';
        profileAvatar.style.display = 'flex';
        profileAvatar.textContent = initials;
      }

      /* Preenche sidebar e modal */
      document.getElementById('userNameDisplay').textContent = name.split(' ')[0];
      document.getElementById('userEmailDisplay').textContent = user?.email || '';
      document.getElementById('profileName').textContent = name;
      const realNameEl = document.getElementById('profileRealName');
      if (realNameEl) realNameEl.textContent = user?.name || '—';
      document.getElementById('profileUsernameDisplay').textContent = '@' + (user?.username || 'usuario');
      document.getElementById('profileEmail').textContent = user?.email || '—';
      document.getElementById('profileJoined').textContent = new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    }
    loadSidebarSessions();
  }

  /* --- ChatService: abstrai API e guest localStorage --- */
  const ChatService = {
    async getSessions() {
      if (Auth.isLoggedIn()) return await Http.get('/chat/sessions');
      return JSON.parse(localStorage.getItem('sage_guest_sessions') || '[]');
    },

    async getMessages(sessionId) {
      if (Auth.isLoggedIn()) return await Http.get(`/chat/sessions/${sessionId}/messages`);
      const sessions = JSON.parse(localStorage.getItem('sage_guest_sessions') || '[]');
      const session = sessions.find(s => s.id === sessionId);
      return session ? session.messages : [];
    },

    async sendMessage(text, currentSessionId, imageBase64) {
      const payload = { message: text, sessionId: currentSessionId };
      if (imageBase64) payload.image = imageBase64;

      const data = await Http.post(API.CHAT, payload);

      /* Usuário logado: sessão gerenciada pelo backend */
      if (Auth.isLoggedIn()) {
        return { sessionId: data.sessionId, reply: data.reply, isNew: !currentSessionId && !!data.sessionId };
      }

      /* Guest: salva no localStorage */
      let sessions = JSON.parse(localStorage.getItem('sage_guest_sessions') || '[]');
      let isNew = false;
      let sessionId = currentSessionId;

      if (!sessionId) {
        sessionId = 'guest_' + Date.now();
        isNew = true;
        sessions.unshift({
          id: sessionId,
          title: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
          messages: []
        });
      }

      const idx = sessions.findIndex(s => s.id === sessionId);
      if (idx !== -1) {
        sessions[idx].messages.push({ role: 'user', content: text });
        sessions[idx].messages.push({ role: 'bot', content: data.reply });
        localStorage.setItem('sage_guest_sessions', JSON.stringify(sessions));
      }

      return { sessionId, reply: data.reply, isNew };
    }
  };

  /* --- Histórico: carrega sessões na sidebar --- */
  let currentSessionId = null;
  const chatHistoryList = document.getElementById('chatHistoryList');

  async function loadSidebarSessions() {
    if (!chatHistoryList) return;
    try {
      const sessions = await ChatService.getSessions();
      chatHistoryList.innerHTML = '';

      sessions.forEach(session => {
        const btn = document.createElement('button');
        btn.className = 'sidebar__link';
        if (session.id === currentSessionId) btn.classList.add('active');
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path></svg>
          <span class="truncate">${session.title || 'Nova Conversa'}</span>
        `;
        btn.addEventListener('click', () => {
          loadSessionMessages(session.id);
          document.querySelectorAll('#chatHistoryList .sidebar__link').forEach(el => el.classList.remove('active'));
          btn.classList.add('active');
        });
        chatHistoryList.appendChild(btn);
      });

      const profileConversations = document.getElementById('profileConversations');
      if (profileConversations) profileConversations.textContent = sessions.length;
    } catch (err) {
      console.error("Erro ao carregar histórico", err);
    }
  }

  /* Carrega mensagens de uma sessão específica */
  async function loadSessionMessages(sessionId) {
    currentSessionId = sessionId;
    const chatHistoryBox = document.getElementById('eqChatHistoryBox');
    const chatEmpty      = document.getElementById('chatEmpty');

    chatHistoryBox.querySelectorAll('.bot-msg, .user-msg, .typing-indicator').forEach(msg => msg.remove());

    try {
      const history = await ChatService.getMessages(sessionId);
      if (history.length > 0) {
        if (chatEmpty) chatEmpty.style.display = 'none';
        history.forEach(msg => addMessage(msg.content, msg.role === 'user'));
      } else {
        if (chatEmpty) chatEmpty.style.display = 'flex';
      }
    } catch (err) {
      console.error("Erro ao carregar mensagens da sessão", err);
    }
  }

  updateSidebarAuth();

  /* --- Clique no avatar abre modal de perfil --- */
  if (sidebarUser) {
    sidebarUser.addEventListener('click', () => openModal());
  }

  /* --- Modal de perfil --- */
  const profileModal = document.getElementById('profileModal');
  const modalClose   = document.getElementById('modalClose');

  function openModal()  { profileModal.classList.add('open'); }
  function closeModal() { profileModal.classList.remove('open'); }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  profileModal?.addEventListener('click', (e) => { if (e.target === profileModal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  /* --- Edição de perfil --- */
  const btnEditProfile        = document.getElementById('btnEditProfile');
  const btnSaveProfile        = document.getElementById('btnSaveProfile');
  const btnCancelEdit         = document.getElementById('btnCancelEdit');
  const profileNameInput      = document.getElementById('profileNameInput');
  const profileUsernameInput  = document.getElementById('profileUsernameInput');
  const btnChoosePic          = document.getElementById('btnChoosePic');
  const profilePicFileInput   = document.getElementById('profilePicFileInput');
  const profileName           = document.getElementById('profileName');
  const profileUsernameDisplay = document.getElementById('profileUsernameDisplay');
  const profileEditMessage    = document.getElementById('profileEditMessage');
  const profileAvatarImg      = document.getElementById('profileAvatarImg');
  const profileAvatar         = document.getElementById('profileAvatar');

  let newProfilePicBase64 = null;

  /* Escolher foto de perfil */
  if (btnChoosePic && profilePicFileInput) {
    btnChoosePic.addEventListener('click', () => profilePicFileInput.click());

    profilePicFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        /* Redimensiona a imagem para max 128x128 antes de salvar */
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 128;
          let w = img.width, h = img.height;
          if (w > h && w > MAX) { h *= MAX / w; w = MAX; }
          else if (h > MAX) { w *= MAX / h; h = MAX; }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          newProfilePicBase64 = canvas.toDataURL('image/jpeg', 0.6);
          profileAvatarImg.src = newProfilePicBase64;
          profileAvatarImg.style.display = 'block';
          profileAvatar.style.display = 'none';
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* Botão editar: mostra campos de nome, username e foto */
  if (btnEditProfile) {
    btnEditProfile.addEventListener('click', () => {
      const user = Auth.getUser();
      if (!user) return;

      btnEditProfile.style.display = 'none';
      btnSaveProfile.style.display = 'inline-block';
      btnCancelEdit.style.display = 'inline-block';
      /* Mostra input de nome de exibição */
      profileName.style.display = 'none';
      profileNameInput.style.display = 'block';
      profileNameInput.value = user.displayName || user.name || '';
      /* Mostra input de username */
      profileUsernameDisplay.style.display = 'none';
      profileUsernameInput.style.display = 'block';
      profileUsernameInput.value = user.username || '';
      btnChoosePic.style.display = 'block';
      newProfilePicBase64 = user.profilePictureUrl || null;
      profileEditMessage.textContent = '';
    });
  }

  /* Botão cancelar: restaura exibição normal */
  if (btnCancelEdit) {
    btnCancelEdit.addEventListener('click', () => {
      btnEditProfile.style.display = 'inline-block';
      btnSaveProfile.style.display = 'none';
      btnCancelEdit.style.display = 'none';
      /* Restaura nome */
      profileName.style.display = 'block';
      profileNameInput.style.display = 'none';
      /* Restaura username */
      profileUsernameDisplay.style.display = 'block';
      profileUsernameInput.style.display = 'none';
      btnChoosePic.style.display = 'none';
      profilePicFileInput.value = '';
      profileEditMessage.textContent = '';

      const user = Auth.getUser();
      if (user?.profilePictureUrl) {
        profileAvatarImg.src = user.profilePictureUrl;
        profileAvatarImg.style.display = 'block';
        profileAvatar.style.display = 'none';
      } else {
        profileAvatarImg.style.display = 'none';
        profileAvatar.style.display = 'flex';
      }
    });
  }

  /* Botão salvar perfil */
  if (btnSaveProfile) {
    btnSaveProfile.addEventListener('click', async () => {
      btnSaveProfile.disabled = true;
      profileEditMessage.style.color = 'var(--text-muted)';
      profileEditMessage.textContent = 'Salvando...';

      const payload = {
        displayName: profileNameInput.value.trim(),
        username: profileUsernameInput.value.trim()
      };
      if (newProfilePicBase64 !== null) {
        payload.profilePictureUrl = newProfilePicBase64;
      }

      try {
        const res = await fetch(API.BASE + '/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + Auth.getToken()
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao salvar perfil');

        /* Atualiza cache local (sem foto, ela vem da API) */
        const user = Auth.getUser();
        if (data.displayName) user.displayName = data.displayName;
        user.username = data.username;
        user.profilePictureUrl = '';
        const store = localStorage.getItem(Auth.TOKEN_KEY) ? localStorage : sessionStorage;
        store.setItem(Auth.USER_KEY, JSON.stringify(user));

        updateSidebarAuth();
        btnCancelEdit.click();
        profileEditMessage.style.color = 'var(--success, #28a745)';
        profileEditMessage.textContent = 'Perfil atualizado com sucesso!';
        setTimeout(() => { profileEditMessage.textContent = ''; }, 3000);
      } catch (err) {
        profileEditMessage.style.color = 'var(--danger)';
        profileEditMessage.textContent = err.message;
      } finally {
        btnSaveProfile.disabled = false;
      }
    });
  }

  /* --- Logout --- */
  const btnLogout   = document.getElementById('btnLogout');
  const modalLogout = document.getElementById('modalLogout');

  function logout() {
    Auth.clear();
    window.location.href = '../../index.html';
  }

  if (btnLogout)   btnLogout.addEventListener('click', logout);
  if (modalLogout) modalLogout.addEventListener('click', logout);

  /* --- Sidebar: mobile toggle + desktop hover collapse --- */
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const sidebar   = document.getElementById('sidebar');

  if (window.innerWidth > 768) sidebar.classList.add('collapsed');

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

  /* --- Chat: elementos principais --- */
  const btnSendChat    = document.getElementById('btnEqSendChat');
  const chatInput      = document.getElementById('SAGEAIchatInput');
  const chatHistoryBox = document.getElementById('eqChatHistoryBox');
  const chatEmpty      = document.getElementById('chatEmpty');

  /* --- Nova conversa --- */
  const btnNewChat = document.getElementById('btnNewChat');

  if (btnNewChat) {
    btnNewChat.addEventListener('click', () => {
      currentSessionId = null;
      document.querySelectorAll('#chatHistoryList .sidebar__link').forEach(el => el.classList.remove('active'));
      chatHistoryBox.querySelectorAll('.bot-msg, .user-msg, .typing-indicator').forEach(msg => msg.remove());
      if (chatEmpty) chatEmpty.style.display = 'flex';
      if (chatInput) { chatInput.value = ''; chatInput.style.height = 'auto'; chatInput.focus(); }
    });
  }

  /* --- Chips de sugestão --- */
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (prompt && chatInput) { chatInput.value = prompt; chatInput.focus(); autoResize(); }
    });
  });

  /* --- Auto-resize do textarea --- */
  function autoResize() {
    if (!chatInput) return;
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 160) + 'px';
  }

  if (chatInput) chatInput.addEventListener('input', autoResize);

  /* --- Adiciona mensagem ao chat --- */
  const addMessage = (text, isUser = false) => {
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

  /* --- Indicador de digitação --- */
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

  /* --- Enviar mensagem --- */
  let currentImageBase64 = null;

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text && !currentImageBase64) return;

    const displayMessage = text || "Anexo enviado";
    addMessage(displayMessage, true);

    chatInput.value = '';
    chatInput.style.height = 'auto';

    const imageToSend = currentImageBase64;
    currentImageBase64 = null;
    document.getElementById('chatInputPreview').style.display = 'none';
    document.getElementById('chatInputPreview').innerHTML = '';

    showTyping();
    btnSendChat.disabled = true;

    try {
      const data = await ChatService.sendMessage(text, currentSessionId, imageToSend);
      hideTyping();
      btnSendChat.disabled = false;
      addMessage(data.reply);

      if (data.isNew) currentSessionId = data.sessionId;
      loadSidebarSessions();
    } catch (err) {
      hideTyping();
      btnSendChat.disabled = false;
      addMessage(`⚠️ <i>Erro ao conectar com a SAGE AI: ${err.message || 'Servidor indisponível'}. Verifique se o backend está rodando.</i>`);
    }
  }

  if (btnSendChat && chatInput) {
    btnSendChat.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
  }

  /* --- Placeholder animado --- */
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

    setTimeout(typeWriterEffect, 2000);
    setInterval(typeWriterEffect, 6000);
  }

  /* --- Anexo de imagem --- */
  const btnAttachment    = document.getElementById('btnAttachment');
  const btnMicrophone    = document.getElementById('btnMicrophone');
  const fileAttachment   = document.getElementById('fileAttachment');
  const chatInputPreview = document.getElementById('chatInputPreview');

  if (btnAttachment && fileAttachment) {
    btnAttachment.addEventListener('click', () => fileAttachment.click());

    fileAttachment.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          /* Redimensiona para max 1024px */
          const canvas = document.createElement('canvas');
          let width = img.width, height = img.height;
          const MAX_SIZE = 1024;
          if (width > height && width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          else if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          currentImageBase64 = canvas.toDataURL('image/jpeg', 0.8);

          chatInputPreview.style.display = 'flex';
          chatInputPreview.innerHTML = `
            <img src="${currentImageBase64}" alt="Anexo">
            <span class="preview-text">${file.name}</span>
            <button class="preview-close" title="Remover anexo">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          `;
          chatInputPreview.querySelector('.preview-close').addEventListener('click', () => {
            fileAttachment.value = '';
            currentImageBase64 = null;
            chatInputPreview.style.display = 'none';
            chatInputPreview.innerHTML = '';
          });
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* --- Gravação de áudio --- */
  let mediaRecorder;
  let audioChunks = [];
  let isRecording = false;

  if (btnMicrophone) {
    btnMicrophone.addEventListener('click', async () => {
      if (!isRecording) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream);
          audioChunks = [];

          mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
          mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

            chatInputPreview.style.display = 'flex';
            chatInputPreview.innerHTML = `
              <div class="recording-pulse" style="background:var(--green);animation:none;"></div>
              <span class="preview-text" style="color:var(--green);">Processando áudio (Groq Whisper)...</span>
            `;
            chatInput.value = "Processando áudio...";
            chatInput.disabled = true;

            try {
              const formData = new FormData();
              formData.append('file', audioBlob, 'audio.webm');

              const res = await fetch(API.BASE + '/chat/audio', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + (Auth.getToken() || '') },
                body: formData
              });

              if (!res.ok) throw new Error('Falha na transcrição');
              const data = await res.json();

              chatInput.value = data.text;
              chatInput.disabled = false;
              chatInputPreview.style.display = 'none';
            } catch (err) {
              console.error(err);
              chatInput.disabled = false;
              chatInput.value = "";
              chatInputPreview.innerHTML = `
                <span class="preview-text" style="color:var(--danger);">Erro ao transcrever áudio.</span>
                <button class="preview-close" title="Remover"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
              `;
              chatInputPreview.querySelector('.preview-close').addEventListener('click', () => {
                chatInputPreview.style.display = 'none';
              });
            }
          };

          mediaRecorder.start();
          isRecording = true;
          btnMicrophone.classList.add('btn-recording');

          chatInputPreview.style.display = 'flex';
          chatInputPreview.innerHTML = `
            <div class="recording-pulse"></div>
            <span class="preview-text" style="color:var(--danger);">Gravando áudio...</span>
          `;
        } catch (err) {
          alert('Erro ao acessar o microfone: ' + err.message);
        }
      } else {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        isRecording = false;
        btnMicrophone.classList.remove('btn-recording');
      }
    });
  }

});
