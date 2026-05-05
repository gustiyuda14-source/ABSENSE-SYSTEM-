// mobile-checkin.jsx — The hero screen: hold-to-punch check-in flow
// Stages: arriving (in/out of zone) → punching (hold gesture) → result (tepat / telat / sp)

const { useState: _useState, useEffect: _useEffect, useRef: _useRef } = React;

function CheckInScreen({ onClose, onComplete, mode = 'in' /* 'in' | 'out' */, simulated }) {
  const now = useNow();
  const shift = SHIFTS[CURRENT_USER.shift];
  const [stage, setStage] = useState('arriving'); // arriving | punching | result | loading
  const [holdProgress, setHoldProgress] = useState(0); // 0..1
  const [inZone, setInZone] = useState(simulated?.inZone ?? true);
  const [lateMin, setLateMin] = useState(null);
  const [resultData, setResultData] = useState(null);
  const holdRef = useRef(null);
  const startRef = useRef(0);

  // GPS state
  const [gps, setGps] = useState({ lat: null, lng: null, status: 'acquiring', accuracy: null });
  const [error, setError] = useState(null);
  const gpsRef = useRef(null);

  // Initialize GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung browser');
      setGps(g => ({ ...g, status: 'unavailable' }));
      return;
    }

    // Request one-time high-accuracy position
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGps({
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy),
          status: 'ready'
        });
        setError(null);
      },
      (err) => {
        setError(`GPS Error: ${err.message}`);
        setGps(g => ({ ...g, status: 'denied' }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const computedLate = useMemo(() => {
    if (lateMin !== null) return lateMin;
    if (mode !== 'in') return 0;
    const [sh, sm] = shift.start.split(':').map(Number);
    const target = new Date(now); target.setHours(sh, sm, 0, 0);
    const diffMin = Math.floor((now - target) / 60000);
    return Math.max(0, diffMin);
  }, [now, shift, mode, lateMin]);

  const startHold = () => {
    if (stage !== 'arriving') return;
    if (!gps.lat || !gps.lng) {
      setError('Menunggu lokasi GPS...');
      return;
    }

    setStage('punching');
    startRef.current = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - startRef.current) / 1500; // 1.5s hold
      const p = Math.min(1, elapsed);
      setHoldProgress(p);
      if (p >= 1) {
        performCheckIn();
      } else {
        holdRef.current = requestAnimationFrame(tick);
      }
    };
    holdRef.current = requestAnimationFrame(tick);
  };

  const performCheckIn = async () => {
    setStage('loading');
    try {
      if (mode === 'in') {
        const result = await window.dataService.checkIn(
          CURRENT_USER.shift,
          gps.lat,
          gps.lng
        );
        if (result.success) {
          setResultData({ ...result.data, gpsLat: gps.lat, gpsLng: gps.lng });
          setStage('result');
        } else {
          setError(result.error?.message || 'Check-in gagal');
          setStage('arriving');
        }
      } else {
        const today = new Date().toISOString().split('T')[0];
        const result = await window.dataService.checkOut(
          today,
          gps.lat,
          gps.lng
        );
        if (result.success) {
          setResultData({ ...result.data, gpsLat: gps.lat, gpsLng: gps.lng });
          setStage('result');
        } else {
          setError(result.error?.message || 'Check-out gagal');
          setStage('arriving');
        }
      }
    } catch (err) {
      setError(err.message);
      setStage('arriving');
    }
  };

  const cancelHold = () => {
    if (stage === 'punching') {
      cancelAnimationFrame(holdRef.current);
      setStage('arriving');
      setHoldProgress(0);
    }
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, background: TOKENS.ink, color: TOKENS.paper,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* top bar */}
      <div style={{ padding: '60px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onClose} style={{
          background: 'transparent', border: `1px solid ${TOKENS.paper}`, color: TOKENS.paper,
          width: 36, height: 36, borderRadius: 18, fontSize: 18, padding: 0,
        }}>✕</button>
        <Eyebrow color="rgba(244,241,234,0.6)">{mode === 'in' ? 'CHECK IN · MASUK' : 'CHECK OUT · PULANG'}</Eyebrow>
        <div style={{ width: 36 }} />
      </div>

      {stage !== 'result' ? (
        <CheckInActive
          shift={shift} now={now} inZone={inZone}
          stage={stage} holdProgress={holdProgress} startHold={startHold} cancelHold={cancelHold}
          mode={mode} computedLate={computedLate}
          gps={gps} error={error}
        />
      ) : (
        <CheckInResult result={resultData} mode={mode} now={now} gps={gps} onClose={() => { onComplete?.(resultData); onClose?.(); }} />
      )}
    </div>
  );
}

function CheckInActive({ shift, now, inZone, stage, holdProgress, startHold, cancelHold, mode, computedLate, gps, error }) {
  const gpsReady = gps && gps.status === 'ready';
  const gpsStatusColor = gps?.status === 'ready' ? TOKENS.ontime : gps?.status === 'acquiring' ? 'rgba(244,241,234,0.6)' : TOKENS.late;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 20px 20px', overflow: 'auto' }} className="noscroll">
      {/* live time */}
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <Eyebrow color="rgba(244,241,234,0.5)">SAAT INI</Eyebrow>
        <div style={{ marginTop: 8 }}>
          <MonoClock time={now} size={56} color={TOKENS.paper} />
        </div>
        <div style={{ fontSize: 13, color: 'rgba(244,241,234,0.6)', marginTop: 6, fontFamily: TOKENS.fontMono }}>
          {fmtDateLong(now)}
        </div>
      </div>

      {/* shift target line */}
      <div style={{
        marginTop: 20, padding: '12px 14px',
        background: 'rgba(244,241,234,0.06)', borderRadius: 6,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        border: '1px solid rgba(244,241,234,0.10)',
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(244,241,234,0.6)', fontFamily: TOKENS.fontMono }}>SHIFT</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{shift.label}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'rgba(244,241,234,0.6)', fontFamily: TOKENS.fontMono }}>TARGET MASUK</div>
          <div style={{ fontFamily: TOKENS.fontMono, fontSize: 18, fontWeight: 600, marginTop: 2, letterSpacing: '-0.02em' }}>{shift.start}</div>
        </div>
      </div>

      {/* GPS status indicator */}
      <div style={{
        marginTop: 14, padding: '12px 14px',
        background: 'rgba(244,241,234,0.06)', borderRadius: 6,
        border: `1px solid rgba(244,241,234,0.10)`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(244,241,234,0.6)', fontFamily: TOKENS.fontMono }}>LOKASI GPS</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2, color: gpsStatusColor }}>
              {gps?.status === 'acquiring' ? '📍 Mencari sinyal...' : gps?.status === 'ready' ? '✓ Siap stempel' : gps?.status === 'denied' ? '✗ Akses ditolak' : '✗ Tidak tersedia'}
            </div>
          </div>
          {gpsReady && gps?.accuracy && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'rgba(244,241,234,0.6)', fontFamily: TOKENS.fontMono }}>AKURASI</div>
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 14, fontWeight: 600, marginTop: 2 }}>±{gps.accuracy}m</div>
            </div>
          )}
        </div>
        {gpsReady && gps?.lat && gps?.lng && (
          <div style={{ marginTop: 10, fontSize: 12, fontFamily: TOKENS.fontMono, color: 'rgba(244,241,234,0.7)', lineHeight: 1.6 }}>
            <div>Lat: {gps.lat.toFixed(6)}</div>
            <div>Lng: {gps.lng.toFixed(6)}</div>
          </div>
        )}
      </div>

      {/* error message display */}
      {error && (
        <div style={{
          marginTop: 10, padding: '10px 12px',
          background: 'rgba(204,87,46,0.15)', borderRadius: 6,
          border: `1px solid ${TOKENS.late}`,
          fontSize: 12, color: TOKENS.late, fontFamily: TOKENS.fontMono,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* live computed late preview */}
      {computedLate > 0 && (
        <div style={{
          marginTop: 14, padding: 12, border: `1px solid ${TOKENS.late}`, borderRadius: 6,
          background: 'rgba(204,87,46,0.10)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(244,241,234,0.7)', fontFamily: TOKENS.fontMono }}>PERKIRAAN TELAT</div>
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 22, fontWeight: 700, color: TOKENS.late, marginTop: 2 }}>
              +{computedLate} menit
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(244,241,234,0.7)', fontFamily: TOKENS.fontMono }}>POTONGAN</div>
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 16, fontWeight: 700, color: TOKENS.late, marginTop: 2 }}>
              {fmtRupiah(computedLate * 5000)}
            </div>
          </div>
        </div>
      )}

      {/* big hold button */}
      <div style={{ flex: 1 }} />
      <HoldToPunchButton
        inZone={inZone}
        stage={stage}
        progress={holdProgress}
        onStart={startHold}
        onCancel={cancelHold}
        mode={mode}
        gpsReady={gpsReady}
      />
      <div style={{
        textAlign: 'center', marginTop: 10, fontFamily: TOKENS.fontMono, fontSize: 10,
        color: 'rgba(244,241,234,0.5)', letterSpacing: '0.1em',
      }}>
        {!gpsReady ? (gps?.status === 'denied' ? 'GPS DITOLAK · AKTIFKAN LOKASI' : 'MENUNGGU SINYAL GPS...') : stage === 'punching' ? 'TAHAN TERUS...' : 'TAHAN 1.5 DETIK UNTUK STEMPEL'}
      </div>
    </div>
  );
}


function HoldToPunchButton({ inZone, stage, progress, onStart, onCancel, mode, gpsReady }) {
  const disabled = !inZone || !gpsReady || stage === 'loading';
  const size = 200;
  const r = (size - 16) / 2;
  const C = 2 * Math.PI * r;
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      paddingTop: 20, paddingBottom: 8,
    }}>
      <button
        onMouseDown={onStart} onMouseUp={onCancel} onMouseLeave={onCancel}
        onTouchStart={(e) => { e.preventDefault(); onStart(); }} onTouchEnd={onCancel}
        disabled={disabled}
        style={{
          width: size, height: size, borderRadius: '50%',
          background: disabled ? 'rgba(244,241,234,0.06)' : TOKENS.paper,
          color: disabled ? 'rgba(244,241,234,0.3)' : TOKENS.ink,
          border: 'none', position: 'relative',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'transform 0.1s ease',
          transform: stage === 'punching' ? 'scale(0.96)' : stage === 'loading' ? 'scale(0.95)' : 'scale(1)',
          boxShadow: disabled ? 'none' : '0 0 0 1px rgba(244,241,234,0.1), 0 12px 40px rgba(244,241,234,0.06)',
          opacity: stage === 'loading' ? 0.7 : 1,
        }}
      >
        {/* progress ring */}
        <svg width={size} height={size} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r}
            stroke={disabled ? 'rgba(244,241,234,0.05)' : 'rgba(10,10,10,0.08)'}
            strokeWidth="3" fill="none" />
          <circle cx={size/2} cy={size/2} r={r}
            stroke={TOKENS.late} strokeWidth="4" fill="none"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            strokeLinecap="round"
            style={{ transition: stage === 'punching' ? 'none' : 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 38, fontStyle: 'italic', lineHeight: 1, position: 'relative' }}>
          {mode === 'in' ? 'Punch' : 'Pulang'}
        </div>
        <div style={{ fontFamily: TOKENS.fontMono, fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', marginTop: 6, opacity: 0.7, position: 'relative' }}>
          {mode === 'in' ? 'TAHAN UNTUK MASUK' : 'TAHAN UNTUK KELUAR'}
        </div>
      </button>
    </div>
  );
}

function CheckInResult({ result, mode, now, gps, onClose }) {
  if (!result) {
    return (
      <div style={{ flex: 1, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: 'rgba(244,241,234,0.7)' }}>Memproses...</div>
        </div>
      </div>
    );
  }

  const { status, late, penalty, gpsLat, gpsLng } = result;
  const colorMap = { tepat: TOKENS.ontime, telat: TOKENS.late, sp: TOKENS.sp };
  const accent = colorMap[status] || TOKENS.ontime;

  return (
    <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
      {/* receipt */}
      <Ticket dark={false} padding={0} style={{
        background: TOKENS.paper, color: TOKENS.ink, marginTop: 8, position: 'relative',
        boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
      }}>
        {/* stamp overlay */}
        <div style={{
          position: 'absolute', top: 12, right: 14, zIndex: 5,
          animation: 'stamp 0.6s cubic-bezier(.2,.9,.2,1.2) forwards',
        }}>
          <Stamp color={accent} size="lg">
            {status === 'tepat' ? 'ON TIME' : status === 'sp' ? 'SP-2' : `+${late} MIN`}
          </Stamp>
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          <Eyebrow>D'AJIKS · PUNCH RECEIPT</Eyebrow>
          <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 32, fontStyle: 'italic', marginTop: 8, lineHeight: 1 }}>
            {mode === 'in' ? 'Kartu Masuk' : 'Kartu Pulang'}
          </div>
          <div style={{ fontFamily: TOKENS.fontMono, fontSize: 11, color: TOKENS.ink50, marginTop: 6 }}>
            {fmtDateLong(now)}
          </div>
        </div>

        <div className="pc-divider" style={{ margin: '20px 12px' }} />

        <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <ReceiptRow label="KARYAWAN" value={CURRENT_USER.name} />
          <ReceiptRow label="ID" value={CURRENT_USER.id} mono />
          <ReceiptRow label="TARGET" value={SHIFTS[CURRENT_USER.shift].start} mono />
          <ReceiptRow label="STEMPEL" value={`${pad2(now.getHours())}:${pad2(now.getMinutes())}`} mono />
          <ReceiptRow label="LAT" value={gpsLat ? gpsLat.toFixed(4) + '°' : '-'} mono />
          <ReceiptRow label="LNG" value={gpsLng ? gpsLng.toFixed(4) + '°' : '-'} mono />
        </div>

        <div className="pc-divider" style={{ margin: '20px 12px' }} />

        <div style={{ padding: '0 20px 20px' }}>
          {status === 'tepat' ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 28, color: TOKENS.ontime, fontStyle: 'italic' }}>Tepat waktu.</div>
              <div style={{ fontSize: 13, color: TOKENS.ink70, marginTop: 4 }}>Disiplin Anda dicatat. Tidak ada potongan.</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <Eyebrow color={accent}>KETERLAMBATAN</Eyebrow>
                <div style={{ fontFamily: TOKENS.fontMono, fontSize: 26, fontWeight: 700, color: accent, letterSpacing: '-0.02em' }}>
                  +{late} MENIT
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Eyebrow>POTONGAN HARI INI</Eyebrow>
                <div style={{ fontFamily: TOKENS.fontMono, fontSize: 22, fontWeight: 700, color: TOKENS.ink }}>
                  −{fmtRupiah(penalty)}
                </div>
              </div>
              {status === 'sp' && (
                <div style={{
                  marginTop: 16, padding: 12, background: TOKENS.spBg,
                  border: `1px solid ${TOKENS.sp}`, borderRadius: 4,
                }}>
                  <Eyebrow color={TOKENS.sp}>SANKSI TAMBAHAN · SP-2</Eyebrow>
                  <div style={{ fontSize: 13, color: TOKENS.ink, marginTop: 8, lineHeight: 1.5 }}>
                    Telat lebih dari 30 menit. Tidak dapat jatah <b>libur 2x</b> &amp; wajib lembur <b>2x</b> dalam 14 hari ke depan.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Ticket>

      <div style={{ flex: 1 }} />
      <button onClick={onClose} style={{
        marginTop: 16, height: 52, borderRadius: 6, border: 'none',
        background: TOKENS.paper, color: TOKENS.ink,
        fontFamily: TOKENS.fontMono, fontSize: 13, fontWeight: 700, letterSpacing: '0.12em',
      }}>
        SIMPAN KARTU →
      </button>
    </div>
  );
}

function ReceiptRow({ label, value, mono }) {
  return (
    <div>
      <Eyebrow>{label}</Eyebrow>
      <div style={{
        fontFamily: mono ? TOKENS.fontMono : TOKENS.fontUI,
        fontSize: 14, fontWeight: 600, marginTop: 4, color: TOKENS.ink,
      }}>{value}</div>
    </div>
  );
}

Object.assign(window, { CheckInScreen });
