// mobile-screens.jsx — Home, History, Rekap, Profile, Notifications, Login

function HomeScreen({ onCheckIn, onCheckOut, onOpen, history, hasCheckedIn }) {
  const now = useNow();
  const shift = SHIFTS[CURRENT_USER.shift];
  // Last 7 days mini-strip
  const last7 = history.slice(-7);
  const monthStats = useMemo(() => {
    const lateDays = history.filter((d) => d.late > 0).length;
    const totalLate = history.reduce((s, d) => s + d.late, 0);
    const totalPenalty = history.reduce((s, d) => s + d.penalty, 0);
    const onTime = history.filter((d) => d.status === 'tepat').length;
    return { lateDays, totalLate, totalPenalty, onTime };
  }, [history]);

  return (
    <div style={{ background: TOKENS.paper, minHeight: '100%', paddingBottom: 16 }}>
      {/* Header */}
      <div style={{ padding: '60px 20px 16px', background: TOKENS.ink, color: TOKENS.paper }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Eyebrow color="rgba(244,241,234,0.5)">D'AJIKS · KARYAWAN</Eyebrow>
            <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 32, fontStyle: 'italic', marginTop: 6, lineHeight: 1 }}>
              Halo, {CURRENT_USER.name.split(' ')[0]}.
            </div>
            <div style={{ fontSize: 13, color: 'rgba(244,241,234,0.6)', marginTop: 6, fontFamily: TOKENS.fontMono }}>
              {shift.label}
            </div>
          </div>
          <button onClick={() => onOpen('notif')} style={{
            background: 'transparent', border: '1px solid rgba(244,241,234,0.3)', color: TOKENS.paper,
            width: 36, height: 36, borderRadius: 18, position: 'relative', padding: 0
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: 'middle' }}>
              <path d="M6 8a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" stroke={TOKENS.paper} strokeWidth="1.5" />
              <path d="M10 21a2 2 0 004 0" stroke={TOKENS.paper} strokeWidth="1.5" />
            </svg>
            <div style={{ position: 'absolute', top: 4, right: 6, width: 8, height: 8, borderRadius: 4, background: TOKENS.late }} />
          </button>
        </div>

        {/* Live clock */}
        <div style={{
          marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          paddingTop: 14, borderTop: '1px solid rgba(244,241,234,0.15)'
        }}>
          <div>
            <Eyebrow color="rgba(244,241,234,0.5)">SEKARANG</Eyebrow>
            <div style={{ marginTop: 4 }}><MonoClock time={now} size={36} color={TOKENS.paper} /></div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Eyebrow color="rgba(244,241,234,0.5)">TARGET MASUK</Eyebrow>
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 22, fontWeight: 600, marginTop: 6 }}>{shift.start}</div>
          </div>
        </div>
      </div>

      {/* Punch CTA */}
      <div style={{ padding: '16px 16px 0' }}>
        {!hasCheckedIn ?
        <button onClick={onCheckIn} style={{
          width: '100%', padding: '18px 20px', borderRadius: 6,
          background: TOKENS.late, color: TOKENS.paper, border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 10, letterSpacing: '0.16em', opacity: 0.8 }}>BELUM CHECK-IN HARI INI</div>
              <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 22, fontStyle: 'italic', marginTop: 4 }}>Stempel kartu masuk →</div>
            </div>
            <div style={{
            width: 44, height: 44, borderRadius: 22, border: `2px solid ${TOKENS.paper}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
          }}>→</div>
          </button> :

        <button onClick={onCheckOut} style={{
          width: '100%', padding: '18px 20px', borderRadius: 6,
          background: TOKENS.ink, color: TOKENS.paper, border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 10, letterSpacing: '0.16em', opacity: 0.6 }}>SUDAH MASUK · 09:38</div>
              <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 22, fontStyle: 'italic', marginTop: 4 }}>Stempel kartu pulang →</div>
            </div>
            <div style={{
            width: 44, height: 44, borderRadius: 22, border: `2px solid ${TOKENS.paper}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
          }}>→</div>
          </button>
        }
      </div>

      {/* Bulan ini stats */}
      <div style={{ padding: '20px 16px 0' }}>
        <Eyebrow>BULAN INI · MEI 2026</Eyebrow>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Ticket padding={14}>
            <Stat label="HARI TEPAT" value={monthStats.onTime} sub={`dari ${history.filter((d) => d.status !== 'libur').length} hari kerja`} />
          </Ticket>
          <Ticket padding={14}>
            <Stat label="HARI TELAT" value={monthStats.lateDays} color={TOKENS.late} sub={`${fmtMin(monthStats.totalLate)} total`} />
          </Ticket>
          <div style={{ gridColumn: '1 / -1' }}>
            <Ticket padding={14} style={{ background: TOKENS.ink, color: TOKENS.paper }} dark>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <Eyebrow color="rgba(244,241,234,0.6)">PROYEKSI POTONGAN GAJI</Eyebrow>
                  <div style={{ fontFamily: TOKENS.fontMono, fontSize: 26, fontWeight: 700, marginTop: 6, color: TOKENS.late, letterSpacing: '-0.02em' }}>
                    −{fmtRupiah(monthStats.totalPenalty)}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(244,241,234,0.5)', marginTop: 4, fontFamily: TOKENS.fontMono }}>
                    dari gaji pokok {fmtRupiah(CURRENT_USER.baseSalary)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Eyebrow color="rgba(244,241,234,0.6)">SISA</Eyebrow>
                  <div style={{ fontFamily: TOKENS.fontMono, fontSize: 14, fontWeight: 600, marginTop: 6 }}>
                    {fmtRupiah(CURRENT_USER.baseSalary - monthStats.totalPenalty)}
                  </div>
                </div>
              </div>
              {/* progress bar showing penalty share */}
              <div style={{ marginTop: 12, height: 6, background: 'rgba(244,241,234,0.12)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  width: `${monthStats.totalPenalty / CURRENT_USER.baseSalary * 100}%`,
                  height: '100%', background: TOKENS.late
                }} />
              </div>
            </Ticket>
          </div>
        </div>
      </div>

      {/* 7-day strip */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Eyebrow>7 HARI TERAKHIR</Eyebrow>
          <button onClick={() => onOpen('history')} style={{
            background: 'transparent', border: 'none', padding: 0,
            fontFamily: TOKENS.fontMono, fontSize: 11, color: TOKENS.ink70
          }}>Lihat semua →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginTop: 10 }}>
          {last7.map((d, i) => {
            const cMap = { tepat: TOKENS.ontime, telat: TOKENS.late, sp: TOKENS.sp, libur: TOKENS.ink15 };
            const c = cMap[d.status];
            return (
              <button key={i} onClick={() => onOpen('day', d)} style={{
                background: 'transparent', border: 'none', padding: 0, cursor: 'pointer'
              }}>
                <div style={{
                  background: c, height: 44, borderRadius: 3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: d.status === 'libur' ? TOKENS.ink50 : TOKENS.paper,
                  fontFamily: TOKENS.fontMono, fontSize: 11, fontWeight: 700
                }}>
                  {d.late > 0 ? `+${d.late}` : d.status === 'libur' ? '—' : '✓'}
                </div>
                <div style={{ marginTop: 4, fontFamily: TOKENS.fontMono, fontSize: 10, textAlign: 'center', color: TOKENS.ink50 }}>
                  {pad2(d.date.getDate())}
                </div>
              </button>);

          })}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ padding: '20px 16px 0' }}>
        <Eyebrow>AKSI</Eyebrow>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <QuickAction label="Ajukan Izin" sub="Cuti / sakit" onClick={() => onOpen('izin')} />
          <QuickAction label="Leaderboard" sub="Papan disiplin" onClick={() => onOpen('leaderboard')} />
        </div>
      </div>
    </div>);

}

function QuickAction({ label, sub, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: TOKENS.card, border: `1px solid ${TOKENS.ink15}`, borderRadius: 6,
      padding: 14, textAlign: 'left'
    }}>
      <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 18, fontStyle: 'italic', lineHeight: 1 }}>{label}</div>
      <div style={{ fontSize: 11, color: TOKENS.ink50, marginTop: 4, fontFamily: TOKENS.fontMono }}>{sub}</div>
    </button>);

}

// ─────────── HISTORY ───────────
function HistoryScreen({ history, onOpen }) {
  return (
    <div style={{ background: TOKENS.paper, minHeight: '100%' }}>
      <div style={{ padding: '60px 20px 16px' }}>
        <Eyebrow>RIWAYAT KARTU</Eyebrow>
        <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 36, fontStyle: 'italic', marginTop: 6 }}>30 hari terakhir</div>
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        {[...history].reverse().map((d, i) =>
        <button key={i} onClick={() => d.status !== 'libur' && onOpen('day', d)} style={{
          display: 'flex', width: '100%', alignItems: 'center', gap: 12,
          padding: '14px 12px', background: TOKENS.card, border: `1px solid ${TOKENS.ink15}`,
          borderRadius: 6, marginBottom: 6, textAlign: 'left'
        }}>
            <div style={{
            width: 44, textAlign: 'center', borderRight: `1px solid ${TOKENS.ink15}`, paddingRight: 10
          }}>
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 10, color: TOKENS.ink50 }}>
                {dayNamesId[d.date.getDay()]}
              </div>
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 22, fontWeight: 700, lineHeight: 1, marginTop: 2 }}>
                {pad2(d.date.getDate())}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <StatusPill status={d.status} size="sm" />
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 12, color: TOKENS.ink70, marginTop: 4 }}>
                {d.status === 'libur' ? 'Hari libur' : `Masuk ${d.checkIn} · Pulang ${d.checkOut}`}
              </div>
            </div>
            {d.late > 0 &&
          <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: TOKENS.fontMono, fontSize: 14, fontWeight: 700, color: TOKENS.late }}>
                  +{d.late}m
                </div>
                <div style={{ fontFamily: TOKENS.fontMono, fontSize: 11, color: TOKENS.ink70 }}>
                  −{fmtRupiah(d.penalty)}
                </div>
              </div>
          }
          </button>
        )}
      </div>
    </div>);

}

// ─────────── DAY DETAIL ───────────
function DayDetailScreen({ day, onBack }) {
  if (!day) return null;
  const accent = day.status === 'tepat' ? TOKENS.ontime : day.status === 'sp' ? TOKENS.sp : TOKENS.late;
  return (
    <div style={{ background: TOKENS.paper, minHeight: '100%' }}>
      <div style={{ padding: '60px 20px 16px', background: TOKENS.ink, color: TOKENS.paper }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: '1px solid rgba(244,241,234,0.3)', color: TOKENS.paper,
          padding: '6px 10px', fontFamily: TOKENS.fontMono, fontSize: 11, marginBottom: 14
        }}>← KEMBALI</button>
        <Eyebrow color="rgba(244,241,234,0.5)">DETAIL KARTU</Eyebrow>
        <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 28, fontStyle: 'italic', marginTop: 6 }}>
          {fmtDateLong(day.date)}
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <Ticket padding={0}>
          <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Eyebrow>STATUS</Eyebrow>
              <div style={{ marginTop: 6 }}><StatusPill status={day.status} /></div>
            </div>
            {day.late > 0 &&
            <Stamp color={accent}>{day.status === 'sp' ? 'SP-2' : `+${day.late} MIN`}</Stamp>
            }
          </div>
          <div className="pc-divider" style={{ margin: '20px 12px' }} />
          <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <ReceiptRow label="MASUK" value={day.checkIn} mono />
            <ReceiptRow label="PULANG" value={day.checkOut} mono />
            <ReceiptRow label="TARGET" value={SHIFTS[CURRENT_USER.shift].start} mono />
            <ReceiptRow label="TELAT" value={fmtMin(day.late)} mono />
          </div>
          <div className="pc-divider" style={{ margin: '20px 12px' }} />
          <div style={{ padding: '0 20px 16px' }}>
            <Eyebrow>LOKASI STEMPEL</Eyebrow>
            <div style={{ marginTop: 8 }}>
              <MiniMap inside height={120} animate={false} />
            </div>
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontFamily: TOKENS.fontMono, fontSize: 11, color: TOKENS.ink70 }}>
              <span>−6.8918°S, 107.6094°E</span>
              <span>{OFFICE.name}</span>
            </div>
          </div>
          <div className="pc-divider" style={{ margin: '0 12px 0' }} />
          <div style={{ padding: '16px 20px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Eyebrow>POTONGAN HARI INI</Eyebrow>
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 22, fontWeight: 700, color: day.penalty > 0 ? TOKENS.late : TOKENS.ontime }}>
                {day.penalty > 0 ? `−${fmtRupiah(day.penalty)}` : 'Rp 0'}
              </div>
            </div>
            {day.late > 0 &&
            <div style={{ fontSize: 12, color: TOKENS.ink70, marginTop: 8, fontFamily: TOKENS.fontMono }}>
                {day.late} menit × Rp 5.000
              </div>
            }
          </div>
        </Ticket>
      </div>
    </div>);

}

function ReceiptRow({ label, value, mono }) {
  return (
    <div>
      <Eyebrow>{label}</Eyebrow>
      <div style={{
        fontFamily: mono ? TOKENS.fontMono : TOKENS.fontUI,
        fontSize: 14, fontWeight: 600, marginTop: 4, color: TOKENS.ink
      }}>{value}</div>
    </div>);

}

// ─────────── REKAP BULANAN (slip) ───────────
function RekapScreen({ history }) {
  const stats = useMemo(() => {
    const totalLate = history.reduce((s, d) => s + d.late, 0);
    const totalPenalty = history.reduce((s, d) => s + d.penalty, 0);
    const onTime = history.filter((d) => d.status === 'tepat').length;
    const lateDays = history.filter((d) => d.late > 0).length;
    const spDays = history.filter((d) => d.status === 'sp').length;
    return { totalLate, totalPenalty, onTime, lateDays, spDays };
  }, [history]);
  const net = CURRENT_USER.baseSalary - stats.totalPenalty;

  return (
    <div style={{ background: TOKENS.paper, minHeight: '100%', paddingBottom: 16 }}>
      <div style={{ padding: '60px 20px 16px' }}>
        <Eyebrow>SLIP REKAPITULASI</Eyebrow>
        <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 36, fontStyle: 'italic', marginTop: 6, lineHeight: 1 }}>
          Mei 2026
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        <Ticket padding={0} style={{ background: TOKENS.card }}>
          <div style={{ padding: 20, display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <Eyebrow>KARYAWAN</Eyebrow>
              <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{CURRENT_USER.name}</div>
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 11, color: TOKENS.ink50, marginTop: 2 }}>
                {CURRENT_USER.id} · {SHIFTS[CURRENT_USER.shift].label}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Eyebrow>PERIODE</Eyebrow>
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                01 — 30 Mei
              </div>
            </div>
          </div>
          <div className="pc-divider" style={{ margin: '0 12px' }} />

          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <span style={{ fontSize: 13 }}>Gaji pokok</span>
              <span className="mono tnum" style={{ fontWeight: 600, fontSize: 14 }}>{fmtRupiah(CURRENT_USER.baseSalary)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <span style={{ fontSize: 13 }}>Total telat <span style={{ color: TOKENS.ink50 }}>({stats.totalLate}m × Rp 5.000)</span></span>
              <span className="mono tnum" style={{ fontWeight: 600, fontSize: 14, color: TOKENS.late }}>−{fmtRupiah(stats.totalPenalty)}</span>
            </div>
            <div className="pc-divider" style={{ margin: '14px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: TOKENS.fontDisplay, fontSize: 22, fontStyle: 'italic' }}>Diterima bersih</span>
              <span className="mono tnum" style={{ fontWeight: 700, fontSize: 22 }}>{fmtRupiah(net)}</span>
            </div>
          </div>

          <div className="pc-divider" style={{ margin: '0 12px' }} />

          <div style={{ padding: 20 }}>
            <Eyebrow>RINCIAN DISIPLIN</Eyebrow>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Stat label="HARI TEPAT" value={stats.onTime} />
              <Stat label="HARI TELAT" value={stats.lateDays} color={TOKENS.late} />
              <Stat label="TOTAL TELAT" value={fmtMin(stats.totalLate)} mono={false} size={20} />
              <Stat label="SP DITERBITKAN" value={stats.spDays} color={TOKENS.sp} />
            </div>
          </div>

          {stats.spDays > 0 &&
          <>
              <div className="pc-divider" style={{ margin: '0 12px' }} />
              <div style={{ padding: 20, background: TOKENS.spBg }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Stamp color={TOKENS.sp} size="sm">SP-2</Stamp>
                  <Eyebrow color={TOKENS.sp}>SANKSI BERLAKU</Eyebrow>
                </div>
                <div style={{ marginTop: 10, fontSize: 13, color: TOKENS.ink, lineHeight: 1.5 }}>
                  • Tidak dapat jatah libur <b>2x</b><br />
                  • Wajib lembur <b>2x</b><br />
                  Berlaku hingga 18 Mei 2026.
                </div>
              </div>
            </>
          }
        </Ticket>

        <button style={{
          marginTop: 14, width: '100%', height: 48, borderRadius: 6, border: `1px solid ${TOKENS.ink}`,
          background: TOKENS.ink, color: TOKENS.paper,
          fontFamily: TOKENS.fontMono, fontSize: 12, fontWeight: 700, letterSpacing: '0.12em'
        }}>UNDUH SLIP PDF →</button>
      </div>
    </div>);

}

// ─────────── PROFILE ───────────
function ProfileScreen({ onLogout, onOpen }) {
  return (
    <div style={{ background: TOKENS.paper, minHeight: '100%' }}>
      <div style={{ padding: '60px 20px 20px', background: TOKENS.ink, color: TOKENS.paper }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 6,
            background: `repeating-linear-gradient(135deg, rgba(244,241,234,0.15) 0 6px, rgba(244,241,234,0.08) 6px 12px)`,
            border: '1px solid rgba(244,241,234,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: TOKENS.fontDisplay, fontSize: 28, fontStyle: 'italic'
          }}>{CURRENT_USER.photo}</div>
          <div>
            <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 26, fontStyle: 'italic', lineHeight: 1 }}>{CURRENT_USER.name}</div>
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 11, color: 'rgba(244,241,234,0.6)', marginTop: 6 }}>
              {CURRENT_USER.id} · BERGABUNG {CURRENT_USER.joined.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <Ticket padding={0}>
          <ProfileRow label="Shift" value={SHIFTS[CURRENT_USER.shift].label} />
          <ProfileRow label="Jam target" value={`${SHIFTS[CURRENT_USER.shift].start} — ${SHIFTS[CURRENT_USER.shift].end}`} />
          <ProfileRow label="Gaji pokok" value={fmtRupiah(CURRENT_USER.baseSalary)} />
          <ProfileRow label="Lokasi kantor" value={OFFICE.name} />
          <ProfileRow label="Radius geofence" value={`${OFFICE.radius} meter`} last />
        </Ticket>

        <div style={{ marginTop: 14 }}>
          <Ticket padding={0}>
            <ProfileRow label="Notifikasi" arrow onClick={() => onOpen('notif')} />
            <ProfileRow label="Leaderboard disiplin" arrow onClick={() => onOpen('leaderboard')} />
            <ProfileRow label="Ajukan izin / cuti" arrow onClick={() => onOpen('izin')} last />
          </Ticket>
        </div>

        <button onClick={onLogout} style={{
          marginTop: 14, width: '100%', height: 48, borderRadius: 6, border: `1px solid ${TOKENS.ink15}`,
          background: 'transparent', color: TOKENS.late,
          fontFamily: TOKENS.fontMono, fontSize: 12, fontWeight: 700, letterSpacing: '0.12em'
        }}>KELUAR DARI AKUN</button>
      </div>
    </div>);

}

function ProfileRow({ label, value, arrow, onClick, last }) {
  return (
    <button onClick={onClick} disabled={!onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', textAlign: 'left',
      borderBottom: last ? 'none' : `1px solid ${TOKENS.ink08}`
    }}>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
      {value && <div style={{ fontFamily: TOKENS.fontMono, fontSize: 12, color: TOKENS.ink70 }}>{value}</div>}
      {arrow && <span style={{ color: TOKENS.ink50 }}>→</span>}
    </button>);

}

// ─────────── LOGIN ───────────
function LoginScreen({ onLogin }) {
  const [id, setId] = useState('EMP-014');
  const [pin, setPin] = useState('');
  return (
    <div style={{ background: TOKENS.ink, color: TOKENS.paper, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '80px 24px 0', flex: 1 }}>
        <Eyebrow color="rgba(244,241,234,0.5)">D'AJIKS · COFFEE &amp; BILLIARD</Eyebrow>
        <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 48, fontStyle: 'italic', lineHeight: 1, marginTop: 14 }}>
          Stempel<br />kartu Anda.
        </div>
        <div style={{ fontSize: 14, color: 'rgba(244,241,234,0.65)', marginTop: 14, lineHeight: 1.5 }}>
          Setiap menit dihitung. Setiap stempel dicatat. Disiplin adalah budaya — bukan beban.
        </div>

        <div style={{ marginTop: 36 }}>
          <Eyebrow color="rgba(244,241,234,0.5)">ID KARYAWAN</Eyebrow>
          <input value={id} onChange={(e) => setId(e.target.value)} style={{
            width: '100%', marginTop: 8, padding: '14px 0', background: 'transparent',
            border: 'none', borderBottom: '1px solid rgba(244,241,234,0.3)', color: TOKENS.paper,
            fontFamily: TOKENS.fontMono, fontSize: 18, fontWeight: 600, outline: 'none'
          }} />
        </div>
        <div style={{ marginTop: 24 }}>
          <Eyebrow color="rgba(244,241,234,0.5)">PIN</Eyebrow>
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••" style={{
            width: '100%', marginTop: 8, padding: '14px 0', background: 'transparent',
            border: 'none', borderBottom: '1px solid rgba(244,241,234,0.3)', color: TOKENS.paper,
            fontFamily: TOKENS.fontMono, fontSize: 18, fontWeight: 600, outline: 'none',
            letterSpacing: '0.4em'
          }} />
        </div>
      </div>

      <div style={{ padding: '0 24px 40px' }}>
        <button onClick={onLogin} style={{ ...{
            width: '100%', height: 56, borderRadius: 6, border: 'none',
            background: TOKENS.paper, color: TOKENS.ink,
            fontFamily: TOKENS.fontMono, fontSize: 13, fontWeight: 700, letterSpacing: '0.16em'
          }, fontFamily: "Bitter" }}>MASUK SISTEM →</button>
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: 'rgba(244,241,234,0.4)', fontFamily: TOKENS.fontMono }}>
          v1.0 · Untuk demo, tap MASUK SISTEM
        </div>
      </div>
    </div>);

}

// ─────────── NOTIFICATIONS ───────────
function NotifScreen({ onBack }) {
  return (
    <div style={{ background: TOKENS.paper, minHeight: '100%' }}>
      <div style={{ padding: '60px 20px 16px' }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: `1px solid ${TOKENS.ink15}`, color: TOKENS.ink,
          padding: '6px 10px', fontFamily: TOKENS.fontMono, fontSize: 11, marginBottom: 14
        }}>← KEMBALI</button>
        <Eyebrow>NOTIFIKASI</Eyebrow>
        <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 32, fontStyle: 'italic', marginTop: 6 }}>Peringatan &amp; sanksi</div>
      </div>
      <div style={{ padding: '0 16px 16px' }}>
        {NOTIFICATIONS.map((n) => {
          const cMap = { sp: TOKENS.sp, penalty: TOKENS.late, info: TOKENS.ink, reminder: TOKENS.ontime };
          const c = cMap[n.type];
          return (
            <div key={n.id} style={{
              padding: 14, background: TOKENS.card, border: `1px solid ${TOKENS.ink15}`,
              borderLeft: `4px solid ${c}`, borderRadius: 4, marginBottom: 8
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{n.title}</div>
                {n.unread && <div style={{ width: 8, height: 8, borderRadius: 4, background: c, flexShrink: 0, marginTop: 4 }} />}
              </div>
              <div style={{ fontSize: 12, color: TOKENS.ink70, marginTop: 6, lineHeight: 1.5 }}>{n.body}</div>
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 10, color: TOKENS.ink50, marginTop: 8, letterSpacing: '0.08em' }}>
                {n.time.toUpperCase()}
              </div>
            </div>);

        })}
      </div>
    </div>);

}

// ─────────── LEADERBOARD ───────────
function LeaderboardScreen({ onBack }) {
  return (
    <div style={{ background: TOKENS.paper, minHeight: '100%' }}>
      <div style={{ padding: '60px 20px 20px', background: TOKENS.ink, color: TOKENS.paper }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: '1px solid rgba(244,241,234,0.3)', color: TOKENS.paper,
          padding: '6px 10px', fontFamily: TOKENS.fontMono, fontSize: 11, marginBottom: 14
        }}>← KEMBALI</button>
        <Eyebrow color="rgba(244,241,234,0.5)">PAPAN DISIPLIN</Eyebrow>
        <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 32, fontStyle: 'italic', marginTop: 6 }}>Peringkat Mei 2026</div>
        <div style={{ fontSize: 12, color: 'rgba(244,241,234,0.6)', marginTop: 6 }}>Diurutkan dari paling sedikit telat.</div>
      </div>
      <div style={{ padding: 16 }}>
        {LEADERBOARD.map((p) =>
        <div key={p.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: 14, background: p.isMe ? TOKENS.ink : TOKENS.card,
          color: p.isMe ? TOKENS.paper : TOKENS.ink,
          border: p.isMe ? 'none' : `1px solid ${TOKENS.ink15}`, borderRadius: 4, marginBottom: 6
        }}>
            <div style={{
            width: 32, fontFamily: TOKENS.fontDisplay, fontSize: 24, fontStyle: 'italic',
            color: p.rank <= 3 ? TOKENS.late : p.isMe ? 'rgba(244,241,234,0.5)' : TOKENS.ink50
          }}>{pad2(p.rank)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', gap: 6, alignItems: 'center' }}>
                {p.name} {p.isMe && <span style={{ fontFamily: TOKENS.fontMono, fontSize: 9, padding: '1px 5px', background: TOKENS.late, borderRadius: 2, letterSpacing: '0.1em' }}>ANDA</span>}
              </div>
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 10, color: p.isMe ? 'rgba(244,241,234,0.6)' : TOKENS.ink50, marginTop: 3 }}>
                {p.role.toUpperCase()} · {p.onTimeStreak > 0 ? `${p.onTimeStreak} hari beruntun` : `telat ${p.totalLate}m`}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {p.sp && <Stamp color={TOKENS.sp} size="sm" style={{ marginBottom: 4 }}>{p.sp}</Stamp>}
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 13, fontWeight: 700, color: p.penalty > 0 ? TOKENS.late : TOKENS.ontime }}>
                {p.penalty > 0 ? `−${fmtRupiah(p.penalty).replace('Rp ', 'Rp')}` : 'BERSIH'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>);

}

// ─────────── IZIN form ───────────
function IzinScreen({ onBack }) {
  const [type, setType] = useState('cuti');
  return (
    <div style={{ background: TOKENS.paper, minHeight: '100%' }}>
      <div style={{ padding: '60px 20px 16px' }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: `1px solid ${TOKENS.ink15}`, color: TOKENS.ink,
          padding: '6px 10px', fontFamily: TOKENS.fontMono, fontSize: 11, marginBottom: 14
        }}>← KEMBALI</button>
        <Eyebrow>FORM IZIN</Eyebrow>
        <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 32, fontStyle: 'italic', marginTop: 6 }}>Ajukan ketidakhadiran</div>
      </div>
      <div style={{ padding: '0 16px' }}>
        <Ticket padding={16}>
          <Eyebrow>JENIS</Eyebrow>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 8 }}>
            {[['cuti', 'Cuti'], ['sakit', 'Sakit'], ['izin', 'Izin lain']].map(([k, l]) =>
            <button key={k} onClick={() => setType(k)} style={{
              padding: '12px 0', borderRadius: 4,
              background: type === k ? TOKENS.ink : 'transparent',
              color: type === k ? TOKENS.paper : TOKENS.ink,
              border: `1px solid ${type === k ? TOKENS.ink : TOKENS.ink15}`,
              fontFamily: TOKENS.fontMono, fontSize: 12, fontWeight: 600, letterSpacing: '0.08em'
            }}>{l}</button>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <Eyebrow>TANGGAL</Eyebrow>
            <input type="text" defaultValue="06 Mei 2026" style={{
              width: '100%', marginTop: 8, padding: '12px 14px', background: TOKENS.paper,
              border: `1px solid ${TOKENS.ink15}`, borderRadius: 4,
              fontFamily: TOKENS.fontMono, fontSize: 14, fontWeight: 600
            }} />
          </div>

          <div style={{ marginTop: 16 }}>
            <Eyebrow>ALASAN</Eyebrow>
            <textarea rows={4} placeholder="Tulis alasan Anda..." style={{
              width: '100%', marginTop: 8, padding: '12px 14px', background: TOKENS.paper,
              border: `1px solid ${TOKENS.ink15}`, borderRadius: 4, resize: 'none',
              fontFamily: TOKENS.fontUI, fontSize: 13, lineHeight: 1.5
            }} />
          </div>

          <button style={{
            marginTop: 16, width: '100%', height: 48, borderRadius: 4, border: 'none',
            background: TOKENS.ink, color: TOKENS.paper,
            fontFamily: TOKENS.fontMono, fontSize: 12, fontWeight: 700, letterSpacing: '0.12em'
          }}>KIRIM PERMOHONAN →</button>
        </Ticket>
      </div>
    </div>);

}

Object.assign(window, {
  HomeScreen, HistoryScreen, DayDetailScreen, RekapScreen, ProfileScreen,
  LoginScreen, NotifScreen, LeaderboardScreen, IzinScreen
});