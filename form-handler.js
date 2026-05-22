// ============================================================
// TUMBUH — Form Handler
// Pasang di website kamu, isi APPS_SCRIPT_URL dengan URL
// dari Google Apps Script yang sudah kamu deploy.
// ============================================================

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/GANTI_DENGAN_URL_KAMU/exec";

// Jawaban form yang dikumpulkan step by step
const formData = {
  kategori: "",
  lama_usaha: "",
  tantangan: "",
  omzet: "",
  nomor_wa: "",
  timestamp: "",
};

// Mapping jawaban option ke teks readable
const opsiJawaban = {
  kategori:    ["Makanan & Minuman","Fashion & Pakaian","Jasa & Servis","Produk Rumahan","Lainnya"],
  lama_usaha:  ["Baru mulai (< 1 tahun)","1–2 tahun","3–5 tahun","Lebih dari 5 tahun"],
  tantangan:   ["Pelanggan sepi","Tidak tau cara marketing","Cashflow seret","Banyak saingan","Omzet stagnan"],
  omzet:       ["Di bawah Rp 5 juta","Rp 5–20 juta","Rp 20–50 juta","Di atas Rp 50 juta"],
};

// Dipanggil saat user selesai isi semua step
async function submitFormTumbuh(jawaban) {
  formData.kategori   = opsiJawaban.kategori[jawaban[0]]   || "-";
  formData.lama_usaha = opsiJawaban.lama_usaha[jawaban[1]] || "-";
  formData.tantangan  = opsiJawaban.tantangan[jawaban[2]]  || "-";
  formData.omzet      = opsiJawaban.omzet[jawaban[3]]      || "-";
  formData.nomor_wa   = normalizeNomorWA(jawaban[4]);
  formData.timestamp  = new Date().toISOString();

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const result = await res.json();
    if (result.status === "ok") {
      tampilkanSukses();
    } else {
      tampilkanError("Ups, ada masalah. Coba lagi ya.");
    }
  } catch (err) {
    console.error("Submit error:", err);
    tampilkanError("Koneksi bermasalah. Coba lagi.");
  }
}

// Normalisasi nomor WA: 08xxx → 628xxx
function normalizeNomorWA(nomor) {
  const bersih = nomor.replace(/[\s\-().]/g, "");
  if (bersih.startsWith("0"))  return "62" + bersih.slice(1);
  if (bersih.startsWith("+62")) return bersih.slice(1);
  if (bersih.startsWith("62"))  return bersih;
  return "62" + bersih;
}

function tampilkanSukses() {
  document.getElementById("form-card").innerHTML = `
    <div style="text-align:center;padding:2rem 1rem;">
      <div style="font-size:48px;margin-bottom:1rem;">🌱</div>
      <h3 style="font-family:'Sora',sans-serif;font-size:18px;font-weight:700;margin-bottom:.5rem;">
        Makasih! Tim Tumbuh lagi analisis bisnis kamu.
      </h3>
      <p style="font-size:14px;color:#5a6e48;line-height:1.6;">
        Tunggu ya — kami kirim insight langsung ke WhatsApp kamu 
        dalam <strong>5 menit</strong>. Pastikan HP kamu aktif!
      </p>
    </div>`;
}

function tampilkanError(pesan) {
  const errEl = document.getElementById("form-error");
  if (errEl) {
    errEl.textContent = pesan;
    errEl.style.display = "block";
  }
}

export { submitFormTumbuh, normalizeNomorWA };
