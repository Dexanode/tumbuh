# ============================================================
# TUMBUH — CORE ROUTER
# File utama yang nyambungin semua persona
# Import file ini di backend untuk pakai semua persona
# ============================================================

from personas.rina   import build_system_prompt as build_rina,   EXTRACTION_PROMPT as extract_rina
from personas.dinda  import build_system_prompt as build_dinda,  EXTRACTION_PROMPT as extract_dinda
from personas.budi   import build_system_prompt as build_budi,   EXTRACTION_PROMPT as extract_budi
from personas.hendra import build_system_prompt as build_hendra, EXTRACTION_PROMPT as extract_hendra
from personas.rayla  import build_system_prompt as build_rayla,  EXTRACTION_PROMPT as extract_rayla
from personas.arif   import build_system_prompt as build_arif,   EXTRACTION_PROMPT as extract_arif
from personas.kera   import build_system_prompt as build_kera,   EXTRACTION_PROMPT as extract_kera


# ============================================================
# ROUTING — Pilih persona berdasarkan data user
# ============================================================

# Keyword untuk auto-detect Kera (Digital/Online/Freelance)
KEYWORD_KERA = [
    "freelance", "online", "digital", "konten", "content",
    "creator", "affiliate", "dropship", "reseller online",
    "instagram", "tiktok", "youtube", "desain", "design",
    "copywriting", "social media", "smm", "editing", "edit",
    "website", "aplikasi", "jasa online", "passive income",
    "side hustle", "jualan online", "bisnis online"
]

# Keyword untuk auto-detect Rayla (Perdagangan)
KEYWORD_RAYLA = [
    "warung", "toko", "kelontong", "eceran", "reseller",
    "distributor", "agen", "dagang", "retail", "sembako",
    "grosir", "kulakan", "pedagang"
]

# Keyword untuk auto-detect Arif (Wildcard)
KEYWORD_ARIF = [
    "ternak", "budidaya", "tambak", "kebun", "sawah",
    "rental", "sewa", "foto", "video", "fotografi",
    "sablon", "percetakan", "jangkrik", "lele",
    "ikan", "kambing", "tato", "barber", "pangkas",
    "spa", "refleksi", "musik", "kursus", "travel", "tour",
    "souvenir", "kerajinan", "handmade", "tanaman", "pupuk"
]

def pilih_persona(kategori: str, deskripsi: str = "") -> str:
    """
    Pilih nama persona berdasarkan kategori form + deskripsi bisnis.

    Returns: "RINA"|"DINDA"|"BUDI"|"HENDRA"|"RAYLA"|"KERA"|"ARIF"
    """
    # Mapping langsung dari pilihan form
    kategori_map = {
        "Makanan & Minuman":    "RINA",
        "Fashion & Pakaian":    "DINDA",
        "Jasa & Servis":        "BUDI",
        "Produk Rumahan":       "HENDRA",
        "Perdagangan & Warung": "RAYLA",
        "Bisnis Online":        "KERA",
    }

    if kategori in kategori_map:
        return kategori_map[kategori]

    # Kalau "Lainnya", analisis deskripsi bisnis user
    deskripsi_lower = deskripsi.lower()

    for keyword in KEYWORD_KERA:
        if keyword in deskripsi_lower:
            return "KERA"

    for keyword in KEYWORD_RAYLA:
        if keyword in deskripsi_lower:
            return "RAYLA"

    for keyword in KEYWORD_ARIF:
        if keyword in deskripsi_lower:
            return "ARIF"

    # Default fallback
    return "ARIF"


def get_system_prompt(
    kategori: str,
    profil_user: dict,
    history: list,
    knowledge_base_update: str = "",
    deskripsi: str = ""
) -> tuple[str, str]:
    """
    Ambil system prompt yang sudah dirakit lengkap.

    Returns: (system_prompt, nama_persona)
    """
    persona = pilih_persona(kategori, deskripsi)

    builders = {
        "RINA":   build_rina,
        "DINDA":  build_dinda,
        "BUDI":   build_budi,
        "HENDRA": build_hendra,
        "RAYLA":  build_rayla,
        "KERA":   build_kera,
        "ARIF":   build_arif,
    }
    
    prompt = builders[persona](profil_user, history, knowledge_base_update)
    return prompt, persona


def get_extraction_prompt(persona: str, conversation_text: str) -> str:
    """
    Ambil prompt untuk ekstrak insight dari conversation yang selesai.
    Dipanggil setiap akhir sesi untuk update knowledge base.
    """
    extraction_prompts = {
        "RINA":   extract_rina,
        "DINDA":  extract_dinda,
        "BUDI":   extract_budi,
        "HENDRA": extract_hendra,
        "RAYLA":  extract_rayla,
        "KERA":   extract_kera,
        "ARIF":   extract_arif,
    }
    
    prompt = extraction_prompts.get(persona, extract_arif)
    return prompt.replace("[CONVERSATION_TEXT]", conversation_text)


# ============================================================
# CONTOH PENGGUNAAN DI BACKEND
# ============================================================

"""
import anthropic
from core.router import get_system_prompt, get_extraction_prompt

client = anthropic.Anthropic(api_key="API_KEY_KAMU")

# 1. User kirim pesan WA
def handle_incoming_wa(nomor_wa: str, pesan: str):
    # Ambil data user dari database
    user = db.get_user(nomor_wa)
    profil = user['profil']
    history = user['history']
    kb_update = db.get_latest_knowledge(profil['kategori'])
    
    # Pilih persona dan build prompt
    system_prompt, persona_name = get_system_prompt(
        kategori=profil['kategori'],
        profil_user=profil,
        history=history,
        knowledge_base_update=kb_update,
        deskripsi=profil.get('deskripsi', '')
    )
    
    # Append pesan baru ke conversation history
    messages = user['messages'] + [{"role": "user", "content": pesan}]
    
    # Panggil Claude API
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=500,
        system=system_prompt,
        messages=messages
    )
    
    balasan = response.content[0].text
    
    # Simpan ke database
    db.append_message(nomor_wa, "user", pesan)
    db.append_message(nomor_wa, "assistant", balasan)
    
    # Kirim balik ke WA via Fonnte
    fonnte.send(nomor_wa, balasan)
    
    # Kalau sesi sudah 10+ pesan, jalankan ekstraksi insight
    if len(messages) % 10 == 0:
        extract_and_save_insight(nomor_wa, persona_name, messages)
    
    return balasan


# 2. Ekstrak insight setelah sesi selesai
def extract_and_save_insight(nomor_wa: str, persona: str, messages: list):
    conversation_text = "\n".join([
        f"{m['role'].upper()}: {m['content']}" 
        for m in messages[-20:]  # Ambil 20 pesan terakhir
    ])
    
    extraction_prompt = get_extraction_prompt(persona, conversation_text)
    
    result = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=500,
        messages=[{"role": "user", "content": extraction_prompt}]
    )
    
    import json
    try:
        insight = json.loads(result.content[0].text)
        db.save_knowledge_insight(persona, insight)  # Simpan ke knowledge base
    except:
        pass  # Kalau gagal parse JSON, skip
"""
