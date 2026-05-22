# Tumbuh — Panduan Setup Integrasi
## Google Sheets + Make.com + Fonnte (WhatsApp)

---

## Gambaran Besar

```
Form submit
   ↓
Google Apps Script (doPost)
   ├── Simpan ke Google Sheets (database leads)
   └── Trigger Make.com webhook
            ├── Fonnte → kirim WA analisis ke user
            └── Fonnte → kirim notif ke nomor WA kamu
```

**Biaya estimasi awal:**
- Google Sheets + Apps Script: GRATIS
- Make.com free tier: 1.000 operasi/bulan (cukup untuk ~300 leads)
- Fonnte: Rp 50.000/bulan (unlimited pesan, 1 device)

---

## STEP 1 — Siapkan Google Sheets

1. Buka [sheets.google.com](https://sheets.google.com)
2. Buat spreadsheet baru, beri nama: **"Tumbuh - Leads"**
3. Copy ID dari URL-nya:
   ```
   https://docs.google.com/spreadsheets/d/[INI_ID_NYA]/edit
   ```
4. Simpan ID tersebut, kamu butuh ini nanti

---

## STEP 2 — Deploy Google Apps Script

1. Buka [script.google.com](https://script.google.com)
2. Klik **"New project"**
3. Hapus kode default, paste isi file `google-apps-script.js`
4. Ganti dua variabel ini:
   ```js
   const SPREADSHEET_ID = "ID_DARI_STEP_1";
   const MAKE_WEBHOOK_URL = ""; // Isi nanti setelah Step 3
   ```
5. Klik **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Klik **Deploy** → izinkan akses → Copy URL deployment
7. URL akan berbentuk:
   ```
   https://script.google.com/macros/s/AKfyc.../exec
   ```
8. Paste URL ini ke `form-handler.js`:
   ```js
   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfyc.../exec";
   ```

---

## STEP 3 — Setup Fonnte (WhatsApp API)

1. Daftar di [fonnte.com](https://fonnte.com)
2. Tambah device → scan QR code dengan HP yang punya WA bisnis Tumbuh
3. Setelah connected, copy **API Token** kamu
4. Simpan token ini untuk dipakai di Make.com

---

## STEP 4 — Setup Make.com Automation

1. Daftar di [make.com](https://make.com)
2. Buat **New Scenario**
3. Tambah module: **Webhooks → Custom webhook**
   - Klik "Add", beri nama: "Tumbuh Form Lead"
   - Copy URL webhook yang muncul
   - Paste URL ini ke `google-apps-script.js`:
     ```js
     const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/xxxx";
     ```
4. Tambah module kedua: **HTTP → Make a request**
   - URL: `https://api.fonnte.com/send`
   - Method: POST
   - Headers: `Authorization: TOKEN_FONNTE_KAMU`
   - Body type: Form data
   - Fields:
     ```
     target  → {{1.nomor_wa}}
     message → {{1.pesan_user}}
     ```
5. Tambah module ketiga (notif admin): **HTTP → Make a request** (lagi)
   - URL: `https://api.fonnte.com/send`
   - Method: POST
   - Headers: `Authorization: TOKEN_FONNTE_KAMU`
   - Body type: Form data
   - Fields:
     ```
     target  → NOMOR_WA_KAMU (contoh: 628123456789)
     message → {{1.pesan_admin}}
     ```
6. Klik **Save** → **Run once** untuk test
7. Submit form test dari website → cek apakah WA masuk

---

## STEP 5 — Test End-to-End

1. Buka website Tumbuh
2. Isi form dengan data test (pakai nomor WA kamu sendiri)
3. Cek 3 hal:
   - [ ] Data muncul di Google Sheets baris baru
   - [ ] WA masuk ke nomor yang diisi di form (pesan dari Tim Tumbuh)
   - [ ] WA notif masuk ke nomor admin kamu

---

## Troubleshooting

**WA tidak masuk:**
- Pastikan Fonnte device masih connected (buka fonnte.com, cek status)
- Cek format nomor: harus `628xxxxxxxxx` (tanpa `+`)
- Pastikan Make.com scenario sudah diaktifkan (toggle ON)

**Data tidak masuk ke Sheets:**
- Pastikan Apps Script sudah di-redeploy setelah ubah kode
- Cek execution log di Apps Script: View → Executions
- Pastikan SPREADSHEET_ID benar

**CORS error di console browser:**
- Normal untuk Apps Script — data tetap masuk meski ada warning CORS
- Kalau mau bersih, bisa pakai backend Node.js/Python sebagai proxy

---

## Scale Up Nanti

Kalau udah dapat 500+ leads/bulan:
- **Make.com** → upgrade ke Starter ($9/bulan, 10.000 ops)
- **Fonnte** → tetap Rp 50rb/bulan, unlimited
- **Database** → migrate dari Sheets ke Supabase (gratis sampai 500MB)
- **AI Layer** → tambah OpenAI/Claude API call di Make.com untuk generate pesan yang lebih personal per lead
