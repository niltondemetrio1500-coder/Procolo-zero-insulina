import './styles.css';
import { ANALYSIS_STEPS, ASSETS, CHECKOUT_URL, FLOW } from './data.js';

const app = document.querySelector('#app');
const state = { screen: 'intro', step: 0, answers: {}, selections: {}, analysisIndex: 0, planIndex: 0, scratched: false };

// Raspadinha antes da oferta (teste A/B): metade das visitantes ve a raspadinha, metade vai direto para a oferta.
// Forcar uma versao para conferir: ?raspadinha=1 (com) ou ?raspadinha=0 (sem).
const SCRATCH = { pct: 86, anchor: 'R$ 293,80', price: 'R$ 39,90' };
const SCRATCH_KEY = 'raspadinha_ab';
const SHOW_SCRATCH = (() => {
  const forced = new URLSearchParams(window.location.search).get('raspadinha');
  let value = forced === '1' || forced === '0' ? forced : null;
  try {
    if (!value) value = localStorage.getItem(SCRATCH_KEY);
    if (value !== '1' && value !== '0') value = Math.random() < 0.5 ? '1' : '0';
    localStorage.setItem(SCRATCH_KEY, value);
  } catch (e) { if (value !== '1' && value !== '0') value = Math.random() < 0.5 ? '1' : '0'; }
  return value === '1';
})();
const VERSION = SHOW_SCRATCH ? 'com_raspadinha' : 'sem_raspadinha';
const runs = { analysis: 0, plan: 0 };
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
const TRACKING_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'wbraid', 'gbraid', 'fbclid', 'ttclid', 'msclkid', 'src', 'sck', 'xcod'];
function checkoutHref() {
  const url = new URL(CHECKOUT_URL);
  const incoming = new URLSearchParams(window.location.search);
  TRACKING_KEYS.forEach((key) => { const value = incoming.get(key); if (value) url.searchParams.set(key, value); });
  const googleClick = incoming.has('gclid') || incoming.has('gbraid') || incoming.has('wbraid');
  if (googleClick) {
    if (!url.searchParams.has('utm_source')) url.searchParams.set('utm_source', 'google');
    if (!url.searchParams.has('utm_medium')) url.searchParams.set('utm_medium', 'cpc');
  }
  // Versao do teste A/B no checkout (coluna SCK da Utmify), para comparar as vendas de cada versao.
  if (!url.searchParams.has('sck')) url.searchParams.set('sck', VERSION);
  return url.toString();
}
function trackCheckoutClick() {
  track(etapa(LAST_STEP + 6, 'clicou_no_checkout'), { currency: 'BRL', value: 39.90, transport_type: 'beacon', versao: VERSION });
  if (typeof window.gtag === 'function') window.gtag('event', 'begin_checkout', { currency: 'BRL', value: 39.90, transport_type: 'beacon' });
}
const current = () => FLOW[state.step];
const name = () => state.answers.name || 'Ana';
const getWeight = () => Number(state.answers.weight || 75);
const getHeight = () => Number(state.answers.height || 165);
const getDesired = () => Number(state.answers.desiredWeight || 65);
const loss = () => Math.max(1, getWeight() - getDesired());
const forecast = () => Math.max(getDesired() - 2, Math.round(getWeight() - loss() * 1.2));

function logo() { return `<img class="brand-logo" src="${ASSETS.logo}" alt="Segredo da Insulina" />`; }
function shell(html, cls = '') { app.innerHTML = `<main class="page-shell ${cls}">${html}</main>`; window.scrollTo({ top: 0, behavior: 'instant' }); }
function topbar() { const pct = Math.min(99, Math.round(((state.step + 1) / FLOW.length) * 100)); return `<div class="quiz-top"><button class="back-button" data-action="back" aria-label="Voltar">‹</button>${logo()}</div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>`; }
function interpolate(text) { return text.replaceAll('{name}', esc(name())).replaceAll('{weight}', getWeight()).replaceAll('{desiredWeight}', getDesired()).replaceAll('{loss}', loss()).replaceAll('{forecast}', forecast()).replaceAll('{forecastLoss}', getWeight() - forecast()); }
function nextStep() { if (state.step < FLOW.length - 1) { state.step += 1; render(); } else { runs.analysis += 1; state.screen = 'analysis'; state.analysisIndex = 0; render(); runAnalysis(); } }
function goBack() { runs.analysis += 1; runs.plan += 1; if (state.step === 0) { state.screen = 'intro'; render(); } else { state.step -= 1; state.screen = 'flow'; render(); } }

// Links de Politica de Privacidade e Termos de Uso, no fim da pagina inicial e da oferta.
function legalLinks() { return `<nav class="legal-links"><a href="/politica-de-privacidade" target="_blank" rel="noopener">Política de Privacidade</a><i>·</i><a href="/termos-de-uso" target="_blank" rel="noopener">Termos de Uso</a></nav>`; }
function intro() {
  shell(`<section class="intro-screen"><header class="intro-header">${logo()}</header><div class="intro-copy"><h1>AS MULHERES ACIMA DE 40 ESTÃO TROCANDO OS <span>MÉTODOS CAROS</span> POR ESSA MISTURA DE <span>R$5</span></h1><p>Veja os resultados já nos primeiros dias.</p></div><div class="hero-photo-wrap"><div class="glow"></div><img class="hero-photo" src="${ASSETS.doctor}" alt="Pessoa segurando a mistura do Segredo da Insulina"/><span class="photo-tag">a mistura de R$5</span></div><div class="social-proof"><strong>+12.847 mulheres</strong> já descobriram a versão certa para o seu corpo</div><button class="primary-cta" data-action="start">QUERO DESCOBRIR MINHA VERSÃO</button><div class="trust-row"><span>✓ 100% gratuito</span><i>·</i><span>✓ Resultado na hora</span><i>·</i><span>✓ 100% natural</span></div>${legalLinks()}</section>`, 'intro-shell');
  app.querySelector('[data-action="start"]').onclick = () => { state.screen = 'flow'; state.step = 0; render(); };
}

function optionMarkup(item, selected, personalized = false) {
  const [value, emoji, label, description] = item;
  return `<button class="option-card ${selected ? 'selected' : ''} ${personalized ? 'personalized-option' : ''}" data-value="${esc(value)}"><span class="option-emoji">${emoji}</span><span class="option-text"><b>${esc(label)}</b>${description ? `<small>${esc(description)}</small>` : ''}</span></button>`;
}
function flowScreen() {
  const step = current();
  if (step.type === 'name') return nameScreen(step);
  if (step.type === 'number') return numberScreen(step);
  if (step.type === 'info') return infoScreen(step);
  if (step.id === 'bodyArea') return bodyAreaScreen(step);
  const selected = step.type === 'multi' ? (state.selections[step.id] || []) : state.answers[step.id];
  const title = interpolate(step.title);
  const options = step.body ? step.options.map(([v,,label,img]) => `<button class="option-card body-option ${selected === v ? 'selected' : ''}" data-value="${v}"><img src="${img}" alt="${label}"/><span>${label}</span></button>`).join('') : step.options.map((item) => optionMarkup(item, step.type === 'multi' ? selected.includes(item[0]) : selected === item[0], step.personalized)).join('');
  shell(`<section class="quiz-screen">${topbar()}<div class="question-card ${step.body ? 'body-question' : ''} ${step.commitment ? 'commitment-question' : ''}">${step.commitment && step.image ? `<img class="commitment-image" src="${step.image}" alt="Antes e depois"/>` : ''}${step.image && !step.commitment ? `<img class="question-image" src="${step.image}" alt="Imagem ilustrativa"/>` : ''}<h2>${title}</h2>${step.subtitle ? `<p class="question-subtitle">${step.subtitle}</p>` : ''}${step.hint ? `<p class="select-hint">${step.hint}</p>` : ''}<div class="options-list ${step.body ? 'body-grid' : ''}">${options}</div>${step.type === 'multi' ? `<button class="btn-quiz multi-continue" data-action="continue" disabled>Continuar</button>` : ''}</div></section>`, 'quiz-shell');
  app.querySelector('[data-action="back"]').onclick = goBack;
  app.querySelectorAll('[data-value]').forEach((button) => button.onclick = () => choose(step, button.dataset.value, button));
  const cont = app.querySelector('[data-action="continue"]');
  if (cont) cont.onclick = nextStep;
  refreshMulti(step);
}
function bodyAreaScreen(step) {
  const selected = state.selections[step.id] || [];
  const options = step.options.map(([value, emoji, label]) => `<button class="body-area-option ${selected.includes(value) ? 'selected' : ''}" data-value="${value}"><span>${emoji}</span><b>${label}</b></button>`).join('');
  shell(`<section class="quiz-screen body-area-screen">${topbar()}<div class="body-area-card"><h2>Onde você mais sente que o seu <span class="gradient-text">corpo mudou</span>?</h2><p class="select-hint">Selecione uma ou mais opções</p><div class="body-area-layout"><img class="body-area-image" src="${ASSETS.bodyAreas}" alt="Áreas do corpo"/><div class="body-area-options">${options}</div></div><button class="btn-quiz multi-continue" data-action="continue" ${selected.length ? '' : 'disabled'}>Continuar</button></div></section>`, 'quiz-shell');
  app.querySelector('[data-action="back"]').onclick = goBack;
  app.querySelectorAll('[data-value]').forEach((button) => button.onclick = () => choose(step, button.dataset.value, button));
  app.querySelector('[data-action="continue"]').onclick = nextStep;
  refreshMulti(step);
}
function refreshMulti(step) { const cont = app.querySelector('.multi-continue'); if (!cont) return; const values = state.selections[step.id] || []; cont.disabled = values.length === 0; app.querySelectorAll('[data-value]').forEach((button) => button.classList.toggle('selected', values.includes(button.dataset.value))); }
function choose(step, value, button) { if (step.type === 'multi') { const values = new Set(state.selections[step.id] || []); values.has(value) ? values.delete(value) : values.add(value); state.selections[step.id] = [...values]; refreshMulti(step); return; } state.answers[step.id] = value; app.querySelectorAll('[data-value]').forEach((b) => b.disabled = true); button.classList.add('selected'); setTimeout(nextStep, 300); }

function nameScreen(step) { shell(`<section class="quiz-screen">${topbar()}<div class="question-card simple-entry"><div class="question-eyebrow">PERSONALIZAÇÃO</div><h2>${step.title}</h2><input class="name-input" id="name-input" type="text" placeholder="Seu primeiro nome" autocomplete="given-name"/><button class="btn-quiz" data-action="name-next" disabled>Continuar</button></div></section>`, 'quiz-shell'); app.querySelector('[data-action="back"]').onclick = goBack; const input = app.querySelector('#name-input'); const next = app.querySelector('[data-action="name-next"]'); input.oninput = () => { next.disabled = !input.value.trim(); }; next.onclick = () => { state.answers.name = input.value.trim(); nextStep(); }; }
function numberScreen(step) { const value = Number(state.answers[step.id] ?? step.value); state.answers[step.id] = value; const desiredMeta = step.desired && value < getWeight() ? `<div class="goal-chip">Meta: perder ${getWeight() - value} kg 🎯</div>` : ''; shell(`<section class="quiz-screen">${topbar()}<div class="question-card numeric-question"><div class="question-eyebrow">DADOS PARA O SEU PLANO</div><h2>${step.title}</h2><div class="number-value">${value}<span>${step.unit}</span></div><div class="stepper"><button data-delta="-5">-5</button><button data-delta="-1">−</button><button data-delta="1">+</button><button data-delta="5">+5</button></div>${desiredMeta}<button class="btn-quiz" data-action="number-next">Continuar</button></div></section>`, 'quiz-shell'); app.querySelector('[data-action="back"]').onclick = goBack; app.querySelectorAll('[data-delta]').forEach((button) => button.onclick = () => { const next = Math.max(step.min, Math.min(step.max, state.answers[step.id] + Number(button.dataset.delta))); state.answers[step.id] = next; numberScreen(step); }); app.querySelector('[data-action="number-next"]').onclick = nextStep; }
function infoScreen(step) { shell(`<section class="quiz-screen info-screen">${topbar()}<div class="info-card"><div class="info-icon">${step.id === 'biology' ? '🧬' : step.id === 'notAlone' ? '🤝' : step.id === 'comparison' ? '💉' : step.id === 'natural' ? '🎉' : step.id === 'forecast' ? '🎯' : '✨'}</div><h2>${interpolate(step.title)}</h2>${step.image ? `<img class="info-image" src="${step.image}" alt="Imagem da etapa"/>` : ''}<div class="info-body">${interpolate(step.body)}</div><button class="btn-quiz" data-action="info-next">${step.button || 'Continuar'}</button></div></section>`, 'quiz-shell'); app.querySelector('[data-action="back"]').onclick = goBack; app.querySelector('[data-action="info-next"]').onclick = nextStep; }

function analysis() { const item = ANALYSIS_STEPS[state.analysisIndex]; const progress = Math.round(((state.analysisIndex + 1) / ANALYSIS_STEPS.length) * 100); shell(`<section class="analysis-screen">${topbar()}<div class="analysis-orb"><span>${item.icon}</span></div><p class="analysis-kicker">ANÁLISE PERSONALIZADA</p><h1>${name()}, sua análise está <span>pronta</span>.</h1><p class="analysis-step">${item.label}</p><div class="analysis-bar"><div style="width:${progress}%"></div></div><div class="analysis-list">${ANALYSIS_STEPS.map((s, i) => `<div class="analysis-row ${i < state.analysisIndex ? 'done' : ''} ${i === state.analysisIndex ? 'active' : ''}"><span>${i < state.analysisIndex ? '✓' : s.icon}</span>${s.label}</div>`).join('')}</div></section>`, 'analysis-shell'); app.querySelector('[data-action="back"]').onclick = () => { runs.analysis += 1; state.screen = 'flow'; state.step = FLOW.length - 1; render(); }; }
function runAnalysis() { const run = ++runs.analysis; const tick = () => { if (run !== runs.analysis || state.screen !== 'analysis') return; if (state.analysisIndex < ANALYSIS_STEPS.length - 1) setTimeout(() => { if (run !== runs.analysis || state.screen !== 'analysis') return; state.analysisIndex += 1; render(); tick(); }, ANALYSIS_STEPS[state.analysisIndex].duration); else setTimeout(() => { if (run !== runs.analysis || state.screen !== 'analysis') return; state.screen = 'detail'; render(); }, 850); }; tick(); }
// Faixa do IMC pela tabela da OMS.
const bmiLabel = (bmi) => (bmi < 18.5 ? 'Abaixo do peso' : bmi < 25 ? 'Peso normal' : bmi < 30 ? 'Sobrepeso' : 'Obesidade');
function detailScreen() { const bmi = (getWeight() / ((getHeight() / 100) ** 2)).toFixed(1); shell(`<section class="detail-screen">${topbar()}<h2><span>${name()}</span>, sua análise está pronta.</h2><div class="bmi-card"><strong>${bmi}</strong><small>Seu IMC: <b>${bmiLabel(Number(bmi))}</b></small><hr/><h4>⚠️ Sinais de alerta identificados:</h4><p>❌ Saúde em risco</p><p>❌ Hormônio da saciedade fora de sincronia</p><p>❌ Metabolismo lento</p><p>❌ Resistência ao emagrecimento abdominal</p></div><div class="green-callout">🌿 Inflamação intestinal identificada. O Segredo da Insulina começa a agir na primeira semana.</div><h3>Benefícios do <span>Segredo da Insulina</span> 👇</h3><div class="benefit-stack"><p>✅ Metabolismo reativado</p><p>✅ Barriga desinchada nos primeiros dias</p><p>✅ Fome controlada sem remédio</p><p>✅ Mais energia e Saúde</p><p>✅ Sem efeito sanfona</p><p>✅ Sobremesas que não travam o resultado</p></div><img class="detail-testimonial" src="${ASSETS.testimonial}" alt="Depoimento antes e depois"/><blockquote>“Perdi 11kg em 5 semanas!”<small>Rose, 52 anos - São Paulo<br/>⭐⭐⭐⭐⭐</small></blockquote><button class="btn-quiz" data-action="detail-next">Continuar</button></section>`, 'quiz-shell'); app.querySelector('[data-action="back"]').onclick = () => { state.screen = 'flow'; state.step = FLOW.length - 1; render(); }; app.querySelector('[data-action="detail-next"]').onclick = () => { state.screen = 'testimonials'; render(); }; }
function testimonials() { const cards = [[ASSETS.maria, '-9kg', 'Perdi 9kg em 21 dias. Tive que jogar algumas calças e shorts fora.', 'Maria, 47 anos'], [ASSETS.rosana, '-7kg', 'Minha pressão normalizou e o médico reduziu meu remédio.', 'Rosana, 52 anos'], [ASSETS.fernanda, '-11kg', 'Me olhei no espelho e me reconheci de novo.', 'Fernanda, 43 anos'], [ASSETS.claudia, '-8kg', 'Voltei a ter energia pra cuidar dos meus filhos.', 'Claudia, 36 anos']]; shell(`<section class="testimonial-screen">${topbar()}<h2>Veja quem já transformou o corpo com o <span>Segredo da Insulina</span></h2>${cards.map(([image, lossText, quote, person]) => `<article class="testimonial-card"><img src="${image}" alt="Antes e depois - ${person}"/><strong>${lossText}</strong><p>“${quote}”</p><small>${person}<br/>⭐⭐⭐⭐⭐</small></article>`).join('')}<button class="btn-quiz" data-action="testimonials-next">Quero essa transformação</button></section>`, 'quiz-shell'); app.querySelector('[data-action="back"]').onclick = () => { state.screen = 'detail'; render(); }; app.querySelector('[data-action="testimonials-next"]').onclick = () => { runs.plan += 1; state.screen = 'generation'; state.planIndex = 0; render(); runPlan(); }; }
function generation() { shell(`<section class="generation-screen">${topbar()}<div class="generation-card"><span>✨</span><h2>Sua rotina do <b>Segredo da Insulina</b> de <b>21 dias</b> está pronta!</h2></div><div class="generation-arrow">⬇️</div><div class="generation-list">${['Montando sua rotina de 21 dias', 'Personalizando seu Segredo da Insulina', 'Calculando Ingredientes e receitas', 'Preparando seus bônus exclusivos', 'Rotina Pronta'].map((text, i) => `<p class="${i < state.planIndex ? 'done' : i === state.planIndex ? 'active' : ''}">${i < state.planIndex ? '✅' : i === state.planIndex ? '⏳' : '◻️'} ${text}</p>`).join('')}</div><div class="analysis-bar"><div style="width:${Math.max(8, state.planIndex * 25)}%"></div></div></section>`, 'analysis-shell'); app.querySelector('[data-action="back"]').onclick = () => { runs.plan += 1; state.screen = 'testimonials'; render(); }; }
function runPlan() { const run = ++runs.plan; const tick = () => { if (run !== runs.plan || state.screen !== 'generation') return; if (state.planIndex < 4) setTimeout(() => { if (run !== runs.plan || state.screen !== 'generation') return; state.planIndex += 1; render(); tick(); }, 650); else setTimeout(() => { if (run !== runs.plan || state.screen !== 'generation') return; state.screen = SHOW_SCRATCH && !state.scratched ? 'scratch' : 'offer'; render(); }, 650); }; tick(); }

function scratchScreen() {
  shell(`<section class="scratch-screen">${topbar()}<span class="scratch-eyebrow">🎁 Antes de liberar seu plano</span><h1 class="scratch-title"><span class="scratch-name">${esc(name())}</span>, sua rotina está pronta e você desbloqueou um <span class="scratch-hl">desconto especial</span>!</h1><p class="scratch-sub">Raspe o cartão abaixo com o dedo e <b>descubra quanto você vai economizar hoje</b> 👇</p><div class="scratch-ticket"><div class="scratch-inner" id="scratch-inner"><div class="scratch-prize"><span class="scratch-label">Seu desconto</span><span class="scratch-big">${SCRATCH.pct}% OFF</span><span class="scratch-small">no seu plano completo</span></div><canvas class="scratch-canvas" id="scratch-canvas" aria-label="Área para raspar e revelar o desconto"></canvas><span class="scratch-hint" id="scratch-hint">👆 Raspe aqui</span></div></div><button class="scratch-reveal" id="scratch-reveal" type="button">Não consegue raspar? Toque para revelar</button><div class="scratch-result" id="scratch-result"><div class="scratch-price"><span>Seu plano completo de <s>${SCRATCH.anchor}</s></span><strong>sai por ${SCRATCH.price}</strong><em>✓ Desconto de ${SCRATCH.pct}% aplicado</em></div><button class="primary-cta scratch-cta" data-action="scratch-next" type="button">VER MEU PLANO COM ${SCRATCH.pct}% OFF</button></div></section>`, 'quiz-shell scratch-shell');
  app.querySelector('[data-action="back"]').onclick = () => { runs.plan += 1; state.screen = 'testimonials'; render(); };
  app.querySelector('[data-action="scratch-next"]').onclick = () => { state.screen = 'offer'; render(); };
  setupScratch();
}
function setupScratch() {
  const inner = app.querySelector('#scratch-inner');
  const canvas = app.querySelector('#scratch-canvas');
  const hint = app.querySelector('#scratch-hint');
  const revealBtn = app.querySelector('#scratch-reveal');
  const result = app.querySelector('#scratch-result');
  const ctx = canvas.getContext('2d');
  let drawing = false; let moves = 0; let done = false;
  const paint = () => {
    const dpr = window.devicePixelRatio || 1; const w = inner.clientWidth; const h = inner.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#b9bcc4'); g.addColorStop(0.45, '#e9ebef'); g.addColorStop(0.55, '#d3d6dc'); g.addColorStop(1, '#a9adb6');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 260; i += 1) { ctx.fillStyle = i % 2 ? '#ffffff' : '#7a7f8a'; ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    ctx.globalAlpha = 1; ctx.fillStyle = '#5b606b'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.round(h * 0.15)}px "DM Sans", Arial, sans-serif`; ctx.fillText('RASPE AQUI', w / 2, h * 0.42);
    ctx.font = `600 ${Math.round(h * 0.075)}px "DM Sans", Arial, sans-serif`; ctx.fillText('e descubra seu desconto', w / 2, h * 0.6);
  };
  const point = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  // Apaga o caminho inteiro do dedo (linha do ponto anterior ao atual), para raspadas rápidas não deixarem buracos.
  let last = null;
  const scratch = (p) => {
    const radius = Math.max(18, inner.clientWidth * 0.07);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fill();
    if (last) { ctx.lineWidth = radius * 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); }
    last = p;
  };
  const cleared = () => { const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data; let clear = 0; let total = 0; for (let i = 3; i < data.length; i += 96) { total += 1; if (data[i] === 0) clear += 1; } return clear / total; };
  const reveal = () => {
    if (done) return; done = true; state.scratched = true;
    hint.hidden = true; revealBtn.hidden = true; canvas.classList.add('gone'); result.classList.add('show');
    track(etapaSub(LAST_STEP + 4, 'b', 'raspadinha_raspou'), { versao: VERSION });
    if (!window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) confetti(inner);
    setTimeout(() => { try { result.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} }, 500);
  };
  canvas.addEventListener('pointerdown', (e) => { if (done) return; drawing = true; last = null; hint.hidden = true; try { canvas.setPointerCapture(e.pointerId); } catch (err) {} scratch(point(e)); });
  canvas.addEventListener('pointermove', (e) => { if (!drawing || done) return; scratch(point(e)); moves += 1; if (moves % 6 === 0 && cleared() > 0.45) reveal(); });
  const stop = () => { drawing = false; last = null; if (!done && cleared() > 0.45) reveal(); };
  canvas.addEventListener('pointerup', stop); canvas.addEventListener('pointercancel', stop);
  revealBtn.onclick = reveal;
  paint();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!done && moves === 0) paint(); });
}
function confetti(origin) {
  const c = document.createElement('canvas'); c.className = 'scratch-confetti'; document.body.appendChild(c);
  const cx = c.getContext('2d'); const dpr = window.devicePixelRatio || 1;
  c.width = innerWidth * dpr; c.height = innerHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const colors = ['#18b86a', '#f47721', '#fbbf24', '#dc2626', '#60a5fa', '#f472b6']; const r = origin.getBoundingClientRect();
  const parts = Array.from({ length: 140 }, (_, i) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2, vx: (Math.random() - 0.5) * 13, vy: -Math.random() * 12 - 3, s: Math.random() * 6 + 4, rot: Math.random() * 360, vr: (Math.random() - 0.5) * 16, col: colors[i % colors.length] }));
  const t0 = performance.now();
  const frame = (now) => {
    const el = now - t0; cx.clearRect(0, 0, innerWidth, innerHeight);
    parts.forEach((p) => { p.vy += 0.33; p.x += p.vx; p.y += p.vy; p.rot += p.vr; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot * Math.PI / 180); cx.globalAlpha = Math.max(0, 1 - el / 2600); cx.fillStyle = p.col; cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); cx.restore(); });
    if (el < 2600) requestAnimationFrame(frame); else c.remove();
  };
  requestAnimationFrame(frame);
}
// Perguntas frequentes da oferta: cada pergunta com a sua resposta.
const FAQS = [
  ['O Segredo da Insulina realmente funciona?', 'O Segredo da Insulina é uma rotina de 21 dias com receitas naturais pensadas para mulheres acima de 40, que costumam ter mais dificuldade para emagrecer por causa das mudanças hormonais. Você segue o passo a passo com ingredientes simples, sem dieta radical. Os resultados variam de pessoa para pessoa e dependem de seguir a rotina.'],
  ['Quanto tempo leva para ver resultados?', 'Muitas mulheres sentem a barriga mais desinchada já na primeira semana. O plano completo é de 21 dias, e quanto mais você segue a rotina, melhores tendem a ser os resultados. Cada corpo responde no seu tempo.'],
  ['É seguro? Tem efeitos colaterais?', 'As receitas usam ingredientes naturais, que você encontra no mercado. Se você está grávida, amamentando, tem alguma doença ou toma remédios (por exemplo, para diabetes ou pressão), converse com seu médico antes de começar.'],
  ['Como vou receber o protocolo?', 'Logo após a confirmação do pagamento, você recebe o acesso no e-mail usado na compra. No cartão, chega na hora; no Pix, assim que o pagamento é confirmado, normalmente em poucos minutos. Se não encontrar, confira as pastas Spam e Promoções.'],
  ['E se não funcionar pra mim?', 'Você tem 30 dias de garantia. Se não gostar ou achar que não funcionou para você, é só pedir o reembolso dentro desse prazo e devolvemos 100% do valor pago, sem perguntas.'],
  ['O pagamento é seguro?', 'Sim. O pagamento é processado pela Payt, com ambiente protegido. Você pode pagar no cartão (em até 12x) ou no Pix, e seus dados ficam protegidos.'],
  ['Preciso comprar ingredientes caros?', 'Não. As receitas usam ingredientes simples, que saem por menos de R$ 5 no mercado. Sem farmácia e sem nada importado: só o liquidificador.']
];
// Depoimentos mostrados dentro da oferta, entre os dois blocos de preço.
const OFFER_TESTIMONIALS = [
  [ASSETS.fernanda, '-11kg', 'Me olhei no espelho e me reconheci de novo.', 'Fernanda, 43 anos'],
  [ASSETS.maria, '-9kg', 'Perdi 9kg em 21 dias. Tive que jogar algumas calças e shorts fora.', 'Maria, 47 anos'],
  [ASSETS.rosana, '-7kg', 'Minha pressão normalizou e o médico reduziu meu remédio.', 'Rosana, 52 anos']
];
function offer() { const checkout = esc(checkoutHref()); const priceBlock = (cta) => `<div class="offer-price">${state.scratched ? `<div class="discount-applied">✓ Seu desconto de ${SCRATCH.pct}% foi aplicado</div>` : ''}<p>TUDO ISSO DE <s>R$ 293,80</s></p><small>POR APENAS</small><strong>R$ 39,90</strong><span>Ou 6x de R$ 7,48</span><a class="primary-cta" href="${checkout}" data-checkout target="_blank" rel="noopener">${cta}</a></div>`; const offerTestimonials = `<section class="offer-proof"><h2>Quem já começou o <span>Segredo da Insulina</span> 💬</h2>${OFFER_TESTIMONIALS.map(([image, lossText, quote, person]) => `<article class="offer-proof-card"><img src="${image}" alt="Antes e depois - ${person}" loading="lazy"/><div><strong>${lossText}</strong><p>“${quote}”</p><small>${person} · ⭐⭐⭐⭐⭐</small></div></article>`).join('')}<p class="offer-proof-note">Resultados individuais. Podem variar de pessoa para pessoa.</p></section>`; shell(`<section class="offer-screen">${topbar()}<div class="scarcity">🔥 Restam 8 vagas do plano para mulheres 40-54 hoje</div><h1>${name()}, sua rotina de 21 dias com Segredo da Insulina foi Gerada com Sucesso</h1><p class="offer-subtitle">Ele é exclusivo e gerado só uma vez, não saia dessa página para não perder</p><div class="plan-card"><div class="plan-head">SEU PLANO EXCLUSIVO<strong>21 Dias de Tratamento</strong></div><div class="plan-milestones"><p>✨ <b>EM 7 DIAS</b><strong>Desincha e vê os primeiros resultados</strong></p><p>🔥 <b>EM 14 DIAS</b><strong>Perda de até 6kg</strong></p><p>🏆 <b>EM 21 DIAS</b><strong>Perda de até 12kg</strong><em>META</em></p></div><div class="result-target">🎯 Resultado esperado: até -12kg em 21 dias</div></div><h2 class="bonus-heading">Você ainda leva <span>3 bônus</span> para acelerar seus resultados</h2><div class="bonus-stack"><p>🎁 <b>Bônus 1: Dicas para acelerar resultado</b><small>São dicas que vão aumentar seus resultados em até 30%</small></p><p>🎁 <b>Bônus 2: 40 Sobremesas que aceleram o Metabolismo</b><small>Você pode comer doces sem problemas</small></p><p>🎁 <b>Bônus 3: 20 Shakes Emagrecedores</b><small>Vitaminas, shakes e bebidas deliciosas</small></p></div><div class="access-card"><div>VEJA<strong>Tudo que você terá acesso garantindo</strong><small>Até ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</small></div><ul><li>✅ Receitas completas do Segredo da Insulina</li><li>✅ Rotina de 21 dias passo a passo</li><li>✅ Acesso ao Aplicativo Exclusivo</li><li>✅ Lista completa dos ingredientes</li><li>✅ Acesso vitalício ao app</li><li>🎁 BÔNUS: Dicas para acelerar resultados</li><li>🎁 BÔNUS: 20 Shakes para emagrecer</li><li>🎁 BÔNUS: 40 sobremesas que aceleram metabolismo</li></ul></div>${priceBlock(state.scratched ? `QUERO MEU PLANO COM ${SCRATCH.pct}% OFF 🥰` : 'QUERO COMEÇAR 🥰')}<div class="guarantee"><b>GARANTIA<br/><strong>30</strong><br/>DIAS</b><div><h2>Garantia de Reembolso</h2><p>Todo produto é obrigado a dar no mínimo 7 dias de garantia, porém confiamos tanto na fórmula que oferecemos 30 dias corridos.</p><p>Ou seja, se você não gostar ou não funcionar pra você, nós reembolsaremos cada centavo que você pagou, sem questionar.</p></div></div>${offerTestimonials}${priceBlock(state.scratched ? `QUERO MEU PLANO COM ${SCRATCH.pct}% OFF 🔥` : 'QUERO COMEÇAR AGORA! 🔥')}<h2 class="faq-title">❓ Perguntas Frequentes</h2><div class="faq-list">${FAQS.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div><a class="primary-cta final-cta" href="${checkout}" data-checkout target="_blank" rel="noopener">QUERO COMEÇAR AGORA! 🔥</a><p class="payment-trust">🔒 Pagamento 100% seguro · Seus dados estão protegidos</p>${legalLinks()}</section>`, 'quiz-shell'); app.querySelectorAll('[data-checkout]').forEach((link) => link.addEventListener('click', trackCheckoutClick)); }

// Eventos do funil no GA4: nomes em portugues, numerados na ordem em que a pessoa passa.
// Ordenando os eventos por nome no GA4, a lista fica na sequencia do funil.
const STEP_NAMES = {
  age: 'idade', body: 'corpo', bodyArea: 'area_do_corpo', notAlone: 'nao_esta_sozinha', globo: 'materia_globo',
  name: 'nome', weightImpact: 'o_que_incomoda', appearance: 'ja_tentou_emagrecer', biology: 'corpo_resiste',
  barriers: 'o_que_impede', comparison: 'comparacao_metodos', goals: 'objetivos', bloat: 'inchaco',
  natural: 'como_funciona', weight: 'peso_atual', height: 'altura', desiredWeight: 'peso_desejado',
  routine: 'rotina', sleep: 'sono', forecast: 'previsao_resultado', commitment: 'compromisso', firstResult: 'primeiro_resultado'
};
const LAST_STEP = FLOW.length;
const etapa = (number, label) => `etapa_${String(number).padStart(2, '0')}_${label}`.slice(0, 40);
// Telas extras entre duas etapas (ex.: raspadinha entre 26 e 27) ganham letra: etapa_26a_..., etapa_26b_...
const etapaSub = (number, sub, label) => `etapa_${String(number).padStart(2, '0')}${sub}_${label}`.slice(0, 40);
const trackedScreens = new Set();
function track(event, params = {}) {
  if (trackedScreens.has(event)) return;
  trackedScreens.add(event);
  if (typeof window.gtag === 'function') window.gtag('event', event, params);
}
function trackScreen() {
  if (state.screen === 'intro') track(etapa(0, 'pagina_inicial'));
  else if (state.screen === 'flow') {
    const step = current();
    const number = state.step + 1;
    track(etapa(number, STEP_NAMES[step.id] || step.id.toLowerCase()), { step_number: number, step_id: step.id });
  } else if (state.screen === 'analysis') track(etapa(LAST_STEP + 1, 'terminou_quiz'));
  else if (state.screen === 'detail') track(etapa(LAST_STEP + 2, 'resultado_analise'));
  else if (state.screen === 'testimonials') track(etapa(LAST_STEP + 3, 'depoimentos'));
  else if (state.screen === 'generation') track(etapa(LAST_STEP + 4, 'gerando_plano'));
  else if (state.screen === 'scratch') track(etapaSub(LAST_STEP + 4, 'a', 'raspadinha_vista'), { versao: VERSION });
  else if (state.screen === 'offer') track(etapa(LAST_STEP + 5, 'chegou_na_oferta'), { currency: 'BRL', value: 39.90, versao: VERSION });
}
function render() { trackScreen(); if (state.screen === 'intro') intro(); else if (state.screen === 'flow') flowScreen(); else if (state.screen === 'analysis') analysis(); else if (state.screen === 'detail') detailScreen(); else if (state.screen === 'testimonials') testimonials(); else if (state.screen === 'generation') generation(); else if (state.screen === 'scratch') scratchScreen(); else offer(); }
render();
