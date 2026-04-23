/* ================================
   SAGE AI — landing.js
   ================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* Inicializa animações de reveal por scroll e comportamento da navbar */
  initReveal();
  initNav();

  /* ================================
     MOCK CHAT ROTATION
     Rotaciona cenários de conversa no mockup da landing com animação de entrada
     ================================ */
  const chatScenarios = [
    [
      { type: 'user', text: 'Esse texto tá muito confuso...<br><br>"O preposto almejava deferimento na exordial".' },
      { type: 'sage', text: 'Claro! Que tal:<br><br>"O representante da empresa pediu aprovação no início do processo."' },
    ],
    [
      { type: 'user', text: 'Pode verificar o dashboard que criei pras métricas?' },
      { type: 'sage', text: 'Analisando...<br><br>Atenção: A paleta falhou no Contraste Nível AA.<br>Alt-Text sugerido: "Gráfico de barras indicando alta produtividade".' },
    ],
    [
      { type: 'user', text: 'Preciso transcrever parte de uma reunião técnica agora.' },
      { type: 'sage', text: 'Áudio vinculado ao microfone!<br><br>Sintetizando modelo visual 3D em <b>Libras</b> e transcrevendo destaques de áudio em tempo real.' },
    ],
  ];

  /* Renderiza um cenário no mockup com delay escalonado entre as mensagens */
  function runScenario(scenarioIndex) {
    const body = document.getElementById('mockupBody');
    if (!body) return;

    body.innerHTML = '';
    const scenario = chatScenarios[scenarioIndex];

    scenario.forEach((msg, i) => {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = `msg msg--${msg.type}`;
        el.innerHTML = `${msg.text}<span class="msg__time">${now()}</span>`;
        body.appendChild(el);

        /* Força reflow antes de adicionar .visible para garantir a transição CSS */
        requestAnimationFrame(() => el.classList.add('visible'));
        body.scrollTop = body.scrollHeight;
      }, 600 + i * 2200);
    });
  }

  let currScenario = 0;
  runScenario(currScenario);

  /* A cada 8s faz fade out das mensagens atuais e carrega o próximo cenário */
  setInterval(() => {
    const body = document.getElementById('mockupBody');
    if (!body) return;

    Array.from(body.children).forEach(child => child.style.opacity = '0');

    setTimeout(() => {
      currScenario = (currScenario + 1) % chatScenarios.length;
      runScenario(currScenario);
    }, 400);
  }, 8000);

  /* ================================
     AUTH CTA UPDATE
     Atualiza os botões caso o usuário já esteja logado
     ================================ */
  if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
    const navAuth = document.getElementById('navAuth');
    if (navAuth) {
      navAuth.innerHTML = '<a href="frontend/html/app.html" class="btn btn--primary btn--sm">SAGE AI</a>';
    }

    const heroActions = document.getElementById('heroActions');
    if (heroActions) {
      heroActions.innerHTML = '<a href="frontend/html/app.html" class="btn btn--primary">Aprenda agora com a SAGE AI</a>';
    }

    const ctaEyebrow = document.getElementById('ctaEyebrow');
    if (ctaEyebrow) {
      ctaEyebrow.innerHTML = 'Sua próxima aula começa agora.';
    }

    const ctaTitle = document.getElementById('ctaTitle');
    if (ctaTitle) {
      ctaTitle.innerHTML = 'Pronto para seguir em diante?';
    }

    const ctaActions = document.getElementById('ctaActions');
    if (ctaActions) {
      ctaActions.innerHTML = '<a href="frontend/html/app.html" class="btn btn--primary">Continuar agora</a>';
    }
  }

});
