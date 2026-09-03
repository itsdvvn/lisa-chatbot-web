import os
import sys
import csv
import json
import urllib.request

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def load_env():
    env_vars = {}
    if os.path.exists(".env"):
        with open(".env", "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env_vars[k.strip()] = v.strip()
    return env_vars

ENV = load_env()
SUPABASE_URL = ENV.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = ENV.get("SUPABASE_SERVICE_KEY")

def insert_records(table, records):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    req = urllib.request.Request(
        url,
        data=json.dumps(records).encode("utf-8"),
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
    )
    with urllib.request.urlopen(req) as resp:
        return resp.status

def ingest_klasifikasi():
    file_path = os.path.join("database", "lisaBot - klasifikasi_sampah.csv")
    records = []
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            local_name = row.get("local_name", "").strip()
            if not local_name:
                continue
            records.append({
                "keyword": row.get("keyword", "").strip() or None,
                "local_name": local_name,
                "category": row.get("category", "").strip(),
                "sumber": row.get("sumber", "").strip() or None,
                "cloudflare_link": row.get("cloudflare_link", "").strip() or None,
                "edukasi_singkat": row.get("edukasi_singkat", "").strip() or None,
                "langkah_olah": row.get("langkah_olah", "").strip() or None,
                "alat_dibutuhkan": row.get("alat_dibutuhkan", "").strip() or None,
                "hasil_akhir": row.get("hasil_akhir", "").strip() or None
            })
    status = insert_records("klasifikasi_sampah", records)
    print(f"✅ klasifikasi_sampah: {len(records)} baris tersimpan (HTTP {status})")

def ingest_panduan():
    file_path = os.path.join("database", "lisaBot - panduan_olah.csv")
    records = []
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            jenis = row.get("jenis_sampah", "").strip()
            if not jenis:
                continue
            records.append({
                "kategori": row.get("kategori", "").strip(),
                "jenis_sampah": jenis,
                "langkah_olah": row.get("langkah_olah", "").strip() or None,
                "alat_dibutuhkan": row.get("alat_dibutuhkan", "").strip() or None,
                "hasil_akhir": row.get("hasil_akhir", "").strip() or None,
                "sumber": row.get("sumber", "").strip() or None
            })
    status = insert_records("panduan_olah", records)
    print(f"✅ panduan_olah: {len(records)} baris tersimpan (HTTP {status})")

def main():
    print("🚀 Mengisi data ke tabel klasifikasi_sampah & panduan_olah...")
    ingest_klasifikasi()
    ingest_panduan()
    print("🎉 Selesai!")

if __name__ == "__main__":
    main()
