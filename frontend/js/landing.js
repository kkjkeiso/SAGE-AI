/* SAGE AI — landing.js: mockup chat e atualização de CTAs */

document.addEventListener('DOMContentLoaded', () => {

  /* Inicia reveal e nav */
  initReveal();
  initNav();

  /* --- Cenários do mockup de chat --- */
  const chatScenarios = [
    [
      { type: 'user', text: 'Sage, me explica o que é fotossíntese de um jeito simples?' },
      { type: 'sage', text: 'Claro! É o processo que as plantas usam para <b>transformar luz do sol em energia</b>.<br><br>Elas absorvem CO₂ e água, e devolvem oxigênio para nós. 🌱' },
    ],
    [
      { type: 'user', text: 'Qual a diferença entre "there", "their" e "they\'re"?' },
      { type: 'sage', text: '<b>there</b> = lugar ("over there")<br><b>their</b> = posse ("their house")<br><b>they\'re</b> = they are ("they\'re cool")<br><br>Dica: substitua por "they are" — se fizer sentido, é <b>they\'re</b>!' },
    ],
    [
      { type: 'user', text: 'Me ajuda a entender porcentagem? Tipo, 30% de 200.' },
      { type: 'sage', text: 'Fácil! Basta multiplicar:<br><br><b>200 × 0,30 = 60</b><br><br>Então 30% de 200 é <b>60</b>. A dica é dividir a % por 100 e multiplicar. 📊' },
    ],
  ];

  /* Renderiza cenário com delay escalonado */
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
        requestAnimationFrame(() => el.classList.add('visible'));
        body.scrollTop = body.scrollHeight;
      }, 600 + i * 2200);
    });
  }

  let currScenario = 0;
  runScenario(currScenario);

  /* Rotaciona cenários a cada 8s */
  setInterval(() => {
    const body = document.getElementById('mockupBody');
    if (!body) return;

    Array.from(body.children).forEach(child => child.style.opacity = '0');

    setTimeout(() => {
      currScenario = (currScenario + 1) % chatScenarios.length;
      runScenario(currScenario);
    }, 400);
  }, 8000);

  /* --- Atualiza CTAs se o usuário já estiver logado --- */
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
    if (ctaEyebrow) ctaEyebrow.innerHTML = 'Sua próxima aula começa agora.';

    const ctaTitle = document.getElementById('ctaTitle');
    if (ctaTitle) ctaTitle.innerHTML = 'Pronto para seguir em diante?';

    const ctaActions = document.getElementById('ctaActions');
    if (ctaActions) ctaActions.innerHTML = '<a href="frontend/html/app.html" class="btn btn--primary">Continuar agora</a>';
  }

});
