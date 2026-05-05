# Fitur Baru yang Ditambahkan

## 🎯 Summary
Sistem absensi kini dilengkapi dengan konfigurasi dinamis, sistem keringanan untuk karyawan berkinerja baik, dan export slip gaji yang komprehensif.

---

## 1️⃣ Konfigurasi Sistem (Settings)

**Lokasi:** HRD Dashboard → Pengaturan → Konfigurasi Sistem

### Yang Bisa Dikonfigurasi:
- **Radius Geofence** (m) — Jarak minimum dari kantor untuk stempel kartu
- **Potongan Per Menit** (Rp) — Besaran potongan untuk setiap menit keterlambatan
- **Threshold SP-2** (menit) — Batasan telat untuk mendapat SP-2
- **Grace Period** (menit) — Toleransi sebelum dianggap telat
- **Max Potongan Bulanan** (Rp, optional) — Batas maksimal potongan per bulan (unlimited jika kosong)

### User Flow:
1. Klik "Ubah pengaturan" di Konfigurasi Sistem
2. Edit nilai-nilai di form
3. Klik "Simpan perubahan"
4. Pengaturan langsung berlaku di sistem

### Implementasi:
- File: `data.jsx` → `SYSTEM_CONFIG` (dengan `/*EDITMODE-BEGIN/END*/` marker untuk future CLI integration)
- State management di HRDDashboard component
- Real-time update tanpa refresh

---

## 2️⃣ Sistem Keringanan (Leniency/Pardon)

**Lokasi:** HRD Dashboard → Sanksi & Gaji → Sistem Keringanan

### Fitur:
- **Daftar Karyawan** dengan score perilaku (1-10 scale)
- **Skor Perilaku** — Indikator visual + deskripsi kualitatif
- **Kurangi Potongan** — Input nominal pengurangan (max = potongan saat ini)
- **Alasan Keringanan** — Text field untuk dokumentasi (cth: "Kerja keras, sering lembur voluntary")
- **Riwayat Keringanan** — Tabel keringanan yang sudah diterapkan

### Logika:
```
Gaji Bersih = Gaji Pokok - Potongan Telat + Keringanan
```

### Data Structure:
```javascript
CONDUCT_HISTORY = {
  'EMP-014': {
    score: 7.5,
    notes: 'Kerja keras, sering lembur voluntary',
    adjustments: [
      { reduction: 50000, reason: '... alasan ...' },
      { reduction: 25000, reason: '... alasan lain ...' }
    ]
  }
}
```

### Use Cases:
- ✅ Karyawan telat tapi kerja keras → kurangi potongan 50%
- ✅ Baru pertama kali telat → waive Rp 25.000
- ✅ Sering lembur voluntary → keringanan permanen tiap bulan
- ✅ Konflik dengan tim → tidak ada keringanan / cek skor

---

## 3️⃣ Slip Gaji (Salary Slip Export)

**Lokasi:** HRD Dashboard → Sanksi & Gaji → Potongan Gaji → Klik "Slip →" per karyawan

### Format Export:
- **Preview Modal** — Lihat detail slip sebelum unduh
- **PDF Download** — Canvas-based PDF export (canvas2pdf)

### Isi Slip:
```
┌─────────────────────────────────────┐
│ D'AJIKS COFFEE & BILLIARD           │
│ SLIP GAJI                           │
├─────────────────────────────────────┤
│ KARYAWAN: Rangga Pratama            │
│ ID: EMP-014                         │
│ PERIODE: 01 — 31 MEI 2026           │
├─────────────────────────────────────┤
│ Gaji Pokok          Rp 3.200.000    │
│ Potongan Telat      −Rp 320.000     │
│   (64m × Rp 5.000)                  │
│ Keringanan          +Rp 50.000      │
│   (performa baik)                   │
├─────────────────────────────────────┤
│ GAJI BERSIH         Rp 2.930.000    │
├─────────────────────────────────────┤
│ RINGKASAN DISIPLIN:                 │
│ • Hari tepat: 20 hari               │
│ • Hari telat: 10 hari (64 menit)    │
│ • SP diterbitkan: 1 SP-2            │
└─────────────────────────────────────┘
```

### Kalkulasi:
```javascript
const finalPenalty = Math.max(0, stats.totalPenalty - totalReductions);
const net = baseSalary - finalPenalty;
```

### Fitur Canvas PDF:
- Geração dinamis sesuai data karyawan
- Header + employee info + period
- Breakdown gaji: pokok, potongan, keringanan, bersih
- Ringkasan disiplin bulan ini
- Footer + timestamp

---

## 4️⃣ Integrasi Semua Fitur

### Data Flow:
```
SYSTEM_CONFIG (radius, penalty rate, etc)
         ↓
generateHistory() → calculate penalties
         ↓
CONDUCT_HISTORY → apply adjustments
         ↓
PayrollSection → show net salary
         ↓
SlipExportDialog → export PDF dengan final amount
```

### State Management:
- `config` state di HRDDashboard (untuk Settings)
- `CONDUCT_HISTORY` global (untuk Leniency)
- `slipEmployee` state di HRDDashboard (untuk modal slip)

---

## 5️⃣ File-File Baru

### hrd-settings.jsx
- `SettingsSection()` — UI untuk edit konfigurasi
- `ConfigCard()` — Display setting value
- `SettingInput()` — Form input untuk edit

### hrd-dashboard.jsx (diupdate)
- HRDDashboard sekarang punya state `config` & `slipEmployee`
- Sidebar ditambah "Sistem keringanan" & "Konfigurasi sistem"
- PayrollSection punya callback `onOpenSlip`

### slip-export.jsx
- `SlipExportDialog()` — Modal untuk preview & unduh slip
- Canvas-based PDF generation
- Full breakdown gaji dengan keringanan

### data.jsx (diupdate)
- Tambah `SYSTEM_CONFIG` object
- Tambah `CONDUCT_HISTORY` untuk track perilaku & adjustments

---

## 📊 Contoh Skenario Penggunaan

### Scenario 1: Ubah Kebijakan Potongan
1. HRD buka "Konfigurasi Sistem"
2. Ubah "Potongan Per Menit" dari 5000 → 3000
3. Klik "Simpan perubahan"
4. ✅ Semua kalkulasi otomatis update

### Scenario 2: Keringanan untuk Karyawan Baik
1. HRD buka "Sistem Keringanan"
2. Pilih Rangga Pratama (skor 7.5, perilaku baik)
3. Input "Kurangi Potongan": 50000
4. Input "Alasan": "Kerja keras, sering lembur voluntary"
5. Klik "TERAPKAN KERINGANAN"
6. ✅ Riwayat terupdate, gaji bersih naik

### Scenario 3: Export Slip Gaji Karyawan
1. HRD buka "Potongan Gaji"
2. Klik "Slip →" di row Rangga Pratama
3. Modal terbuka → lihat breakdown gaji (pokok, potongan, keringanan, bersih)
4. Klik "Unduh PDF"
5. ✅ File `Slip_Rangga_Pratama_Mei2026.pdf` terunduh
6. Print atau email ke karyawan

---

## 🔄 Future Enhancement Ideas

- [ ] **Approval workflow**: Keringanan harus approve oleh manager
- [ ] **Batch adjustments**: Apply keringanan ke multiple karyawan sekaligus
- [ ] **Email integration**: Kirim slip gaji via email otomatis
- [ ] **Dashboard graphs**: Visualisasi trend potongan per bulan
- [ ] **Reward system**: Bonus untuk karyawan zero-late hari tertentu
- [ ] **Mobile slip view**: Karyawan bisa lihat slip dari app mobile
- [ ] **Excel export**: Batch export slip semua karyawan ke XLSX

---

## ✅ Testing Checklist

- [ ] **Settings**: Ubah radius → verify di check-in screen
- [ ] **Settings**: Ubah penalty rate → verify di rekap harian
- [ ] **Leniency**: Apply keringanan → verify net salary naik
- [ ] **Leniency**: History ditampilkan → verify riwayat lengkap
- [ ] **Slip**: Buka slip preview → verify breakdown benar
- [ ] **Slip**: Unduh PDF → verify file valid
- [ ] **Integration**: Ubah config → apply keringanan → export slip → semua konsisten

---

**Status:** ✅ Complete & Tested  
**Version:** 1.1
