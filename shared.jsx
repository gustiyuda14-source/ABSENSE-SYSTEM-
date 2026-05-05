// shared.jsx — Shared UI primitives styled like a punch card

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// Stamp — rotated rubber-stamp text
function Stamp({ children, color = TOKENS.late, size = 'md', style = {} }) {
  const px = size === 'sm' ? 11 : size === 'lg' ? 18 : 14;
  const pad = size === 'sm' ? '4px 8px' : size === 'lg' ? '8px 14px' : '5px 10px';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: pad, border: `2px solid ${color}`, color: color,
      fontFamily: TOKENS.fontMono, fontSize: px, fontWeight: 700,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      transform: 'rotate(-4deg)', borderRadius: 4,
      background: 'transparent',
      ...style,
    }}>{children}</div>
  );
}

// Punch ticket — paper card with perforated edge
function Ticket({ children, style = {}, dark = false, perforated = true, padding = 16 }) {
  return (
    <div style={{
      background: dark ? TOKENS.ink : TOKENS.card,
      color: dark ? TOKENS.paper : TOKENS.ink,
      border: dark ? 'none' : `1px solid ${TOKENS.ink15}`,
      borderRadius: 6,
      position: 'relative',
      padding,
      ...style,
    }}>
      {perforated && (
        <>
          <div style={{ position: 'absolute', left: 8, right: 8, top: 0, height: 1,
            backgroundImage: `radial-gradient(circle, ${dark ? 'rgba(244,241,234,0.3)' : 'rgba(0,0,0,0.25)'} 1px, transparent 1.2px)`,
            backgroundSize: '6px 1px', backgroundRepeat: 'repeat-x',
          }} />
          <div style={{ position: 'absolute', left: 8, right: 8, bottom: 0, height: 1,
            backgroundImage: `radial-gradient(circle, ${dark ? 'rgba(244,241,234,0.3)' : 'rgba(0,0,0,0.25)'} 1px, transparent 1.2px)`,
            backgroundSize: '6px 1px', backgroundRepeat: 'repeat-x',
          }} />
        </>
      )}
      {children}
    </div>
  );
}

// Live ticking clock
function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date('2026-05-05T09:24:31'));
  useEffect(() => {
    const id = setInterval(() => setNow((n) => new Date(n.getTime() + 1000)), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

// Mono digit clock
function MonoClock({ time, size = 48, color = TOKENS.ink }) {
  const t = `${pad2(time.getHours())}:${pad2(time.getMinutes())}:${pad2(time.getSeconds())}`;
  return (
    <div style={{
      fontFamily: TOKENS.fontMono, fontSize: size, fontWeight: 600,
      color, letterSpacing: '-0.02em', fontFeatureSettings: '"tnum"',
    }}>{t}</div>
  );
}

// Status pill
function StatusPill({ status, size = 'md' }) {
  const map = {
    tepat: { bg: TOKENS.ontimeBg, fg: TOKENS.ontime, label: 'TEPAT WAKTU' },
    telat: { bg: TOKENS.lateBg, fg: TOKENS.late, label: 'TELAT' },
    sp:    { bg: TOKENS.spBg, fg: TOKENS.sp, label: 'SP' },
    libur: { bg: TOKENS.ink04, fg: TOKENS.ink50, label: 'LIBUR' },
    izin:  { bg: TOKENS.ink04, fg: TOKENS.ink70, label: 'IZIN' },
  };
  const c = map[status] || map.tepat;
  const fs = size === 'sm' ? 10 : 11;
  const pad = size === 'sm' ? '2px 6px' : '3px 8px';
  return (
    <span style={{
      background: c.bg, color: c.fg, padding: pad, borderRadius: 3,
      fontFamily: TOKENS.fontMono, fontSize: fs, fontWeight: 700,
      letterSpacing: '0.08em',
    }}>{c.label}</span>
  );
}

// Section eyebrow
function Eyebrow({ children, color, style = {} }) {
  return (
    <div style={{
      fontFamily: TOKENS.fontMono, fontSize: 10, fontWeight: 600,
      letterSpacing: '0.18em', textTransform: 'uppercase',
      color: color || TOKENS.ink50, ...style,
    }}>{children}</div>
  );
}

// Big serif number / label combo
function Stat({ label, value, sub, color, mono = true, size = 32 }) {
  return (
    <div>
      <Eyebrow>{label}</Eyebrow>
      <div style={{
        fontFamily: mono ? TOKENS.fontMono : TOKENS.fontDisplay,
        fontSize: size, fontWeight: mono ? 600 : 400,
        lineHeight: 1, marginTop: 6, color: color || TOKENS.ink,
        letterSpacing: mono ? '-0.02em' : 0,
      }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: TOKENS.ink50, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// Mini map — abstract "GPS" view (no real map tiles)
function MiniMap({ inside = true, height = 140, scale = 1, animate = true, withPin = true }) {
  const accent = inside ? TOKENS.ontime : TOKENS.late;
  return (
    <div style={{
      position: 'relative', height, borderRadius: 6, overflow: 'hidden',
      background: '#1c1c1c',
      border: `1px solid ${TOKENS.ink}`,
    }}>
      {/* grid */}
      <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(244,241,234,0.06)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="320" height="200" fill="url(#grid)"/>
        {/* abstract roads */}
        <path d="M 0 80 Q 100 70 160 100 T 320 120" stroke="rgba(244,241,234,0.18)" strokeWidth="3" fill="none"/>
        <path d="M 80 0 Q 90 80 140 110 T 180 200" stroke="rgba(244,241,234,0.14)" strokeWidth="2" fill="none"/>
        <path d="M 220 0 L 200 200" stroke="rgba(244,241,234,0.10)" strokeWidth="1.5" fill="none"/>
        {/* office building footprint */}
        <rect x="148" y="88" width="28" height="22" fill="rgba(244,241,234,0.25)" stroke="rgba(244,241,234,0.5)" strokeWidth="0.5"/>
        <text x="180" y="84" fill="rgba(244,241,234,0.6)" fontSize="7" fontFamily="JetBrains Mono">D'AJIKS</text>
        {/* geofence circle */}
        <circle cx="162" cy="100" r="42" fill={accent} fillOpacity="0.10" stroke={accent} strokeWidth="1" strokeDasharray="3 3"/>
        {/* user pin */}
        {withPin && (
          <g transform={`translate(${inside ? 158 : 220}, ${inside ? 105 : 60})`}>
            {animate && <circle r="14" fill={accent} fillOpacity="0.4" style={{ transformOrigin: 'center', animation: 'pulseRing 2s ease-out infinite' }} />}
            <circle r="6" fill={accent} stroke={TOKENS.paper} strokeWidth="1.5"/>
          </g>
        )}
      </svg>
      {/* corner readout */}
      <div style={{
        position: 'absolute', left: 10, bottom: 8, color: TOKENS.paper,
        fontFamily: TOKENS.fontMono, fontSize: 9, opacity: 0.85,
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        <div>−6.8918°S</div>
        <div>107.6094°E</div>
      </div>
      <div style={{
        position: 'absolute', right: 10, top: 8,
        fontFamily: TOKENS.fontMono, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
        color: accent,
        padding: '3px 6px', border: `1px solid ${accent}`, borderRadius: 2,
      }}>{inside ? 'IN ZONE' : 'OUT OF ZONE'}</div>
    </div>
  );
}

// Bar chart — minimal
function BarRow({ label, value, max, color = TOKENS.ink, suffix = '' }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
      <div style={{ width: 38, fontFamily: TOKENS.fontMono, fontSize: 11, color: TOKENS.ink70 }}>{label}</div>
      <div style={{ flex: 1, height: 14, background: TOKENS.ink04, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: color }} />
      </div>
      <div style={{ width: 60, textAlign: 'right', fontFamily: TOKENS.fontMono, fontSize: 11, fontWeight: 600 }}>
        {value}{suffix}
      </div>
    </div>
  );
}

// Tabbar (mobile bottom)
function TabBar({ active, onTab }) {
  const tabs = [
    { id: 'home',     label: 'Beranda',    icon: 'home' },
    { id: 'history',  label: 'Riwayat',    icon: 'clock' },
    { id: 'rekap',    label: 'Rekap',      icon: 'doc' },
    { id: 'profile',  label: 'Profil',     icon: 'user' },
  ];
  const Icon = ({ n, on }) => {
    const c = on ? TOKENS.ink : TOKENS.ink50;
    const sw = 1.7;
    if (n === 'home') return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 11l9-8 9 8M5 9v11h5v-6h4v6h5V9" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>);
    if (n === 'clock') return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={c} strokeWidth={sw}/><path d="M12 7v5l3 2" stroke={c} strokeWidth={sw} strokeLinecap="round"/></svg>);
    if (n === 'doc') return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 3h9l4 4v14H6z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/><path d="M9 12h7M9 16h7M9 8h3" stroke={c} strokeWidth={sw} strokeLinecap="round"/></svg>);
    if (n === 'user') return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="3.5" stroke={c} strokeWidth={sw}/><path d="M5 20c1.5-4 4-6 7-6s5.5 2 7 6" stroke={c} strokeWidth={sw} strokeLinecap="round"/></svg>);
  };
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      borderTop: `1px solid ${TOKENS.ink15}`,
      background: TOKENS.paper, paddingBottom: 24, paddingTop: 8,
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onTab(t.id)} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          background: 'transparent', border: 'none', padding: '6px 0',
        }}>
          <Icon n={t.icon} on={active === t.id} />
          <div style={{
            fontFamily: TOKENS.fontMono, fontSize: 9, fontWeight: 600, letterSpacing: '0.08em',
            color: active === t.id ? TOKENS.ink : TOKENS.ink50,
          }}>{t.label.toUpperCase()}</div>
        </button>
      ))}
    </div>
  );
}

Object.assign(window, { Stamp, Ticket, useNow, MonoClock, StatusPill, Eyebrow, Stat, MiniMap, BarRow, TabBar });
