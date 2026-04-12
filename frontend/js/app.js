/* ================================
   EQUALITY — app.js
   Lógica e mocks do painel de ferramentas
   ================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ================================
     PLACEHOLDER ANIMADO (Simplificador)
     Rotaciona exemplos no placeholder do textarea com efeito typewriter na aba "SAGE AI"
     ================================ */
  const SAGEAIchatInput = document.getElementById('SAGEAIchatInput');
  if (SAGEAIchatInput) {
    const examples = [
      "Ex: \"Sage, qual a diferença entre 'muy' e 'mucho' em espanhol?\"",
      "Ex: \"Sage, como eu centralizo uma div no CSS?\"",
      "Ex: \"Sage, qual a fórmula de Bhaskara mesmo?\"",
    ];
    let extIdx = 0;

    function typeWriterEffect() {
      /* Não sobrepõe o placeholder se o usuário já digitou algo */
      if (SAGEAIchatInput.value.trim() !== '') return;
      extIdx = (extIdx + 1) % examples.length;
      const text = examples[extIdx];
      let i = 0;
      SAGEAIchatInput.setAttribute('placeholder', '');

      const interval = setInterval(() => {
        if (SAGEAIchatInput.value.trim() !== '') { clearInterval(interval); return; }
        SAGEAIchatInput.setAttribute('placeholder', text.substring(0, i + 1));
        i++;
        if (i === text.length) clearInterval(interval);
      }, 35);
    }

    setInterval(typeWriterEffect, 4000);
  }

  /* ================================
     PLACEHOLDER ANIMADO (Simplificador)
     Rotaciona exemplos no placeholder do textarea com efeito typewriter na aba "Sintetizador Neural"
     ================================ */
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    const examples = [
      "Ex: 'O preposto jurídico almejava deferimento na exordial...'",
      "Ex: 'A exacerbação dos sintomas indica intervenção paliativa imediata...'",
      "Ex: 'As diretrizes de compliance sinalizam heurísticas mandatórias...'",
    ];
    let extIdx = 0;

    function typeWriterEffect() {
      /* Não sobrepõe o placeholder se o usuário já digitou algo */
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
      }, 35);
    }

    setInterval(typeWriterEffect, 4000);
  }

  /* ================================
     NOME DO USUÁRIO (sidebar)
     Exibe o primeiro nome salvo localmente, ou "Usuário" como fallback
     ================================ */
  const userNameDisplay = document.getElementById('userNameDisplay');
  if (userNameDisplay) {
    const storedName = localStorage.getItem('eq_tempName');
    userNameDisplay.textContent = storedName?.trim()
      ? storedName.split(' ')[0]
      : 'Usuário';
  }

  /* ================================
     SIDEBAR — Mobile toggle + Desktop hover collapse
     No desktop: recolhe por padrão, expande ao passar o mouse.
     Ao clicar numa aba, mantém aberta por 5s antes de recolher.
     No mobile: abre/fecha pelo botão hamburguer.
     ================================ */
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const sidebar   = document.getElementById('sidebar');
  let tabSwitchTimeout;

  /* Começa recolhida no desktop */
  if (window.innerWidth > 768) {
    sidebar.classList.add('collapsed');
  }

  /* Expande ao passar o mouse (somente desktop) */
  sidebar.addEventListener('mouseenter', () => {
    if (window.innerWidth > 768) sidebar.classList.remove('collapsed');
  });

  /* Recolhe ao tirar o mouse, a menos que esteja "travada aberta" */
  sidebar.addEventListener('mouseleave', () => {
    if (window.innerWidth > 768 && !sidebar.hasAttribute('data-hold-open')) {
      sidebar.classList.add('collapsed');
    }
  });

  if (mobileBtn && sidebar) {
    /* Abre/fecha a sidebar no mobile */
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    /* Fecha a sidebar mobile ao clicar fora dela */
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
     TAB NAVIGATION (SPA estática)
     Alterna entre abas pelo atributo data-target dos botões da sidebar
     ================================ */
  const navItems = document.querySelectorAll('.nav-item');
  const tabs     = document.querySelectorAll('.tab-content');

  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      /* Remove estado ativo de todos os itens e abas */
      navItems.forEach(n => n.classList.remove('active'));
      tabs.forEach(t => t.classList.remove('active'));

      /* Ativa o item clicado e a aba correspondente */
      btn.classList.add('active');
      document.getElementById(btn.getAttribute('data-target')).classList.add('active');

      /* Mobile: fecha a sidebar ao navegar */
      if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }

      /* Desktop: mantém a sidebar aberta por 5s ao clicar numa aba */
      if (window.innerWidth > 768) {
        sidebar.classList.remove('collapsed');
        sidebar.setAttribute('data-hold-open', 'true');

        clearTimeout(tabSwitchTimeout);
        tabSwitchTimeout = setTimeout(() => {
          sidebar.removeAttribute('data-hold-open');
          if (!sidebar.matches(':hover')) sidebar.classList.add('collapsed');
        }, 5000);
      }
    });
  });

  /* ================================
     TAB 0: EQUALITY Copilot (chat central)
     ================================ */
  const btnEqSendChat      = document.getElementById('btnEqSendChat');
  const eqChatInput        = document.getElementById('eqChatInput');
  const eqChatHistoryBox   = document.getElementById('eqChatHistoryBox');
  const btnEqAttach        = document.getElementById('btnEqAttach');
  const btnEqPhoto         = document.getElementById('btnEqPhoto');

  /* Simula anexo de arquivo/foto prefixando o texto do input */
  if (btnEqAttach) btnEqAttach.addEventListener('click', () => {
    eqChatInput.value = '[Arquivo Anexado: relatorio.pdf] ' + eqChatInput.value;
  });
  if (btnEqPhoto) btnEqPhoto.addEventListener('click', () => {
    eqChatInput.value = '[Mídia Anexada: camera_foto.jpg] ' + eqChatInput.value;
  });

  /* Cria e insere uma mensagem no histórico do chat central */
  const addEqChatMsg = (text, isUser = false) => {
    const div = document.createElement('div');
    div.className = isUser ? 'user-msg' : 'bot-msg';
    div.innerHTML = `
      <span class="${isUser ? 'user-icon' : 'bot-icon'}">
        ${isUser
          ? 'U'
          : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>'
        }
      </span>
      <div class="bubble">${text}</div>
    `;
    eqChatHistoryBox.appendChild(div);
    eqChatHistoryBox.scrollTop = eqChatHistoryBox.scrollHeight;
  };

  if (btnEqSendChat && eqChatInput) {
    btnEqSendChat.addEventListener('click', () => {
      const text = eqChatInput.value.trim();
      if (!text) return;

      addEqChatMsg(text, true);
      eqChatInput.value = '';

      /* Feedback visual de processamento */
      const prevText = btnEqSendChat.textContent;
      btnEqSendChat.textContent = 'Processando IA...';
      btnEqSendChat.disabled = true;

      /* Mock: resposta simulada com delay de 3.5s (copilot central é mais lento intencionalmente) */
      setTimeout(() => {
        btnEqSendChat.textContent = prevText;
        btnEqSendChat.disabled = false;
        addEqChatMsg(
          `Esta é uma simulação da Inteligência Central EQUALITY. Roteamos sua solicitação por múltiplos módulos de IAs (análise livre, OCR, TTS Neural).<br><br>
          🚨 <i>Nota do sistema: Funções centrais universais processam o contexto do zero, e por isso levam mais tempo. Se você já sabe que o problema é "somente dislexia" ou "somente visual", utilizar as ferramentas manuais diretas na barra ao lado economiza processamento e é muito mais rápido!</i>`
        );
      }, 3500);
    });
  }

  /* ================================
     TAB 1: Simplificador de Texto (chat)
     ================================ */
  const btnSendChat    = document.getElementById('btnSendChat');
  const chatHistoryBox = document.getElementById('chatHistoryBox');

  /* Cria e insere uma mensagem no histórico do simplificador */
  const addChatMsg = (text, isUser = false) => {
    const div = document.createElement('div');
    div.className = isUser ? 'user-msg' : 'bot-msg';
    div.innerHTML = `
      <span class="${isUser ? 'user-icon' : 'bot-icon'}">${isUser ? 'U' : 'E'}</span>
      <div class="bubble">${text}</div>
    `;
    chatHistoryBox.appendChild(div);
    chatHistoryBox.scrollTop = chatHistoryBox.scrollHeight;
  };

  if (btnSendChat && chatInput) {
    btnSendChat.addEventListener('click', () => {
      const text = chatInput.value.trim();
      if (!text) return;

      addChatMsg(text, true);
      chatInput.value = '';

      /* Feedback visual de processamento */
      const prevText = btnSendChat.textContent;
      btnSendChat.textContent = 'Pensando...';
      btnSendChat.disabled = true;

      /* Mock: resposta simulada com delay de 1.5s */
      setTimeout(() => {
        btnSendChat.textContent = prevText;
        btnSendChat.disabled = false;
        addChatMsg(
          `Esta é uma simulação de processamento de IA. O sistema reescreveria seu texto removendo jargões,
          dividindo parágrafos longos em tópicos diretos e ajustando a cadência verbal para acessibilidade cognitiva Nível AAA.
          <br><br><i>No fluxo real, aqui retornaremos o JSON de resposta da Groq API.</i>`
        );
      }, 1500);
    });
  }

  /* ================================
     TAB 2: Áudio — Transcrição de Microfone (mock)
     ================================ */
  const btnRecord = document.getElementById('btnRecord');
  if (btnRecord) {
    btnRecord.addEventListener('click', () => {
      if (btnRecord.classList.contains('recording')) {
        /* Para a "gravação" e exibe transcrição simulada */
        btnRecord.classList.remove('recording');
        btnRecord.innerHTML = `
          <span class="pulse-ring"></span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          </svg>
          Gravar Microfone
        `;

        /* Substitui o painel placeholder pela transcrição simulada */
        const textPanel = document.querySelector('#tab-audio .text-panel');
        textPanel.classList.remove('placeholder');
        textPanel.innerHTML = `
          <h3 style="margin-bottom: 12px; font-size: 15px; color: var(--white);">Anotações e Transcrição</h3>
          <p style="color: var(--muted); font-size: 14px; line-height: 1.6;">
            <strong>[00:00:00]</strong>: Simulação concluída. Você encerrou a captura de áudio local.<br><br>
            A plataforma Equality enviará posteriormente via WebSocket buffers de áudio curtos para nosso endpoint,
            traduzindo ruídos e falas velozes em texto estruturado formatado com resumos dinâmicos de contexto na tela.
          </p>
        `;
      } else {
        /* Inicia a "gravação" */
        btnRecord.classList.add('recording');
        btnRecord.innerHTML = `
          <span class="pulse-ring"></span>
          Simulando Captação... (Clique para Salvar)
        `;
      }
    });
  }

  /* ================================
     TAB 4: Libras — Sintetizador de Sinais (mock)
     ================================ */
  const btnTranslateLibras = document.getElementById('btnTranslateLibras');
  const librasInput        = document.getElementById('librasInput');
  const avatarBox          = document.querySelector('.avatar-connecting');

  if (btnTranslateLibras && librasInput && avatarBox) {
    btnTranslateLibras.addEventListener('click', () => {
      if (!librasInput.value.trim()) return;

      btnTranslateLibras.disabled = true;
      btnTranslateLibras.textContent = 'Processando NLP...';

      /* Exibe spinner de carregamento do avatar */
      avatarBox.innerHTML = `
        <div class="avatar-spinner"></div>
        <p>Interpretando Glosas de Libras...</p>
      `;

      /* Mock: exibe avatar pronto após 2s */
      setTimeout(() => {
        btnTranslateLibras.textContent = 'Sintetizar Sinais';
        btnTranslateLibras.disabled = false;
        avatarBox.innerHTML = `
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 10px">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
          <p style="color: var(--white); font-weight: 500;">Interface 3D Pronta.</p>
          <p style="font-size: 12px; max-width: 250px; text-align: center; margin-top: 10px; opacity: 0.7;">
            (Simulação de API) Avatar sinalizará estruturação de linguagem espacial traduzida a partir de português neutro.
          </p>
        `;
      }, 2000);
    });
  }

  /* ================================
     TAB 5: Sintetizador Neural TTS (mock)
     ================================ */
  const btnPlayTTS = document.getElementById('btnPlayTTS');
  const ttsWave   = document.getElementById('ttsWave');
  const ttsStatus = document.getElementById('ttsStatus');

  if (btnPlayTTS) {
    btnPlayTTS.addEventListener('click', () => {
      /* Feedback visual de geração de áudio */
      btnPlayTTS.innerHTML = `<div class="avatar-spinner" style="width: 20px; height: 20px;"></div>`;
      ttsStatus.textContent = 'Codificando emoção e inflexão a partir do processamento neural...';

      /* Mock: exibe controles de reprodução após 1.5s */
      setTimeout(() => {
        btnPlayTTS.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        `;
        ttsWave.style.display = 'block';
        ttsStatus.textContent = 'Áudio gerado. Reproduzindo [00:00:00 / 00:02:14]';
      }, 1500);
    });
  }

  /* ================================
     TAB 6: Laboratório Anti-Dislexia
     Modo Biônico: realça alternadamente letras para facilitar leitura focal
     Régua Dinâmica: linha guia que segue o cursor do mouse
     ================================ */
  const btnBionic  = document.getElementById('btnBionicMode');
  const btnRuler   = document.getElementById('btnRulerMode');
  const txtContent = document.getElementById('dyslexiaTextContent');
  const ruler      = document.getElementById('dyslexiaRuler');

  if (btnBionic) {
    let bionic     = false;
    let isRulerOn  = false;

    /* Alterna o modo de leitura biônica */
    btnBionic.addEventListener('click', () => {
      bionic = !bionic;
      btnBionic.textContent = bionic ? 'Desativar Bionic' : 'Espaçamento Biônico';

      if (bionic) {
        /* Texto com realce biônico alternado e espaçamento aumentado */
        txtContent.innerHTML = '<strong>O</strong> qu<strong>e</strong> <strong>é</strong> Le<strong>i</strong>tu<strong>r</strong>a Fo<strong>c</strong>a<strong>l</strong>?<br><br> Es<strong>t</strong>e s<strong>i</strong>st<strong>e</strong>m<strong>a</strong> a<strong>p</strong>l<strong>i</strong>ca e<strong>s</strong>p<strong>a</strong>ç<strong>a</strong>m<strong>e</strong>ntos r<strong>í</strong>g<strong>i</strong>d<strong>o</strong>s r<strong>e</strong>c<strong>o</strong>m<strong>e</strong>n<strong>d</strong>ad<strong>o</strong>s p<strong>o</strong>r t<strong>e</strong>r<strong>a</strong>p<strong>e</strong>ut<strong>a</strong>s v<strong>i</strong>sua<strong>i</strong>s ga<strong>r</strong>a<strong>n</strong>t<strong>i</strong>ndo q<strong>u</strong>e pe<strong>s</strong>s<strong>o</strong>a<strong>s</strong> c<strong>o</strong>m D<strong>é</strong>fic<strong>i</strong>t de A<strong>t</strong>e<strong>n</strong>ç<strong>ã</strong>o e D<strong>i</strong>s<strong>l</strong>e<strong>x</strong>ia m<strong>a</strong>nt<strong>e</strong>n<strong>h</strong>am a re<strong>t</strong>e<strong>n</strong>ç<strong>ã</strong>o m<strong>á</strong>x<strong>i</strong>m<strong>a</strong> de te<strong>x</strong>t<strong>o</strong>, s<strong>e</strong>m "p<strong>u</strong>lar l<strong>i</strong>n<strong>h</strong>as" po<strong>r</strong> e<strong>n</strong>g<strong>a</strong>no.';
        txtContent.style.letterSpacing = '1px';
      } else {
        /* Texto normal sem realce */
        txtContent.innerHTML = '<strong>O que é Leitura Focal?</strong><br><br> Este sistema aplica espaçamentos rígidos recomendados por terapeutas visuais garantindo que pessoas com Déficit de Atenção e Dislexia mantenham a retenção máxima de texto, sem "pular linhas" por engano.';
        txtContent.style.letterSpacing = 'normal';
      }
    });

    /* Alterna a régua dinâmica */
    btnRuler.addEventListener('click', () => {
      isRulerOn = !isRulerOn;
      btnRuler.textContent = isRulerOn ? 'Desativar Régua' : 'Régua Dinâmica';
      ruler.style.display  = isRulerOn ? 'block' : 'none';
    });

    /* Move a régua acompanhando o mouse, travada dentro dos limites da zona de leitura */
    const readZone = document.getElementById('dyslexiaReadZone');
    if (readZone) {
      readZone.addEventListener('mousemove', (e) => {
        if (!isRulerOn) return;
        const rect = readZone.getBoundingClientRect();
        let y = e.clientY - rect.top;
        /* Clamp: impede a régua de vazar as bordas da zona */
        y = Math.max(20, Math.min(y, rect.height - 20));
        ruler.style.top = `${y - 20}px`;
      });
    }
  }

  /* ================================
     TAB 7: Auditor WCAG (mock)
     ================================ */
  const btnAudit      = document.getElementById('btnAuditWCAG');
  const wcagScore     = document.getElementById('wcagScore');
  const wcagItems     = document.getElementById('wcagItems');
  const wcagReportTxt = document.getElementById('wcagReportTxt');

  if (btnAudit) {
    btnAudit.addEventListener('click', () => {
      btnAudit.disabled = true;
      btnAudit.textContent = 'Auditando Pixel a Pixel...';
      wcagScore.textContent = '...';

      /* Mock: exibe relatório após 2s */
      setTimeout(() => {
        wcagScore.textContent = '94';
        wcagScore.style.color = 'var(--green)';
        wcagReportTxt.textContent = 'Relatório Concluído! Achamos 1 problema de contraste, mas o restante está acessível.';

        wcagItems.style.display = 'block';
        wcagItems.innerHTML = `
          <div class="wcag-item"><strong>Alt-Text Gerado:</strong> "Homem sorrindo com cachorro labrador amarelo em gramado verde"</div>
          <div class="wcag-item" style="border-left-color: var(--danger)"><strong>Aviso (Contraste):</strong> Texto da logo na foto não atinge 4.5:1 ratio.</div>
          <div class="wcag-item"><strong>Layout:</strong> Hierarquia aprovada.</div>
        `;

        btnAudit.textContent = 'Auditoria Finalizada';
        btnAudit.classList.replace('btn--primary', 'btn--ghost');
      }, 2000);
    });
  }

  /* ================================
     TAB 8: Motor Facial — controle por olhos (mock)
     ================================ */
  const btnMotor   = document.getElementById('btnMotorCalibrate');
  const motorLabel = document.getElementById('motorLabel');
  const motorCam   = document.getElementById('motorCamBox');

  if (btnMotor) {
    btnMotor.addEventListener('click', () => {
      btnMotor.textContent = 'Iniciando Calibração...';

      setTimeout(() => {
        motorCam.style.background = '#1a1a1a';
        motorLabel.textContent    = 'Detecção Facial LIGADA. Identificando Ponto de Foco...';
        motorLabel.style.color    = 'var(--green)';

        setTimeout(() => {
          btnMotor.textContent    = 'Calibrado com Sucesso.';
          btnMotor.disabled       = true;
          motorLabel.textContent  = 'Controlando cursor pelos olhos. Pisque duas vezes para clicar.';
        }, 3000);
      }, 1000);
    });
  }

});
