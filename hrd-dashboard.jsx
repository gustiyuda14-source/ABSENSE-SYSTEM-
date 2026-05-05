// hrd-dashboard.jsx — Manager/HRD desktop view inside MacWindow

function HRDDashboard() {
  const [section, setSection] = useState('overview');
  const [config, setConfig] = useState(SYSTEM_CONFIG);
  const [slipEmployee, setSlipEmployee] = useState(null);

  const sidebar = (
    <>
      <MacSidebarHeader title="REKAP" />
      <div onClick={() => setSection('overview')}><MacSidebarItem label="Ringkasan harian" selected={section === 'overview'} /></div>
      <div onClick={() => setSection('roster')}><MacSidebarItem label="Roster karyawan" selected={section === 'roster'} /></div>
      <div onClick={() => setSection('leaderboard')}><MacSidebarItem label="Papan disiplin" selected={section === 'leaderboard'} /></div>
      <MacSidebarHeader title="SANKSI & GAJI" />
      <div onClick={() => setSection('sp')}><MacSidebarItem label="Surat peringatan" selected={section === 'sp'} /></div>
      <div onClick={() => setSection('payroll')}><MacSidebarItem label="Potongan gaji" selected={section === 'payroll'} /></div>
      <div onClick={() => setSection('leniency')}><MacSidebarItem label="Sistem keringanan" selected={section === 'leniency'} /></div>
      <MacSidebarHeader title="PENGATURAN" />
      <div onClick={() => setSection('settings')}><MacSidebarItem label="Konfigurasi sistem" selected={section === 'settings'} /></div>
      <div onClick={() => setSection('outlets')}><MacSidebarItem label="Lokasi & geofence" selected={section === 'outlets'} /></div>
    </>
  );

  return (
    <MacWindow width={1080} height={720} title="D'AJIKS · Sistem Absensi" sidebar={sidebar}>
      <div style={{
        background: TOKENS.paper, minHeight: '100%', padding: 24,
        fontFamily: TOKENS.fontUI, color: TOKENS.ink,
      }}>
        {section === 'overview' && <OverviewSection />}
        {section === 'roster' && <RosterSection />}
        {section === 'leaderboard' && <LeaderboardHRD />}
        {section === 'sp' && <SPSection />}
        {section === 'payroll' && <PayrollSection onOpenSlip={setSlipEmployee} />}
        {section === 'leniency' && <LeniencySection leaderboard={LEADERBOARD} conductHistory={CONDUCT_HISTORY} onApplyReduction={(empId, reduction, reason) => {
          CONDUCT_HISTORY[empId].adjustments.push({ reduction, reason });
        }} />}
        {section === 'settings' && <SettingsSection config={config} onConfigChange={setConfig} />}
        {section === 'outlets' && <OutletsSection />}
      </div>
      {slipEmployee && (
        <SlipExportDialog
          employee={slipEmployee}
          history={generateHistory()}
          config={config}
          onClose={() => setSlipEmployee(null)}
        />
      )}
    </MacWindow>
  );
}

function OverviewSection() {
  const [weekData, setWeekData] = useState(HRD_WEEK);
  const [todayData, setTodayData] = useState(HRD_WEEK[HRD_WEEK.length - 1]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const result = await window.dataService.getPayrollReport(
          today.getFullYear(),
          today.getMonth() + 1
        );
        if (result.success && result.data) {
          setTodayData(result.data);
        }
      } catch (error) {
        console.error('Failed to load payroll report:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Setup WebSocket for real-time updates
  useEffect(() => {
    if (!window.getWSClient) return;
    const wsClient = window.getWSClient();

    const handleCheckIn = (data) => {
      console.log('Real-time: Employee checked in', data);
      setTodayData(prev => ({
        ...prev,
        totalPresent: (prev.totalPresent || 0) + 1,
      }));
    };

    const handleCheckOut = (data) => {
      console.log('Real-time: Employee checked out', data);
    };

    wsClient.on('attendance:checked-in', handleCheckIn);
    wsClient.on('attendance:checked-out', handleCheckOut);

    return () => {
      wsClient.off('attendance:checked-in', handleCheckIn);
      wsClient.off('attendance:checked-out', handleCheckOut);
    };
  }, []);

  const totalToday = todayData;
  const weekTotal = weekData.reduce((s, d) => s + d.totalPenalty, 0);
  const maxPenalty = Math.max(...weekData.map(d => d.totalPenalty));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <Eyebrow>RINGKASAN</Eyebrow>
          <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 36, fontStyle: 'italic', marginTop: 4 }}>
            Senin, 5 Mei 2026
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={btnGhost}>Ekspor CSV</button>
          <button style={btnSolid}>Ekspor laporan PDF →</button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <KpiCard label="HADIR HARI INI" value={loading ? '...' : todayData?.totalPresent || '13'} sub={`dari 17 karyawan`} />
        <KpiCard label="TELAT" value={loading ? '...' : todayData?.lateDays || '4'} sub={`${fmtMin(todayData?.totalLateMinutes || 58)} total`} accent={TOKENS.late} />
        <KpiCard label="POTONGAN HARI INI" value={loading ? '...' : fmtRupiah(todayData?.totalPenalty || 290000)} sub={`vs kemarin: ${fmtRupiah(220000)}`} mono accent={TOKENS.late} small />
        <KpiCard label="SP AKTIF" value={loading ? '...' : todayData?.activeSanctions || '3'} sub="2 SP-1, 1 SP-2" accent={TOKENS.sp} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 18 }}>
        <Ticket padding={16}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Eyebrow>TELAT 7 HARI TERAKHIR</Eyebrow>
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 11, color: TOKENS.ink70 }}>
              Total: {fmtRupiah(weekTotal)}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140, marginTop: 16, paddingBottom: 24, position: 'relative' }}>
            {weekData.map((d, i) => {
              const h = maxPenalty > 0 ? (d.totalPenalty / maxPenalty) * 100 : 0;
              const isToday = i === weekData.length - 1;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontFamily: TOKENS.fontMono, fontSize: 9, color: TOKENS.ink50, marginBottom: 4 }}>
                    {(d.totalPenalty/1000)|0}k
                  </div>
                  <div style={{
                    width: '100%', height: `${h}%`, minHeight: 4,
                    background: isToday ? TOKENS.late : TOKENS.ink,
                  }} />
                  <div style={{ position: 'absolute', bottom: 0, fontFamily: TOKENS.fontMono, fontSize: 10, color: TOKENS.ink70, marginTop: 6 }}>
                    {d.day}
                  </div>
                </div>
              );
            })}
          </div>
        </Ticket>

        <Ticket padding={16}>
          <Eyebrow>BREAKDOWN PER DEPARTEMEN</Eyebrow>
          <div style={{ marginTop: 14 }}>
            <BarRow label="BAR" value={28} max={120} suffix="m" color={TOKENS.late} />
            <BarRow label="BIL" value={42} max={120} suffix="m" color={TOKENS.late} />
            <BarRow label="KIT" value={14} max={120} suffix="m" color={TOKENS.late} />
            <div style={{ height: 8 }} />
            <Eyebrow>POTONGAN</Eyebrow>
            <div style={{ marginTop: 10 }}>
              <BarRow label="BAR" value={140} max={650} suffix="k" color={TOKENS.ink} />
              <BarRow label="BIL" value={210} max={650} suffix="k" color={TOKENS.ink} />
              <BarRow label="KIT" value={70} max={650} suffix="k" color={TOKENS.ink} />
            </div>
          </div>
        </Ticket>
      </div>

      {/* Live feed */}
      <div style={{ marginTop: 18 }}>
        <Eyebrow>STEMPEL HARI INI · LIVE</Eyebrow>
        <Ticket padding={0} style={{ marginTop: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: TOKENS.ink, color: TOKENS.paper }}>
                {['JAM', 'KARYAWAN', 'SHIFT', 'TARGET', 'TELAT', 'POTONGAN', 'LOKASI', 'STATUS'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontFamily: TOKENS.fontMono, fontSize: 10, fontWeight: 600, letterSpacing: '0.12em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LIVE_FEED.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${TOKENS.ink08}` }}>
                  <td className="mono" style={{ padding: '10px 14px', fontWeight: 600 }}>{r.time}</td>
                  <td style={{ padding: '10px 14px' }}>{r.name}</td>
                  <td style={{ padding: '10px 14px', color: TOKENS.ink70, fontSize: 12 }}>{r.shift}</td>
                  <td className="mono" style={{ padding: '10px 14px', color: TOKENS.ink70 }}>{r.target}</td>
                  <td className="mono" style={{ padding: '10px 14px', fontWeight: 700, color: r.late > 0 ? TOKENS.late : TOKENS.ontime }}>
                    {r.late > 0 ? `+${r.late}m` : '—'}
                  </td>
                  <td className="mono" style={{ padding: '10px 14px', fontWeight: 600, color: r.late > 0 ? TOKENS.late : TOKENS.ink50 }}>
                    {r.late > 0 ? `−${fmtRupiah(r.late * 5000)}` : '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontFamily: TOKENS.fontMono, fontSize: 11, color: r.inZone ? TOKENS.ontime : TOKENS.late }}>
                      {r.inZone ? '● dalam zona' : '○ luar zona'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}><StatusPill status={r.status} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Ticket>
      </div>
    </div>
  );
}

const LIVE_FEED = [
  { time: '09:28', name: 'Sari Wulandari', shift: 'Kitchen S1', target: '09:30', late: 0, inZone: true, status: 'tepat' },
  { time: '09:31', name: 'Dimas Aditya',   shift: 'Barista S1', target: '09:30', late: 1, inZone: true, status: 'telat' },
  { time: '09:38', name: 'Rangga Pratama', shift: 'Barista S1', target: '09:30', late: 8, inZone: true, status: 'telat' },
  { time: '09:42', name: 'Nadia Lestari',  shift: 'Barista S1', target: '09:30', late: 12, inZone: true, status: 'telat' },
  { time: '10:28', name: 'Bagas Saputra',  shift: 'Billiard S1', target: '10:30', late: 0, inZone: true, status: 'tepat' },
  { time: '10:55', name: 'Farhan Maulana', shift: 'Billiard S1', target: '10:30', late: 25, inZone: true, status: 'telat' },
  { time: '11:08', name: 'Ratna Dewi',     shift: 'Billiard S1', target: '10:30', late: 38, inZone: false, status: 'sp' },
];

function KpiCard({ label, value, sub, accent, mono, small }) {
  return (
    <Ticket padding={14}>
      <Eyebrow>{label}</Eyebrow>
      <div style={{
        fontFamily: mono ? TOKENS.fontMono : TOKENS.fontDisplay,
        fontSize: small ? 22 : 30, fontWeight: mono ? 700 : 400,
        fontStyle: mono ? 'normal' : 'italic',
        marginTop: 6, color: accent || TOKENS.ink, lineHeight: 1, letterSpacing: mono ? '-0.02em' : 0,
      }}>{value}</div>
      <div style={{ fontSize: 11, color: TOKENS.ink50, marginTop: 6, fontFamily: TOKENS.fontMono }}>{sub}</div>
    </Ticket>
  );
}

const btnGhost = {
  padding: '8px 14px', background: 'transparent', border: `1px solid ${TOKENS.ink}`,
  fontFamily: TOKENS.fontMono, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
  borderRadius: 4, color: TOKENS.ink,
};
const btnSolid = {
  padding: '8px 14px', background: TOKENS.ink, border: 'none', color: TOKENS.paper,
  fontFamily: TOKENS.fontMono, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
  borderRadius: 4,
};

function RosterSection() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        // Load payroll report to get employee data with their stats
        const today = new Date();
        const result = await window.dataService.getPayrollReport(
          today.getFullYear(),
          today.getMonth() + 1
        );
        if (result.success && result.data && Array.isArray(result.data)) {
          setEmployees(result.data);
        } else {
          // Fallback to hardcoded data
          setEmployees(LEADERBOARD);
        }
      } catch (error) {
        console.error('Failed to load employees:', error);
        setEmployees(LEADERBOARD);
      } finally {
        setLoading(false);
      }
    };
    loadEmployees();
  }, []);

  const displayEmployees = employees.length > 0 ? employees : LEADERBOARD;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: TOKENS.ink70 }}>
        Memuat roster...
      </div>
    );
  }

  return (
    <div>
      <Eyebrow>ROSTER</Eyebrow>
      <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 32, fontStyle: 'italic', marginTop: 4, marginBottom: 18 }}>
        {displayEmployees.length} karyawan aktif
      </div>
      <Ticket padding={0} style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: TOKENS.ink, color: TOKENS.paper }}>
              {['ID', 'NAMA', 'PERAN', 'SHIFT', 'TELAT BULAN INI', 'POTONGAN', 'STATUS'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontFamily: TOKENS.fontMono, fontSize: 10, fontWeight: 600, letterSpacing: '0.12em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayEmployees.map(p => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${TOKENS.ink08}` }}>
                <td className="mono" style={{ padding: '10px 14px', color: TOKENS.ink70 }}>{p.id}</td>
                <td style={{ padding: '10px 14px', fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: '10px 14px' }}>{p.role}</td>
                <td className="mono" style={{ padding: '10px 14px', color: TOKENS.ink70 }}>S1</td>
                <td className="mono" style={{ padding: '10px 14px', fontWeight: 700, color: p.totalLate > 0 ? TOKENS.late : TOKENS.ontime }}>
                  {p.totalLate > 0 ? `${p.totalLate}m` : '0'}
                </td>
                <td className="mono" style={{ padding: '10px 14px', fontWeight: 600 }}>
                  {p.penalty > 0 ? `−${fmtRupiah(p.penalty)}` : '—'}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  {p.sp ? <Stamp color={TOKENS.sp} size="sm">{p.sp}</Stamp> :
                    p.totalLate === 0 ? <span style={{ fontFamily: TOKENS.fontMono, fontSize: 10, color: TOKENS.ontime, fontWeight: 600 }}>● BERSIH</span> :
                    <span style={{ fontFamily: TOKENS.fontMono, fontSize: 10, color: TOKENS.ink50, fontWeight: 600 }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Ticket>
    </div>
  );
}

function LeaderboardHRD() {
  return (
    <div>
      <Eyebrow>PAPAN DISIPLIN</Eyebrow>
      <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 32, fontStyle: 'italic', marginTop: 4, marginBottom: 18 }}>
        Mei 2026
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
        {LEADERBOARD.slice(0, 3).map(p => (
          <Ticket key={p.id} padding={20} style={{ background: p.rank === 1 ? TOKENS.ink : TOKENS.card, color: p.rank === 1 ? TOKENS.paper : TOKENS.ink }}>
            <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 64, fontStyle: 'italic', lineHeight: 1, color: TOKENS.late }}>
              0{p.rank}
            </div>
            <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 22, fontStyle: 'italic', marginTop: 8 }}>{p.name}</div>
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 10, color: p.rank === 1 ? 'rgba(244,241,234,0.6)' : TOKENS.ink50, marginTop: 4, letterSpacing: '0.1em' }}>
              {p.role.toUpperCase()} · {p.onTimeStreak} HARI BERUNTUN
            </div>
            <div className="pc-divider" style={{ margin: '14px 0', backgroundImage: `radial-gradient(circle, ${p.rank === 1 ? 'rgba(244,241,234,0.4)' : 'rgba(0,0,0,0.25)'} 1px, transparent 1.2px)` }} />
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 11, color: p.rank === 1 ? 'rgba(244,241,234,0.7)' : TOKENS.ink70 }}>
              {p.totalLate}m telat · {fmtRupiah(p.penalty)} potongan
            </div>
          </Ticket>
        ))}
      </div>
      <Ticket padding={0} style={{ overflow: 'hidden' }}>
        {LEADERBOARD.slice(3).map(p => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', padding: '14px 18px',
            borderBottom: `1px solid ${TOKENS.ink08}`, gap: 14,
          }}>
            <div style={{ width: 32, fontFamily: TOKENS.fontDisplay, fontSize: 22, fontStyle: 'italic', color: TOKENS.ink50 }}>
              {pad2(p.rank)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 11, color: TOKENS.ink50, marginTop: 2 }}>
                {p.role.toUpperCase()} · TELAT {p.totalLate}m
              </div>
            </div>
            {p.sp && <Stamp color={TOKENS.sp} size="sm">{p.sp}</Stamp>}
            <div style={{ width: 120, textAlign: 'right', fontFamily: TOKENS.fontMono, fontWeight: 700, color: TOKENS.late }}>
              −{fmtRupiah(p.penalty)}
            </div>
          </div>
        ))}
      </Ticket>
    </div>
  );
}

function SPSection() {
  const offenders = LEADERBOARD.filter(p => p.totalLate >= 30);
  return (
    <div>
      <Eyebrow>SURAT PERINGATAN</Eyebrow>
      <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 32, fontStyle: 'italic', marginTop: 4, marginBottom: 18 }}>
        Sanksi aktif
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {offenders.map(p => (
          <Ticket key={p.id} padding={0} style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 14, right: 14 }}>
              <Stamp color={TOKENS.sp} size="lg">{p.sp || 'SP-1'}</Stamp>
            </div>
            <div style={{ padding: 20 }}>
              <Eyebrow color={TOKENS.sp}>SURAT PERINGATAN</Eyebrow>
              <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 24, fontStyle: 'italic', marginTop: 8 }}>{p.name}</div>
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 11, color: TOKENS.ink50, marginTop: 4 }}>{p.id} · {p.role.toUpperCase()}</div>
            </div>
            <div className="pc-divider" style={{ margin: '0 12px' }} />
            <div style={{ padding: '16px 20px', fontSize: 13, lineHeight: 1.6, color: TOKENS.ink }}>
              Total telat <b>{p.totalLate} menit</b> bulan ini, melebihi ambang 30 menit per kejadian.
              <div style={{ marginTop: 10, padding: 10, background: TOKENS.spBg, borderRadius: 4 }}>
                <div style={{ fontFamily: TOKENS.fontMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: TOKENS.sp }}>SANKSI</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>• Tidak dapat jatah libur 2x<br/>• Wajib lembur 2x</div>
              </div>
            </div>
            <div className="pc-divider" style={{ margin: '0 12px' }} />
            <div style={{ padding: '14px 20px', display: 'flex', gap: 8 }}>
              <button style={{ ...btnGhost, flex: 1 }}>Cetak SP</button>
              <button style={{ ...btnSolid, flex: 1 }}>Kirim ke karyawan →</button>
            </div>
          </Ticket>
        ))}
      </div>
    </div>
  );
}

function PayrollSection({ onOpenSlip }) {
  const total = LEADERBOARD.reduce((s, p) => s + p.penalty, 0);
  return (
    <div>
      <Eyebrow>POTONGAN GAJI</Eyebrow>
      <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 32, fontStyle: 'italic', marginTop: 4 }}>
        Mei 2026 · {fmtRupiah(total)}
      </div>
      <div style={{ fontSize: 13, color: TOKENS.ink70, marginTop: 6, marginBottom: 18 }}>
        Hitungan: 1 menit telat = Rp {SYSTEM_CONFIG.penaltyPerMinute.toLocaleString('id-ID')}. Disetor ke kas internal.
      </div>
      <Ticket padding={0} style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: TOKENS.ink, color: TOKENS.paper }}>
              {['KARYAWAN', 'GAJI POKOK', 'TELAT', 'POTONGAN', 'BERSIH', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: h === 'BERSIH' || h === 'POTONGAN' || h === 'GAJI POKOK' ? 'right' : 'left', fontFamily: TOKENS.fontMono, fontSize: 10, fontWeight: 600, letterSpacing: '0.12em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LEADERBOARD.map(p => {
              const base = 3200000;
              return (
                <tr key={p.id} style={{ borderBottom: `1px solid ${TOKENS.ink08}` }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontFamily: TOKENS.fontMono, fontSize: 10, color: TOKENS.ink50, marginTop: 2 }}>{p.id}</div>
                  </td>
                  <td className="mono" style={{ padding: '12px 14px', textAlign: 'right' }}>{fmtRupiah(base)}</td>
                  <td className="mono" style={{ padding: '12px 14px', color: TOKENS.ink70 }}>{p.totalLate}m</td>
                  <td className="mono" style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: p.penalty > 0 ? TOKENS.late : TOKENS.ink50 }}>
                    {p.penalty > 0 ? `−${fmtRupiah(p.penalty)}` : '—'}
                  </td>
                  <td className="mono" style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700 }}>
                    {fmtRupiah(base - p.penalty)}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => onOpenSlip({ ...p, baseSalary: base })} style={{ ...btnGhost, padding: '4px 8px', fontSize: 10 }}>Slip →</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Ticket>
    </div>
  );
}

function OutletsSection() {
  return (
    <div>
      <Eyebrow>LOKASI &amp; GEOFENCE</Eyebrow>
      <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 32, fontStyle: 'italic', marginTop: 4, marginBottom: 18 }}>
        D'AJIKS Cihampelas
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <Ticket padding={0} style={{ overflow: 'hidden' }}>
          <div style={{ height: 360 }}>
            <MiniMap inside height="100%" animate={false} />
          </div>
        </Ticket>
        <div>
          <Ticket padding={16}>
            <Eyebrow>ALAMAT</Eyebrow>
            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 8, lineHeight: 1.5 }}>
              {OFFICE.address}
            </div>
            <div className="pc-divider" style={{ margin: '14px 0' }} />
            <Eyebrow>KOORDINAT</Eyebrow>
            <div className="mono" style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>
              −6.8918°S<br/>107.6094°E
            </div>
            <div className="pc-divider" style={{ margin: '14px 0' }} />
            <Eyebrow>RADIUS GEOFENCE</Eyebrow>
            <div className="mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>{OFFICE.radius} m</div>
            <div style={{ fontSize: 11, color: TOKENS.ink50, marginTop: 4, fontFamily: TOKENS.fontMono }}>
              karyawan harus berada dalam radius ini untuk dapat stempel kartu.
            </div>
          </Ticket>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HRDDashboard });
