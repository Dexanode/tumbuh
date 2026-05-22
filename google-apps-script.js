// ============================================================
// TUMBUH — Google Apps Script
// Cara deploy:
// 1. Buka script.google.com → New project
// 2. Paste kode ini, ganti SPREADSHEET_ID dan MAKE_WEBHOOK_URL
// 3. Deploy → New deployment → Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 4. Copy URL deployment → tempel ke form-handler.js
// ============================================================

const SPREADSHEET_ID  = "GANTI_DENGAN_ID_SPREADSHEET_KAMU";
const SHEET_NAME      = "Leads";
const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/GANTI_DENGAN_WEBHOOK_KAMU";

// Dipanggil otomatis saat ada POST request dari form
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    simpanKeSheets(data);
    triggerMakeWebhook(data);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Simpan data lead ke Google Sheets
function simpanKeSheets(data) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet   = ss.getSheetByName(SHEET_NAME);

  // Buat sheet baru kalau belum ada
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = [
      "Timestamp", "Nomor WA", "Kategori Bisnis",
      "Lama Usaha", "Tantangan", "Omzet/Bulan", "Status"
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground("#3a7010")
      .setFontColor("#ffffff")
      .setFontWeight("bold");
  }

  // Tambah baris baru
  const row = [
    data.timestamp   || new Date().toISOString(),
    data.nomor_wa    || "",
    data.kategori    || "",
    data.lama_usaha  || "",
    data.tantangan   || "",
    data.omzet       || "",
    "Baru masuk",   // Status awal, bisa kamu update manual
  ];

  sheet.appendRow(row);

  // Auto-resize kolom biar rapih
  sheet.autoResizeColumns(1, row.length);
}

// Kirim data ke Make.com untuk trigger automation WA
function triggerMakeWebhook(data) {
  const payload = {
    nomor_wa:    data.nomor_wa,
    kategori:    data.kategori,
    lama_usaha:  data.lama_usaha,
    tantangan:   data.tantangan,
    omzet:       data.omzet,
    timestamp:   data.timestamp,

    // Pesan WA pertama yang akan dikirim ke user
    // Make.com akan forward ini ke Fonnte
    pesan_user: buildPesanUser(data),

    // Notif singkat ke kamu (admin)
    pesan_admin: buildPesanAdmin(data),
  };

  UrlFetchApp.fetch(MAKE_WEBHOOK_URL, {
    method:      "POST",
    contentType: "application/json",
    payload:     JSON.stringify(payload),
    muteHttpExceptions: true,
  });
}

// Bangun teks pesan WA ke user (ini yang diterima UMKM)
function buildPesanUser(data) {
  const persona = pilihPersona(data.kategori);

  return `Halo! 👋

Saya *${persona.nama}* dari *Tim Tumbuh*.

Saya udah baca cerita bisnis kamu — ${data.kategori.toLowerCase()} yang udah jalan ${data.lama_usaha.toLowerCase()}. 

Dari yang kamu share, tantangan utama kamu sekarang adalah *${data.tantangan.toLowerCase()}*. Ini salah satu yang paling sering kami temuin di UMKM seperti kamu.

Ada *3 hal* yang langsung saya notice dari kondisi bisnis kamu:

1️⃣ Masalah ${data.tantangan.toLowerCase()} ini biasanya punya akar yang lebih dalam dari yang keliatan
2️⃣ Dengan omzet di kisaran ${data.omzet}, ada beberapa quick win yang bisa langsung kamu coba
3️⃣ Ada satu hal yang kemungkinan besar belum kamu sadari jadi hambatan utama

Mau saya bedah lebih dalam bareng kamu? 

Ketik *YA* dan kita mulai konsultasinya sekarang. 🌱

— ${persona.nama}, Tim Tumbuh`;
}

// Bangun notif ke admin (kamu)
function buildPesanAdmin(data) {
  return `🌱 *Lead baru masuk!*

📱 WA: ${data.nomor_wa}
🏪 Bisnis: ${data.kategori}
⏱️ Lama: ${data.lama_usaha}
😓 Tantangan: ${data.tantangan}
💰 Omzet: ${data.omzet}
🕐 Waktu: ${new Date(data.timestamp).toLocaleString("id-ID")}`;
}

// Pilih persona konsultan berdasarkan kategori bisnis
function pilihPersona(kategori) {
  const personas = {
    "Makanan & Minuman": { nama: "Rina",   spesialisasi: "F&B" },
    "Fashion & Pakaian": { nama: "Dinda",  spesialisasi: "Fashion & Craft" },
    "Jasa & Servis":     { nama: "Budi",   spesialisasi: "Jasa & Servis" },
    "Produk Rumahan":    { nama: "Hendra", spesialisasi: "Produk & Retail" },
    "Lainnya":           { nama: "Rina",   spesialisasi: "Bisnis" },
  };
  return personas[kategori] || personas["Lainnya"];
}
