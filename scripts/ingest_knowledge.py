import os
import sys
import csv
import json
import urllib.request
import urllib.error

# Ensure UTF-8 output on Windows console
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

def get_embeddings(texts, model="text-embedding-3-small"):
    url = f"{OPENAI_BASE_URL}/embeddings"
    payload = {
        "model": model,
        "input": texts
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        return [item["embedding"] for item in res["data"]]

def insert_to_supabase(records):
    url = f"{SUPABASE_URL}/rest/v1/knowledge_base"
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

def parse_klasifikasi():
    file_path = os.path.join("database", "lisaBot - klasifikasi_sampah.csv")
    records = []
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            keyword = row.get("keyword", "").strip()
            local_name = row.get("local_name", "").strip()
            if not local_name and not keyword:
                continue
            category = row.get("category", "").strip()
            sumber = row.get("sumber", "").strip()
            cf_link = row.get("cloudflare_link", "").strip()
            edukasi = row.get("edukasi_singkat", "").strip()
            langkah = row.get("langkah_olah", "").strip()
            alat = row.get("alat_dibutuhkan", "").strip()
            hasil = row.get("hasil_akhir", "").strip()

            content_lines = [
                f"Jenis Sampah: {local_name} ({keyword})" if keyword else f"Jenis Sampah: {local_name}",
                f"Kategori: {category}",
                f"Edukasi Singkat: {edukasi}",
                f"Langkah Pengolahan: {langkah}",
                f"Alat yang Dibutuhkan: {alat}",
                f"Hasil Akhir: {hasil}"
            ]
            if cf_link:
                content_lines.append(f"Link Video Tutorial: {cf_link}")
            if sumber:
                content_lines.append(f"Sumber Tutorial: {sumber}")

            content = "\n".join(content_lines)
            metadata = {
                "keyword": keyword,
                "local_name": local_name,
                "category": category,
                "sumber": sumber,
                "cloudflare_link": cf_link,
                "langkah_olah": langkah,
                "alat_dibutuhkan": alat,
                "hasil_akhir": hasil
            }
            records.append({
                "source_type": "klasifikasi",
                "title": f"{local_name} ({keyword})" if keyword else local_name,
                "category": category,
                "content": content,
                "metadata": metadata
            })
    return records

def parse_panduan():
    file_path = os.path.join("database", "lisaBot - panduan_olah.csv")
    records = []
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            jenis = row.get("jenis_sampah", "").strip()
            if not jenis:
                continue
            kategori = row.get("kategori", "").strip()
            langkah = row.get("langkah_olah", "").strip()
            alat = row.get("alat_dibutuhkan", "").strip()
            hasil = row.get("hasil_akhir", "").strip()
            sumber = row.get("sumber", "").strip()

            content = (
                f"Panduan Pengolahan: {jenis}\n"
                f"Kategori: {kategori}\n"
                f"Langkah Pengolahan: {langkah}\n"
                f"Alat yang Dibutuhkan: {alat}\n"
                f"Hasil Akhir: {hasil}\n"
                f"Sumber: {sumber}"
            )
            metadata = {
                "jenis_sampah": jenis,
                "kategori": kategori,
                "langkah_olah": langkah,
                "alat_dibutuhkan": alat,
                "hasil_akhir": hasil,
                "sumber": sumber
            }
            records.append({
                "source_type": "panduan",
                "title": f"Panduan: {jenis}",
                "category": kategori,
                "content": content,
                "metadata": metadata
            })
    return records

def parse_bank_sampah():
    file_path = os.path.join("database", "lisaBot - lokasi_bank_sampah.csv")
    records = []
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            nama = row.get("nama_bank_sampah", "").strip()
            daerah = row.get("daerah", "").strip()
            kota = row.get("kota", "").strip()
            ket = row.get("keterangan", "").strip().lower()

            if nama:
                alamat = row.get("alamat", "").strip()
                jenis = row.get("jenisSampah", "").strip()
                jam = row.get("jam oprasional", "").strip()

                content = (
                    f"Bank Sampah: {nama}\n"
                    f"Daerah / Wilayah: {daerah}\n"
                    f"Kota: {kota}\n"
                    f"Alamat / Maps: {alamat}\n"
                    f"Jenis Sampah yang Diterima: {jenis}\n"
                    f"Jam Operasional: {jam}"
                )
                metadata = {
                    "nama_bank_sampah": nama,
                    "daerah": daerah,
                    "kota": kota,
                    "alamat": alamat,
                    "jenis_sampah": jenis,
                    "jam_operasional": jam,
                    "status": "aktif"
                }
                title = f"{nama} ({daerah}, {kota})" if daerah else f"{nama} ({kota})"
                records.append({
                    "source_type": "bank_sampah",
                    "title": title,
                    "category": "Bank Sampah",
                    "content": content,
                    "metadata": metadata
                })
            elif daerah:
                content = (
                    f"Daerah / Kelurahan: {daerah}\n"
                    f"Kota: {kota}\n"
                    f"Status Bank Sampah: Belum ada bank sampah terdaftar di daerah {daerah}.\n"
                    f"Informasi: Siswa atau warga di daerah {daerah} ({kota}) dapat menyalurkan sampah ke bank sampah terdekat di kota {kota}."
                )
                metadata = {
                    "daerah": daerah,
                    "kota": kota,
                    "nama_bank_sampah": None,
                    "status": "belum_ada"
                }
                records.append({
                    "source_type": "bank_sampah",
                    "title": f"Daerah: {daerah} ({kota}) - Belum Ada Bank Sampah",
                    "category": "Bank Sampah (Belum Ada)",
                    "content": content,
                    "metadata": metadata
                })
    return records

def test_semantic_search(query):
    emb = get_embeddings([query])[0]
    url = f"{SUPABASE_URL}/rest/v1/rpc/match_knowledge"
    req = urllib.request.Request(
        url,
        data=json.dumps({
            "query_embedding": emb,
            "match_threshold": 0.45,
            "match_count": 3
        }).encode("utf-8"),
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json"
        }
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        print(f"\n🔍 Query: '{query}'")
        for i, item in enumerate(res, 1):
            print(f"  [{i}] (Similarity: {item['similarity']:.3f}) {item['title']} - {item['category']}")
            if item.get("metadata", {}).get("cloudflare_link"):
                print(f"      Video: {item['metadata']['cloudflare_link']}")

def main():
    print("🚀 Memulai proses ingestion database ke Supabase pgvector...")
    all_records = []
    klasifikasi = parse_klasifikasi()
    print(f"📦 Klasifikasi Sampah: {len(klasifikasi)} item")
    all_records.extend(klasifikasi)

    panduan = parse_panduan()
    print(f"📦 Panduan Olah: {len(panduan)} item")
    all_records.extend(panduan)

    bank = parse_bank_sampah()
    print(f"📦 Lokasi Bank Sampah: {len(bank)} item")
    all_records.extend(bank)

    print(f"📊 Total Data untuk di-embed & di-upload: {len(all_records)} item")

    batch_size = 20
    for i in range(0, len(all_records), batch_size):
        batch = all_records[i:i + batch_size]
        contents = [item["content"] for item in batch]
        print(f"⚡ Generating embeddings batch {i+1} s/d {min(i+batch_size, len(all_records))}...")
        embeddings = get_embeddings(contents)
        for j, emb in enumerate(embeddings):
            batch[j]["embedding"] = emb
        
        print(f"💾 Uploading batch to Supabase...")
        insert_to_supabase(batch)

    print("🎉 Ingestion selesai 100%!")
    print("\n--- Testing Semantic Search RPC ---")
    test_semantic_search("cara olah botol aqua plastik")
    test_semantic_search("bikin pupuk atau eco enzyme dari kulit buah")
    test_semantic_search("bank sampah di jombang tangerang selatan")

if __name__ == "__main__":
    main()
