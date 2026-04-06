/* ================================
   SAGE AI — landing.js
   ================================ */

initReveal();
initNav();

/* ---- MOCK CHAT ---- */
const mockMessages = [
  { type: 'user', text: 'O que é fotossíntese?' },
  { type: 'sage', text: 'Fotossíntese é o processo pelo qual plantas convertem luz solar, água e CO₂ em glicose e oxigênio.' },
  { type: 'user', text: 'Mas como isso acontece na prática?' },
  { type: 'sage', text: 'A planta capta a luz com a clorofila. Essa energia transforma água em O₂ e gera ATP. Quer um exercício para fixar?' },
];

function renderMockMessage(msg, delay) {
  const body = document.getElementById('mockupBody');
  if (!body) return;
  setTimeout(() => {
    const el = document.createElement('div');
    el.className = `msg msg--${msg.type}`;
    el.innerHTML = `${msg.text}<span class="msg__time">${now()}</span>`;
    body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));
    body.scrollTop = body.scrollHeight;
  }, delay);
}

mockMessages.forEach((msg, i) => renderMockMessage(msg, 600 + i * 1500));
