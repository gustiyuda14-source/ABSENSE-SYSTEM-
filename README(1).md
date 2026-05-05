# 📚 D'AJIKS Absensi — Quick Reference & Summary

## 🎯 Apa yang Sudah Dibuat

### ✅ Core System (Complete)
- ✓ Sistem absensi dengan GPS tracking & geofence
- ✓ Check-in/out dengan "punch card" metaphor (hold-to-punch)
- ✓ Sistem potongan gaji (Rp per menit telat)
- ✓ Surat Peringatan (SP) otomatis untuk telat ≥30 menit
- ✓ 6 shift (Barista/Billiard/Kitchen × S1/S2)
- ✓ Riwayat absensi per karyawan (30 hari)
- ✓ Leaderboard disiplin dengan rank

### ✅ HRD Dashboard (Complete)
- ✓ Ringkasan harian + bar chart 7 hari
- ✓ Live feed stempel (realtime)
- ✓ Roster karyawan
- ✓ Papan disiplin (leaderboard)
- ✓ Surat Peringatan management

### ✅ Konfigurasi & Manajemen (NEW)
- ✓ Edit sistem: radius, potongan, threshold, grace period
- ✓ Sistem keringanan: kurangi potongan untuk karyawan baik
- ✓ Slip gaji dengan breakdown potongan & keringanan
- ✓ PDF export slip langsung

### ✅ Multi-Platform (NEW)
- ✓ PWA (Progressive Web App) untuk Android, iOS, Windows
- ✓ Service Worker untuk offline support
- ✓ Manifest.json untuk installable app
- ✓ Deployment guide untuk semua platform
- ✓ Local intranet setup option

---

## 🌐 Platform Access Methods

### 📱 ANDROID
**How to Access:**
1. Buka Chrome
2. Kunjungi: `https://ajiks-absensi.vercel.app` (atau URL Anda)
3. Tap "⋮" → "Install app"
4. Tap "Install"
5. Done! ✓

**Features Available:**
- ✅ Check-in/out dengan GPS
- ✅ View history & rekap
- ✅ Notifikasi SP
- ✅ Offline mode (basic)

**Best For:** Karyawan yang di lapangan

---

### 📱 iOS (iPhone/iPad)
**How to Access:**
1. Buka Safari
2. Kunjungi: `https://ajiks-absensi.vercel.app`
3. Tap "Share" → "Add to Home Screen"
4. Tap "Add"
5. Done! ✓

**Features Available:**
- ✅ Check-in/out dengan GPS
- ✅ View history & rekap
- ✅ Notifikasi SP
- ⚠️ Offline mode (limited)

**Best For:** Karyawan dengan iPhone

---

### 💻 WINDOWS Desktop
**How to Access:**

**Option A: PWA (Recommended, 5 min)**
1. Buka Chrome di Windows
2. Kunjungi: `https://ajiks-absensi.vercel.app`
3. Klik "+" di address bar
4. Klik "Install"
5. Done! ✓

**Option B: Native App (Optional, 1-2 jam)**
- Lihat DEPLOYMENT_GUIDE.md → "Windows Desktop Electron"
- Build `.exe` installer
- Distribute ke karyawan

**Features Available:**
- ✅ Full HRD Dashboard (payroll, reports, settings)
- ✅ Full admin access
- ✅ PDF export slip gaji
- ✅ Offline mode

**Best For:** Manager/HRD yang di kantor

---

### 🌐 WEB Browser (Anywhere)
**How to Access:**
1. Buka browser apa saja (Chrome, Firefox, Safari, Edge)
2. Kunjungi: `https://ajiks-absensi.vercel.app`
3. Done! ✓

**Features Available:**
- ✅ Semua fitur tersedia
- ✅ Mobile responsive
- ✅ Desktop optimized
- ✅ No installation needed

**Best For:** Akses dari mana saja (kantor, rumah, mobile)

---

### 🏢 LOCAL INTRANET (Internal Network)
**How to Access:**
```bash
# 1. Setup server di kantor (Windows/Mac/Linux)
npx http-server -p 3000

# 2. Cari IP address server
ipconfig  # Windows

# 3. Karyawan akses: http://192.168.1.100:3000
```

**Features Available:**
- ✅ Semua fitur tersedia
- ✅ No internet required (tapi harus WiFi kantor)
- ✅ Faster speed (local network)
- ✅ Data privacy (internal only)

**Best For:** Kantor dengan security requirements tinggi

---

## 📊 Access Matrix

| Platform | Role | Method | Installation | Speed | Offline |
|----------|------|--------|--------------|-------|---------|
| **Android** | Karyawan | PWA in Chrome | 2 clicks | Instant | ✓ |
| **iOS** | Karyawan | PWA in Safari | 2 taps | Instant | ⚠️ |
| **Windows Desktop** | HRD/Manager | PWA in Chrome | 1 click | Instant | ✓ |
| **Windows Desktop** | HRD/Manager | Electron .exe | Download+Run | Fast | ✓ |
| **Web Browser** | All | Direct link | None | Instant | ✗ |
| **Intranet** | All | Local IP:port | Server setup | Very Fast | ⚠️ |

---

## 🚀 RECOMMENDED DEPLOYMENT PATH (30 Minutes Total)

### Step 1: Choose Hosting (5 min)
**→ Pick ONE:**
- [ ] **Vercel** (easiest, recommended)
  ```bash
  npm install -g vercel
  vercel
  # Done! Get URL like: https://ajiks-absensi.vercel.app
  ```
- [ ] **Netlify** (drag & drop)
  - Just drag folder to netlify.com
- [ ] **GitHub Pages** (free)
  - Push to GitHub, enable in settings

### Step 2: Test PWA (10 min)
- [ ] Desktop: Chrome → Install → Test
- [ ] Android: Chrome → Install → Test check-in
- [ ] iOS: Safari → Install → Test

### Step 3: Share Links (5 min)
- [ ] Share URL to karyawan via WhatsApp/email
- [ ] Share URL to manager untuk HRD dashboard

### Step 4: Monitor First Week (ongoing)
- [ ] Track daily check-ins
- [ ] Fix bugs if found
- [ ] Gather feedback

---

## 📝 File Structure

```
ajiks-absensi/
├── index.html                    # Main entry point
├── manifest.json                 # PWA manifest (install icon, name, etc)
├── service-worker.js             # Offline support + caching
├── ios-frame.jsx                 # Device frame component
├── macos-window.jsx              # Dashboard window chrome
├── tokens.jsx                    # Design system (colors, fonts)
├── data.jsx                      # Mock data + SYSTEM_CONFIG
├── shared.jsx                    # Reusable UI primitives
├── mobile-checkin.jsx            # Check-in screen (hold-to-punch)
├── mobile-screens.jsx            # All mobile screens
├── hrd-settings.jsx              # Settings/config screen
├── slip-export.jsx               # Salary slip PDF export
├── hrd-dashboard.jsx             # HRD dashboard
│
├── DEPLOYMENT_GUIDE.md           # How to deploy (this file)
├── CLAUDE_CODE_GUIDE.md          # How to edit in Claude Code
├── FEATURES_ADDED.md             # What's new (v1.1)
└── README.md                     # (you should create this)
```

---

## 🔧 Customization Quick Links

### Edit Company Name
`data.jsx` → Line ~30
```javascript
const OFFICE = {
  name: 'D\'AJIKS COFFEE & BILLIARD',  // ← Edit here
```

### Edit Shift Hours
`data.jsx` → Line ~1
```javascript
const SHIFTS = {
  barista_1: { start: '09:30', end: '17:30' },  // ← Edit here
```

### Edit Penalty Rate
`data.jsx` → Line ~48
```javascript
const SYSTEM_CONFIG = {
  penaltyPerMinute: 5000,  // ← Edit here (Rp per minute)
```

### Edit Brand Color
`tokens.jsx` → Line ~10
```javascript
const TOKENS = {
  late: 'oklch(0.62 0.21 35)',  // ← Change accent color here
```

### Add Karyawan
`data.jsx` → Line ~84 (LEADERBOARD array)
```javascript
{ id: 'EMP-015', name: 'Nama Baru', ... }  // ← Add new employee
```

---

## 🆘 Troubleshooting

### "Install button tidak muncul di Chrome"
→ Tunggu 10 detik, refresh halaman, atau buka DevTools → Application → Manifest

### "Check-in tidak bisa (GPS red)"
→ Device location disabled. Enable di Settings → Location → High Accuracy

### "Offline tidak jalan"
→ Service worker perlu reload. Close app, open lagi. Or: Clear cache → Reload

### "PDF tidak bisa dibuat"
→ Check browser console (F12). Canvas might be blocked. Try different browser.

### "Slow on slow network"
→ Normal. App akan cache content. Subsequent loads faster.

### "White screen saat pertama kali buka"
→ Browser loading. Wait 5-10 seconds. Or check console for JS errors.

---

## 📱 Pro Tips

### Tip 1: Shortcut on Home Screen (Android)
- Long-press app icon → "Create shortcut"
- Create shortcut ke "Check In" page: `/index.html?screen=checkin-in`

### Tip 2: Battery Saver Mode
- Open Settings → Battery saver
- May reduce GPS accuracy slightly, but saves battery

### Tip 3: Multiple Accounts
- Use private/incognito window for different account
- Or create separate user profile on Windows

### Tip 4: Backup Data
- PWA data stored in browser cache
- Export important data regularly via HRD dashboard

### Tip 5: Update Notifications (Future)
- Service worker auto-checks for updates
- Users see "Update available" notification
- Click to install new version

---

## 📞 Support

**For Technical Questions:**
- Open browser DevTools (F12)
- Check Console for errors
- Screenshot error + send to developer

**For Feature Requests:**
- Document use case in email
- Expected outcome
- How it impacts workflow

**For Bugs:**
- Reproduce step-by-step
- Screenshot/video
- Browser version & device info

---

## 🎓 Learning Resources

- **PWA Documentation**: https://web.dev/progressive-web-apps
- **Service Workers**: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- **React Hooks**: https://react.dev/reference/react/hooks
- **Manifest.json**: https://web.dev/add-manifest

---

## 🏁 Status

| Component | Status | Version |
|-----------|--------|---------|
| Core System | ✅ Complete | 1.0 |
| HRD Dashboard | ✅ Complete | 1.0 |
| Settings | ✅ New | 1.1 |
| Leniency System | ✅ New | 1.1 |
| Salary Slip | ✅ New | 1.1 |
| PWA + Offline | ✅ New | 1.1 |
| Multi-Platform | ✅ New | 1.1 |

**Version:** 1.1 (May 5, 2026)  
**Status:** 🟢 Production Ready

---

**Next:** Choose hosting platform → Deploy in 15 minutes → Share to team! 🚀
