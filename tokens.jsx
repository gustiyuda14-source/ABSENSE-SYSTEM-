// tokens.jsx — Design tokens for D'AJIKS Absensi
// Aesthetic: tegas & disiplin — monokrom + warm cream + single accent
// Metafora: "punch card" — analog clock-in feel

const TOKENS = {
  // Base
  ink: '#0A0A0A',
  ink70: 'rgba(10,10,10,0.7)',
  ink50: 'rgba(10,10,10,0.5)',
  ink30: 'rgba(10,10,10,0.3)',
  ink15: 'rgba(10,10,10,0.15)',
  ink08: 'rgba(10,10,10,0.08)',
  ink04: 'rgba(10,10,10,0.04)',

  paper: '#F4F1EA',     // warm cream — background
  paperAlt: '#EAE5DA',  // alt cream — cards on cream
  card: '#FFFFFF',

  // Accents — semantic
  late:    'oklch(0.62 0.21 35)',   // burnt orange — telat / penalty
  lateBg:  'oklch(0.95 0.04 50)',
  ontime:  'oklch(0.55 0.13 155)',  // muted forest — on time
  ontimeBg:'oklch(0.95 0.04 155)',
  sp:      'oklch(0.48 0.22 25)',   // deep red — SP
  spBg:    'oklch(0.94 0.05 25)',

  // Type
  fontUI: '"Inter", -apple-system, system-ui, sans-serif',
  fontMono: '"JetBrains Mono", ui-monospace, monospace',
  fontDisplay: '"Instrument Serif", Georgia, serif',
};

// Base style sheet to inject
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');

  *, *::before, *::after { box-sizing: border-box; }
  html, body, #app { margin: 0; padding: 0; }
  body {
    font-family: ${TOKENS.fontUI};
    background: ${TOKENS.ink};
    color: ${TOKENS.ink};
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  button { font-family: inherit; cursor: pointer; }
  /* utility */
  .mono { font-family: ${TOKENS.fontMono}; font-feature-settings: "tnum"; }
  .serif { font-family: ${TOKENS.fontDisplay}; }
  .tnum { font-variant-numeric: tabular-nums; }
  /* hide scrollbars on phone bodies */
  .noscroll::-webkit-scrollbar { display: none; }
  .noscroll { scrollbar-width: none; }

  @keyframes pulseRing {
    0% { transform: scale(1); opacity: 0.7; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  @keyframes stamp {
    0% { transform: scale(2.5) rotate(-25deg); opacity: 0; }
    60% { transform: scale(0.85) rotate(-12deg); opacity: 1; }
    100% { transform: scale(1) rotate(-8deg); opacity: 1; }
  }
  @keyframes tickerScroll {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
  @keyframes blink { 50% { opacity: 0.2; } }
  .blink { animation: blink 1.2s ease-in-out infinite; }

  /* shared form-ish bits */
  .pc-divider { background-image: radial-gradient(circle, rgba(0,0,0,0.5) 1px, transparent 1.2px); background-size: 8px 1px; background-repeat: repeat-x; height: 1px; }
`;

const fmtRupiah = (n) => 'Rp ' + Math.round(n).toLocaleString('id-ID');
const pad2 = (n) => String(n).padStart(2, '0');
const fmtMin = (m) => {
  if (m === 0) return '0 menit';
  if (m < 60) return `${m} menit`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h} jam` : `${h} jam ${r} menit`;
};
const dayNamesId = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
const monthNamesId = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const fmtDate = (d) => `${pad2(d.getDate())} ${monthNamesId[d.getMonth()]}`;
const fmtDateLong = (d) => `${dayNamesId[d.getDay()]}, ${pad2(d.getDate())} ${monthNamesId[d.getMonth()]} ${d.getFullYear()}`;

Object.assign(window, { TOKENS, GLOBAL_CSS, fmtRupiah, pad2, fmtMin, fmtDate, fmtDateLong, dayNamesId, monthNamesId });
