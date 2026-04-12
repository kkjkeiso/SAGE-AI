/* ================================
   EQUALITY — auth.js
   Login e Register
   ================================ */

/* ================================
   LOGIN
   ================================ */
function initLoginPage() {
  /* Redireciona para o chat se já estiver logado */
  Auth.redirectIfLoggedIn();

  const form      = document.getElementById('loginForm');
  const btnText   = document.getElementById('loginBtnText');
  const spinner   = document.getElementById('loginSpinner');
  const formError = document.getElementById('formError');
  const toggleBtn = document.getElementById('togglePass');
  const passInput = document.getElementById('password');

  /* Alterna visibilidade da senha */
  toggleBtn?.addEventListener('click', () => {
    passInput.type = passInput.type === 'password' ? 'text' : 'password';
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const email    = document.getElementById('email').value.trim();
    const password = passInput.value;
    const remember = document.getElementById('remember')?.checked || false;

    /* Validação de campos */
    let valid = true;
    if (!email || !email.includes('@'))   { showFieldError('emailErr', 'E-mail inválido'); valid = false; }
    if (!password || password.length < 6) { showFieldError('passErr',  'Senha muito curta'); valid = false; }
    if (!valid) return;

    setLoading(true, btnText, spinner);
    try {
      const data = await Http.post(API.LOGIN, { email, password });
      Auth.save(data.token, data.user, remember);
      window.location.href = 'chat.html';
    } catch (err) {
      showFormError(formError, err.message || 'E-mail ou senha incorretos');
    } finally {
      setLoading(false, btnText, spinner);
    }
  });
}

/* ================================
   REGISTER
   ================================ */
function initRegisterPage() {
  /* Redireciona para o chat se já estiver logado */
  Auth.redirectIfLoggedIn();

  const form         = document.getElementById('registerForm');
  const btnText      = document.getElementById('registerBtnText');
  const spinner      = document.getElementById('registerSpinner');
  const formError    = document.getElementById('formError');
  const toggleBtn    = document.getElementById('togglePass');
  const passInput    = document.getElementById('password');
  const confirmInput = document.getElementById('confirmPassword');

  /* Atualiza barra de força da senha em tempo real */
  passInput?.addEventListener('input', () => {
    const strength = getStrength(passInput.value);
    const fill     = document.getElementById('strengthFill');
    const label    = document.getElementById('strengthLabel');
    if (!fill || !label) return;

    const map = [
      { w: '0%',   color: 'transparent', text: '' },
      { w: '33%',  color: '#e05252',     text: 'Fraca' },
      { w: '66%',  color: '#d4a017',     text: 'Média' },
      { w: '100%', color: '#3DBA7A',     text: 'Forte' },
    ];

    fill.style.width      = map[strength].w;
    fill.style.background = map[strength].color;
    label.textContent     = map[strength].text;
  });

  /* Alterna visibilidade da senha */
  toggleBtn?.addEventListener('click', () => {
    passInput.type = passInput.type === 'password' ? 'text' : 'password';
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const name     = document.getElementById('name').value.trim();
    const email    = document.getElementById('email').value.trim();
    const password = passInput.value;
    const confirm  = confirmInput.value;
    const terms    = document.getElementById('terms')?.checked ?? false;

    /* Validação de campos */
    let valid = true;
    if (!name || name.length < 2)         { showFieldError('nameErr',    'Nome muito curto'); valid = false; }
    if (!email || !email.includes('@'))   { showFieldError('emailErr',   'E-mail inválido'); valid = false; }
    if (!password || password.length < 8) { showFieldError('passErr',    'Mínimo 8 caracteres'); valid = false; }
    if (password !== confirm)             { showFieldError('confirmErr', 'Senhas não coincidem'); valid = false; }
    if (!terms)                           { showFormError(formError,     'Aceite os termos para continuar'); valid = false; }
    if (!valid) return;

    setLoading(true, btnText, spinner);
    try {
      const data = await Http.post(API.REGISTER, { name, email, password });
      Auth.save(data.token, data.user, false);
      window.location.href = 'chat.html';
    } catch (err) {
      showFormError(formError, err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false, btnText, spinner);
    }
  });
}

/* ================================
   HELPERS
   ================================ */

/* Exibe/oculta o spinner do botão de submit */
function setLoading(on, btnText, spinner) {
  btnText.style.display = on ? 'none' : 'inline';
  spinner.classList.toggle('active', on);
}

/* Exibe mensagem de erro em um campo específico e marca o input com .error */
function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
  const input = el?.previousElementSibling?.querySelector('input')
             || el?.closest('.field')?.querySelector('input');
  input?.classList.add('error');
}

/* Exibe o banner de erro global do formulário */
function showFormError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.add('active');
}

/* Limpa todos os erros de campo e o banner global */
function clearErrors() {
  document.querySelectorAll('.field__error').forEach(el => el.textContent = '');
  document.querySelectorAll('input.error').forEach(el => el.classList.remove('error'));
  const fe = document.getElementById('formError');
  if (fe) fe.classList.remove('active');
}

/* Calcula força da senha: 0 (vazia) → 1 (fraca) → 2 (média) → 3 (forte) */
function getStrength(val) {
  if (!val) return 0;
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
  if (/[0-9]/.test(val) && /[^A-Za-z0-9]/.test(val)) score++;
  return score;
}

/* ================================
   AUTO-INVOCAÇÃO
   Detecta a página atual pelo formulário presente e inicializa a função correta.
   Substitui os scripts inline que foram removidos do HTML.
   ================================ */
if (document.getElementById('loginForm'))    initLoginPage();
if (document.getElementById('registerForm')) initRegisterPage();
