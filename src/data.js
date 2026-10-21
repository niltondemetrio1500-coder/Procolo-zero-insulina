export const ASSETS = {
  logo: '/assets/logo-ozempic-CLWt-YVF.png',
  doctor: '/assets/doutora-cover-Dn4dhyTr.png',
  bodyMedium: '/assets/body-medio-DStQ-FtD.webp',
  bodyAbove: '/assets/body-acima-B6GAhLJh.webp',
  bodyOverweight: '/assets/body-sobrepeso-Xf73tryt.webp',
  bodyPlus: '/assets/body-plussize-C2UrcrEA.webp',
  bodyAreas: '/assets/body-areas-CF2TMRSN.webp',
  globo: '/assets/entrevista-globo-Cr7zZD5Q.webp',
  beforeIcon: '/assets/icon-antes-TUawfA0v.png',
  commitment: '/assets/commitment-before-after-DYP9iNat.png',
  testimonial: '/assets/depoimento-antes-depois-CsLdWDkt.jpg',
  maria: '/assets/antes-depois-maria-Bjz-z-hL.jpg',
  rosana: '/assets/antes-depois-rosana-BQrEG7CG.jpg',
  fernanda: '/assets/antes-depois-fernanda-DB-hMpea.jpg',
  claudia: '/assets/antes-depois-4-CXXOM7GR.jpg'
};

export const CHECKOUT_URL = 'https://checkout.payt.com.br/8073ee18d2b7cd397c2171d9196587b9';

const single = (id, title, options, extra = {}) => ({ type: 'single', id, title, options, ...extra });
const multi = (id, title, options, extra = {}) => ({ type: 'multi', id, title, options, ...extra });
const info = (id, title, body, extra = {}) => ({ type: 'info', id, title, body, ...extra });

export const FLOW = [
  single('age', 'Qual a sua idade?', [
    ['18-27', '🌸', '18 – 27 anos'], ['28-39', '💐', '28 – 39 anos'], ['40-54', '🌺', '40 – 54 anos'], ['54+', '🌷', '54+ anos']
  ]),
  single('body', 'Como está seu corpo hoje?', [
    ['medio', '', 'Médio', ASSETS.bodyMedium], ['acima', '', 'Acima do peso', ASSETS.bodyAbove], ['sobrepeso', '', 'Sobrepeso', ASSETS.bodyOverweight], ['plus', '', 'Plus Size', ASSETS.bodyPlus]
  ], { body: true }),
  multi('bodyArea', 'Onde você mais sente que o seu corpo mudou?', [
    ['papada', '😊', 'Papada'], ['bracos', '💪', 'Braços'], ['barriga', '🤰', 'Barriga'], ['cintura', '💝', 'Cintura'], ['gluteos', '🍑', 'Glúteos'], ['coxas', '🦵', 'Coxas'], ['todo', '✨', 'Corpo Todo']
  ], { image: ASSETS.bodyAreas, hint: 'Selecione uma ou mais opções' }),
  info('notAlone', '🤝 Você não está sozinha.', '<strong>87,4%</strong><br><span>das mulheres acima de 40 anos</span><br><br>relatam acúmulo de gordura na Papada mesmo sem comer muito.', { button: 'Entendi, quero continuar' }),
  info('globo', 'O efeito do método caro por R$ 5 ⭐', '', { image: ASSETS.globo, button: 'Continuar' }),
  { type: 'name', id: 'name', title: 'Como posso te chamar?' },
  single('weightImpact', 'O que mais te incomoda no seu peso hoje?', [
    ['autoestima', '💔', 'Minha autoestima', 'Me olho no espelho e não me reconheço mais'], ['saude', '🩺', 'Minha saúde', 'Sinto que minha saúde está em risco'], ['relacionamentos', '👥', 'Meus relacionamentos', 'Evito sair, tirar foto ou me encontrar com pessoas'], ['rotina', '📅', 'Minha rotina', 'Não tenho energia pra cuidar da família e de mim mesma']
  ], { personalized: true }),
  info('biology', '🧬 {name}, seu corpo aprendeu a resistir.', 'É biologia, não falta de força de vontade.<br><br>O <strong>Segredo da Insulina</strong> muda esse sinal por dentro.', { button: 'Entendi, continuar' }),
  multi('barriers', 'O que mais te impede de emagrecer hoje?', [
    ['dinheiro', '💸', 'Já gastei dinheiro e não tive resultado'], ['tratamento-caro', '💰', 'Não tenho condições de pagar tratamentos caros'], ['constancia', '📉', 'Começo e não consigo manter'], ['fome', '🍫', 'Sinto fome e acabo cedendo'], ['tempo', '⏰', 'Não tenho tempo para dietas']
  ], { hint: 'Selecione todas que se aplicam' }),
  info('comparison', '💉 O efeito do método caro por R$ 5', 'Alguns tratamentos caros custam <strong>mais de R$ 1.000 por mês</strong> e exigem uso contínuo.<br><br>O Segredo da Insulina faz o mesmo por menos de <strong>R$5 no mercado.</strong><br><br><span>Sem ingrediente caro. Sem farmácia. Só o liquidificador.</span>', { button: 'Continuar' }),
  multi('goals', 'O que você quer conquistar?', [
    ['saude', '❤️', 'Melhorar minha saúde'], ['peso', '⚖️', 'Perder peso de verdade'], ['desinchar', '💧', 'Desinchar logo na primeira semana'], ['energia', '⚡', 'Ter mais energia no dia a dia'], ['autoestima', '🌸', 'Me sentir bem comigo mesma']
  ], { hint: 'Selecione todas que se aplicam' }),
  single('bloat', 'Você tem inchaço, barriga dura ou digestão lenta com frequência?', [
    ['frequente', '😣', 'Sim, quase todo dia me sinto inchada'], ['noite', '😐', 'Às vezes, especialmente à noite'], ['raro', '😊', 'Raramente']
  ]),
  info('natural', '{name}, veja como o Segredo da Insulina age! 🎉', '<div class="how-it-works"><div><b>✓</b> Use ingredientes naturais</div><div><b>✓</b> 1 a 2 vezes ao dia</div><div><b>✓</b> Receita 100% Natural</div></div><div class="journey"><img src="' + ASSETS.beforeIcon + '" alt="Antes"/><div><b>1 · Antes</b><span>Metabolismo travado, fome constante</span></div><div><b>2 · Segredo da Insulina</b><span>Mistura natural que ativa o sinal de saciedade</span></div><div><b>3 · 🔥 Metabolismo reativado</b><span>Corpo para de segurar gordura</span></div><div><b>4 · ✨ Corpo responde</b><span>Resultado visível na 1ª semana</span></div></div>', { button: 'Entendi! Continuar 🚀' }),
  { type: 'number', id: 'weight', title: 'Qual é seu peso atual?', unit: 'kg', value: 75, min: 45, max: 150 },
  { type: 'number', id: 'height', title: 'Qual é sua altura?', unit: 'cm', value: 165, min: 140, max: 200 },
  { type: 'number', id: 'desiredWeight', title: 'Qual é seu peso desejado?', unit: 'kg', value: 65, min: 40, max: 149, desired: true },
  single('routine', 'Como é sua rotina diária?', [
    ['fora', '🏢', 'Trabalho fora de casa'], ['home', '🏠', 'Trabalho em casa / home office'], ['familia', '👨‍👩‍👧', 'Cuido da casa e da família'], ['corrida', '🏃‍♀️', 'Tenho uma rotina bastante corrida e irregular']
  ]),
  single('sleep', 'Quantas horas você dorme por noite?', [
    ['menos5', '😴', 'Menos de 5h'], ['5-7', '🌙', '5 – 7 horas'], ['7-9', '😊', '7 – 9 horas'], ['mais9', '💤', 'Mais de 9h']
  ]),
  info('forecast', '{name}, esse objetivo é totalmente alcançável!', '<div class="weight-forecast"><div><strong>{weight}kg</strong><small>hoje</small></div><b>→</b><div><strong>{desiredWeight}kg</strong><small>sua meta</small></div></div><div class="goal-chip">Meta: perder {loss}kg</div><p class="forecast-label">PREVISÃO DE RESULTADO</p><div class="forecast-line"><span>{weight}kg<br><small>hoje</small></span><i>→</i><span>{desiredWeight}kg<br><small>meta</small></span><strong>{forecast}kg 🔥</strong></div><p>Com o método certo, você pode chegar até <strong>{forecast}kg</strong> — {forecastLoss}kg a menos!</p>', { button: 'VAMOS LÁ' }),
  single('commitment', '🎁 PARA LIBERAR SEU PLANO, PRECISO SABER:', [
    ['sim', '😍', 'Sim, me comprometo!'], ['hoje', '🤩', 'Quero começar hoje mesmo'], ['duvidas', '🤔', 'Ainda tenho algumas dúvidas']
  ], { commitment: true, image: ASSETS.commitment, subtitle: 'Você se compromete a aplicar a rotina por pelo menos 1 semana para poder ver os resultados?' }),
  single('firstResult', 'Qual resultado você quer ver primeiro?', [
    ['saude', '❤️', 'Melhorar minha saúde'], ['peso', '⚖️', 'Perder peso de verdade'], ['desinchar', '💧', 'Desinchar logo na primeira semana'], ['energia', '⚡', 'Ter mais energia no dia a dia'], ['autoestima', '🌸', 'Me sentir bem comigo mesma']
  ])
];

export const ANALYSIS_STEPS = [
  { icon: '⚖️', label: 'Calculando Faixa de Peso', duration: 500 },
  { icon: '🎂', label: 'Avaliando Idade', duration: 500 },
  { icon: '🔍', label: 'Analisando Alertas', duration: 500 },
  { icon: '✨', label: 'Mapeando Benefícios', duration: 500 }
];
