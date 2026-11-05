from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from web3 import Web3
import json
import requests
import os
import shutil
import sqlite3
from dotenv import load_dotenv

# Load variabel dari file .env
load_dotenv()

app = FastAPI(title="API Transparansi Kas IPNU")

# 1. SETUP CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RPC_URL = os.getenv("WEB3_PROVIDER_URI")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")

# Inisialisasi koneksi Web3
w3 = Web3(Web3.HTTPProvider(RPC_URL))

kas_contract = None

try:
    with open("KasOrganisasi.json", "r") as f:
        contract_json = json.load(f)
        contract_abi = contract_json.get("abi", contract_json)
        
    if CONTRACT_ADDRESS:
        checksum_address = w3.to_checksum_address(CONTRACT_ADDRESS)
        kas_contract = w3.eth.contract(address=checksum_address, abi=contract_abi)
        print("Kontrak berhasil di-load!")
except Exception as e:
    print(f"GAGAL SETUP KONTRAK: {e}")

os.makedirs("uploads", exist_ok=True)

# ====================================================
# 🔥 FUNGSI HELPER KONEKSI DATABASE (ANTI-JEBOL)
# ====================================================
def get_db_connection():
    """Selalu panggil ini tiap kali mau ngakses database biar otomatis bikin tabel kalau file .db terhapus"""
    conn = sqlite3.connect('kas_ipnu.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pengurus (
            jabatan TEXT PRIMARY KEY,
            dompet TEXT,
            no_wa TEXT
        )
    ''')
    conn.commit()
    return conn, cursor

class PengurusWA(BaseModel):
    dompet: str
    jabatan: str
    no_wa: str

# ====================================================
# ENDPOINT-ENDPOINT API
# ====================================================

@app.get("/")
def cek_status():
    return {
        "status": "Backend Python Aktif", 
        "terhubung_blockchain": w3.is_connected(),
        "alamat_kontrak": CONTRACT_ADDRESS,
        "kontrak_ready": kas_contract is not None
    }

@app.get("/api/v1/saldo")
def get_saldo_brankas():
    if not w3.is_connected():
        raise HTTPException(status_code=500, detail="Tidak terhubung ke blockchain Anvil.")
    
    saldo_wei = w3.eth.get_balance(CONTRACT_ADDRESS)
    saldo_eth = w3.from_wei(saldo_wei, 'ether')
    return {"saldo_eth": float(saldo_eth), "mata_uang": "ETH"}

@app.get("/api/v1/pengurus")
def get_alamat_pengurus():
    if not w3.is_connected() or kas_contract is None:
        raise HTTPException(status_code=500, detail="Blockchain atau Kontrak tidak siap.")
    
    try:
        return {
            "ketua": kas_contract.functions.ketua().call(),
            "wakil": kas_contract.functions.wakil().call(),
            "bendahara": kas_contract.functions.bendahara().call()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error Blockchain: {str(e)}")


@app.post("/api/v1/pengurus/wa")
async def simpan_nomor_wa(data: PengurusWA):
    try:
        conn, cursor = get_db_connection()
        cursor.execute('''
            INSERT OR REPLACE INTO pengurus (jabatan, dompet, no_wa)
            VALUES (?, ?, ?)
        ''', (data.jabatan.lower(), data.dompet.lower(), data.no_wa))
        
        conn.commit()
        conn.close()
        
        return {"status": "sukses", "pesan": f"Nomor WA untuk jabatan {data.jabatan} berhasil disimpan!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ====================================================
# ENDPOINT HYBRID UNTUK TERIMA DOKUMEN PROPOSAL (WEB2)
# ====================================================
@app.post("/api/v1/proposal/hybrid")
async def ajukan_proposal_hybrid(deskripsi: str = Form(...), file: UploadFile = File(...)):
    if not os.path.exists("uploads"):
        os.makedirs("uploads")
        
    ext = file.filename.split(".")[-1] 
    nama_baru = f"{deskripsi}.{ext}"
    file_path = os.path.join("uploads", nama_baru)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"status": "sukses", "pesan": "File diamankan di Web2"}

@app.get("/api/v1/dokumen/{deskripsi_proposal}")
async def lihat_dokumen(deskripsi_proposal: str):
    folder = "uploads"
    if os.path.exists(folder):
        for filename in os.listdir(folder):
            if filename.startswith(deskripsi_proposal):
                return FileResponse(os.path.join(folder, filename))
                
    return {"error": "Dokumen tidak ditemukan di server Web2"}

@app.delete("/api/v1/proposal/cleanup/{filename}")
async def cleanup_proposal_file(filename: str):
    file_path = os.path.join("uploads", filename)
    
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"status": "success", "message": f"File {filename} berhasil dibersihkan dari server."}
    
    return {"status": "not found", "message": "File tidak ditemukan."}

# ====================================================
# 🔥 MESIN PENGIRIM WHATSAPP (FONNTE API)
# ====================================================

FONNTE_TOKEN = os.getenv("FONNTE_TOKEN")

class NotifPengajuan(BaseModel):
    judul: str
    nominal: str

class NotifCair(BaseModel):
    judul: str

def get_nomor_wa(jabatan: str):
    try:
        conn, cursor = get_db_connection()
        cursor.execute("SELECT no_wa FROM pengurus WHERE jabatan=?", (jabatan.lower(),))
        result = cursor.fetchone()
        conn.close()
        return result[0] if result else None
    except:
        return None

def kirim_pesan_fonnte(target_wa: str, pesan: str):
    if not target_wa or not FONNTE_TOKEN:
        return False
    
    url = "https://api.fonnte.com/send"
    headers = {"Authorization": FONNTE_TOKEN}
    data = {"target": target_wa, "message": pesan}
    
    try:
        response = requests.post(url, headers=headers, data=data)
        return response.status_code == 200
    except Exception as e:
        print(f"Error Fonnte: {e}")
        return False

@app.post("/api/v1/notif/pengajuan")
async def trigger_notif_pengajuan(data: NotifPengajuan):
    no_ketua = get_nomor_wa("ketua")
    no_wakil = get_nomor_wa("wakil")
    
    pesan = f"🚨 *[SISTEM KAS IPNU]* 🚨\n\nAda pengajuan pencairan dana baru dari Bendahara!\n\n📌 *Judul:* {data.judul}\n💎 *Nominal:* {data.nominal} ETH\n\nSilakan buka aplikasi DApp Kas IPNU untuk melakukan peninjauan dan Tanda Tangan."
    
    if no_ketua: kirim_pesan_fonnte(no_ketua, pesan)
    if no_wakil: kirim_pesan_fonnte(no_wakil, pesan)
        
    return {"status": "Notif pengajuan dikirim!"}

@app.post("/api/v1/notif/cair")
async def trigger_notif_cair(data: NotifCair):
    pesan = f"✅ *[SISTEM KAS IPNU]* ✅\n\nPengajuan dana untuk *'{data.judul}'* telah mendapatkan persetujuan lengkap dan dana *BERHASIL DICAIRKAN* ke dompet tujuan.\n\nLaporan keuangan telah otomatis tercatat di Blockchain."
    
    for jab in ["ketua", "wakil", "bendahara"]:
        no = get_nomor_wa(jab)
        if no: kirim_pesan_fonnte(no, pesan)
            
    return {"status": "Notif pencairan dikirim!"}    

@app.get("/api/v1/pengurus/wa/{jabatan}")
async def cek_nomor_wa(jabatan: str):
    try:
        conn, cursor = get_db_connection()
        cursor.execute("SELECT no_wa FROM pengurus WHERE jabatan=?", (jabatan.lower(),))
        result = cursor.fetchone()
        conn.close()
        
        terdaftar = bool(result and result[0])
        return {"terdaftar": terdaftar, "no_wa": result[0] if result else None}
    except Exception as e:
        return {"terdaftar": False, "error": str(e)}