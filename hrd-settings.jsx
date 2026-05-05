// hrd-settings.jsx — System configuration & employee leniency/pardon screen

function SettingsSection({ config, onConfigChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(config);

  const handleSave = () => {
    onConfigChange(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(config);
    setEditing(false);
  };

  const handleChange = (key, value) => {
    setDraft({ ...draft, [key]: value });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <Eyebrow>KONFIGURASI SISTEM</Eyebrow>
          <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 36, fontStyle: 'italic', marginTop: 4 }}>
            Aturan absensi
          </div>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} style={{ ...btnSolid, padding: '8px 14px' }}>
            Ubah pengaturan →
          </button>
        )}
      </div>

      {!editing ? (
        // View mode
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <ConfigCard
            label="RADIUS GEOFENCE"
            value={`${config.geofenceRadius} meter`}
            detail="Jarak minimum dari kantor untuk stempel kartu"
          />
          <ConfigCard
            label="POTONGAN PER MENIT"
            value={`Rp ${config.penaltyPerMinute.toLocaleString('id-ID')}`}
            detail="Besaran potongan untuk setiap menit keterlambatan"
          />
          <ConfigCard
            label="THRESHOLD SP-2"
            value={`≥ ${config.telat30MinThreshold} menit`}
            detail="Telat melebihi threshold = SP-2 (tidak libur 2x, lembur 2x)"
          />
          <ConfigCard
            label="GRACE PERIOD"
            value={`${config.gracePeriodMinutes || '0'} menit`}
            detail="Toleransi sebelum dianggap telat"
          />
          {config.maxMonthlyPenalty && (
            <ConfigCard
              label="MAX POTONGAN BULANAN"
              value={`Rp ${config.maxMonthlyPenalty.toLocaleString('id-ID')}`}
              detail="Batas maksimal potongan per bulan (capped)"
            />
          )}
        </div>
      ) : (
        // Edit mode
        <Ticket padding={20}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <SettingInput
              label="Radius geofence (m)"
              type="number"
              value={draft.geofenceRadius}
              onChange={(v) => handleChange('geofenceRadius', parseInt(v))}
            />
            <SettingInput
              label="Potongan per menit (Rp)"
              type="number"
              value={draft.penaltyPerMinute}
              onChange={(v) => handleChange('penaltyPerMinute', parseInt(v))}
            />
            <SettingInput
              label="Threshold SP-2 (menit)"
              type="number"
              value={draft.telat30MinThreshold}
              onChange={(v) => handleChange('telat30MinThreshold', parseInt(v))}
            />
            <SettingInput
              label="Grace period (menit)"
              type="number"
              value={draft.gracePeriodMinutes}
              onChange={(v) => handleChange('gracePeriodMinutes', parseInt(v))}
            />
            <SettingInput
              label="Max potongan bulanan (Rp)"
              type="number"
              value={draft.maxMonthlyPenalty || ''}
              onChange={(v) => handleChange('maxMonthlyPenalty', v ? parseInt(v) : null)}
              placeholder="Kosongkan untuk unlimited"
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button onClick={handleSave} style={{ ...btnSolid, flex: 1 }}>Simpan perubahan</button>
            <button onClick={handleCancel} style={{ ...btnGhost, flex: 1 }}>Batal</button>
          </div>
        </Ticket>
      )}
    </div>
  );
}

function ConfigCard({ label, value, detail }) {
  return (
    <Ticket padding={16}>
      <Eyebrow>{label}</Eyebrow>
      <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 22, fontStyle: 'italic', marginTop: 8 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: TOKENS.ink50, marginTop: 8 }}>{detail}</div>
    </Ticket>
  );
}

function SettingInput({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <Eyebrow>{label}</Eyebrow>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', marginTop: 8, padding: '10px 12px',
          background: TOKENS.paper, border: `1px solid ${TOKENS.ink15}`,
          borderRadius: 4, fontFamily: TOKENS.fontMono, fontSize: 14,
          fontWeight: 600,
        }}
      />
    </div>
  );
}

// ─────────── EMPLOYEE LENIENCY / PARDON ───────────
function LeniencySection({ leaderboard, conductHistory, onApplyReduction }) {
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [reduction, setReduction] = useState(0);
  const [reason, setReason] = useState('');

  const emp = selectedEmpId ? leaderboard.find(p => p.id === selectedEmpId) : null;
  const conduct = emp ? (conductHistory[emp.id] || { score: 5, notes: '' }) : null;

  const handleApply = () => {
    if (emp && reduction > 0) {
      onApplyReduction(emp.id, reduction, reason);
      setSelectedEmpId(null);
      setReduction(0);
      setReason('');
    }
  };

  return (
    <div>
      <Eyebrow>SISTEM KERINGANAN</Eyebrow>
      <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 36, fontStyle: 'italic', marginTop: 4, marginBottom: 18 }}>
        Pengurangan/pembebasan potongan
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        {/* Left: employee list */}
        <Ticket padding={0} style={{ overflow: 'hidden', maxHeight: 600, overflowY: 'auto' }}>
          <div style={{ padding: 16, borderBottom: `1px solid ${TOKENS.ink08}`, position: 'sticky', top: 0, background: TOKENS.paper }}>
            <Eyebrow>DAFTAR KARYAWAN</Eyebrow>
            <div style={{ fontSize: 12, color: TOKENS.ink70, marginTop: 4 }}>Klik untuk pilih & beri keringanan</div>
          </div>
          {leaderboard.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedEmpId(p.id)}
              style={{
                width: '100%', padding: '12px 16px', border: 'none',
                background: selectedEmpId === p.id ? TOKENS.ink : 'transparent',
                color: selectedEmpId === p.id ? TOKENS.paper : TOKENS.ink,
                textAlign: 'left', borderBottom: `1px solid ${TOKENS.ink08}`,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 11, color: selectedEmpId === p.id ? 'rgba(244,241,234,0.6)' : TOKENS.ink70, marginTop: 2 }}>
                {p.id} · Telat {p.totalLate}m · {fmtRupiah(p.penalty)}
              </div>
            </button>
          ))}
        </Ticket>

        {/* Right: detail & form */}
        {emp && conduct ? (
          <Ticket padding={16}>
            <div>
              <Eyebrow>DETAIL KARYAWAN</Eyebrow>
              <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 20, fontStyle: 'italic', marginTop: 8 }}>
                {emp.name}
              </div>
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 11, color: TOKENS.ink50, marginTop: 4 }}>
                {emp.id} · {emp.role.toUpperCase()}
              </div>
            </div>

            <div className="pc-divider" style={{ margin: '14px 0' }} />

            <div>
              <Eyebrow>SKOR PERILAKU</Eyebrow>
              <div style={{
                display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 8,
              }}>
                <div style={{
                  fontFamily: TOKENS.fontDisplay, fontSize: 32, fontStyle: 'italic',
                  color: conduct.score >= 7 ? TOKENS.ontime : conduct.score >= 5 ? TOKENS.ink : TOKENS.late,
                }}>
                  {conduct.score.toFixed(1)}
                </div>
                <div style={{ flex: 1, height: 24, background: TOKENS.ink04, borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    width: `${(conduct.score / 10) * 100}%`, height: '100%',
                    background: conduct.score >= 7 ? TOKENS.ontime : conduct.score >= 5 ? TOKENS.ink : TOKENS.late,
                  }} />
                </div>
              </div>
              <div style={{ fontSize: 12, color: TOKENS.ink70, marginTop: 8, fontStyle: 'italic' }}>
                "{conduct.notes}"
              </div>
            </div>

            <div className="pc-divider" style={{ margin: '14px 0' }} />

            <div>
              <Eyebrow>POTONGAN SAAT INI</Eyebrow>
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 22, fontWeight: 700, color: TOKENS.late, marginTop: 8 }}>
                −{fmtRupiah(emp.penalty)}
              </div>
              <div style={{ fontSize: 12, color: TOKENS.ink70, marginTop: 4 }}>
                {emp.totalLate} menit telat × Rp {SYSTEM_CONFIG.penaltyPerMinute.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="pc-divider" style={{ margin: '14px 0' }} />

            <div>
              <Eyebrow>KURANGI POTONGAN</Eyebrow>
              <input
                type="number"
                min="0"
                max={emp.penalty}
                value={reduction}
                onChange={(e) => setReduction(Math.min(parseInt(e.target.value) || 0, emp.penalty))}
                style={{
                  width: '100%', marginTop: 8, padding: '10px 12px',
                  background: TOKENS.paper, border: `1px solid ${TOKENS.ink15}`,
                  borderRadius: 4, fontFamily: TOKENS.fontMono, fontSize: 14, fontWeight: 600,
                }}
              />
              <div style={{ fontSize: 11, color: TOKENS.ink50, marginTop: 4 }}>
                Sisa potongan: {fmtRupiah(emp.penalty - reduction)}
              </div>
            </div>

            <div>
              <Eyebrow style={{ marginTop: 14 }}>ALASAN KERINGANAN</Eyebrow>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Cth: Kerja keras, sering lembur voluntary, dll"
                style={{
                  width: '100%', marginTop: 8, padding: '10px 12px',
                  background: TOKENS.paper, border: `1px solid ${TOKENS.ink15}`,
                  borderRadius: 4, fontFamily: TOKENS.fontUI, fontSize: 12, resize: 'none',
                }}
              />
            </div>

            <button
              onClick={handleApply}
              disabled={reduction === 0}
              style={{
                marginTop: 14, width: '100%', padding: '10px 0',
                background: reduction > 0 ? TOKENS.ink : TOKENS.ink15,
                color: reduction > 0 ? TOKENS.paper : TOKENS.ink50,
                border: 'none', borderRadius: 4, fontFamily: TOKENS.fontMono,
                fontSize: 12, fontWeight: 700, letterSpacing: '0.12em',
              }}
            >
              TERAPKAN KERINGANAN →
            </button>
          </Ticket>
        ) : (
          <Ticket padding={16} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            <div style={{ textAlign: 'center', color: TOKENS.ink50, fontFamily: TOKENS.fontMono, fontSize: 12 }}>
              Pilih karyawan untuk melihat detail & terapkan keringanan
            </div>
          </Ticket>
        )}
      </div>

      {/* History of reductions applied */}
      {Object.values(CONDUCT_HISTORY).some(c => c.adjustments.length > 0) && (
        <div style={{ marginTop: 24 }}>
          <Eyebrow>RIWAYAT KERINGANAN DITERAPKAN</Eyebrow>
          <div style={{ marginTop: 10 }}>
            {Object.entries(CONDUCT_HISTORY).map(([empId, conduct]) =>
              conduct.adjustments.map((adj, i) => {
                const emp = leaderboard.find(p => p.id === empId);
                return (
                  <div key={`${empId}-${i}`} style={{
                    padding: 12, background: TOKENS.paper, border: `1px solid ${TOKENS.ink08}`,
                    borderRadius: 4, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{emp?.name}</div>
                      <div style={{ fontSize: 12, color: TOKENS.ink70, marginTop: 2, fontFamily: TOKENS.fontMono }}>
                        Dikurangi {fmtRupiah(adj.reduction)} — {adj.reason}
                      </div>
                    </div>
                    <div style={{ fontFamily: TOKENS.fontMono, fontSize: 12, color: TOKENS.ontime, fontWeight: 700 }}>
                      +{fmtRupiah(adj.reduction)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { SettingsSection, LeniencySection });
