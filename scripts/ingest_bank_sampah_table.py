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
OPENAI_BASE_URL = ENV.get("OPENAI_BASE_URL", "https://ai.sumopod.com/v1").rstrip("/")
OPENAI_API_KEY = ENV.get("OPENAI_API_KEY")

def get_embeddings(texts):
    url = f"{OPENAI_BASE_URL}/embeddings"
    payload = {"model": "text-embedding-3-small", "input": texts}
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        return [item["embedding"] for item in res["data"]]

def insert_to_table(records):
    url = f"{SUPABASE_URL}/rest/v1/lokasi_bank_sampah"
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

def main():
    file_path = os.path.join("database", "lisaBot - lokasi_bank_sampah.csv")
    records = []
    texts_to_embed = []

    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            daerah = row.get("daerah", "").strip()
            kota = row.get("kota", "").strip()
            nama = row.get("nama_bank_sampah", "").strip()
            alamat = row.get("alamat", "").strip()
            jenis = row.get("jenisSampah", "").strip()
            jam = row.get("jam oprasional", "").strip()
            ket = row.get("keterangan", "").strip()

            if not daerah and not nama and not kota:
                continue

            if nama:
                content = f"Bank Sampah: {nama}. Daerah: {daerah}. Kota: {kota}. Alamat: {alamat}. Menerima: {jenis}. Jam buka: {jam}"
            else:
                content = f"Daerah: {daerah}. Kota: {kota}. Status: Belum ada bank sampah terdaftar."

            texts_to_embed.append(content)
            records.append({
                "daerah": daerah or None,
                "kota": kota,
                "nama_bank_sampah": nama or None,
                "alamat": alamat or None,
                "jenis_sampah": jenis or None,
                "jam_operasional": jam or None,
                "keterangan": ket or None
            })

    print(f"📦 Mengolah {len(records)} baris bank sampah...")
    embeddings = get_embeddings(texts_to_embed)
    for i, emb in enumerate(embeddings):
        records[i]["embedding"] = emb

    print("💾 Mengupload ke tabel public.lokasi_bank_sampah...")
    status = insert_to_table(records)
    print(f"✅ Selesai dengan HTTP status {status}! {len(records)} baris tersimpan.")

if __name__ == "__main__":
    main()
