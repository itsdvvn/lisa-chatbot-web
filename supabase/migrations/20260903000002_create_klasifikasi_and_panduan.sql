-- Dedicated Table for Klasifikasi Sampah
create table if not exists public.klasifikasi_sampah (
    id bigserial primary key,
    keyword text,
    local_name text not null,
    category text not null,
    sumber text,
    cloudflare_link text,
    edukasi_singkat text,
    langkah_olah text,
    alat_dibutuhkan text,
    hasil_akhir text,
    embedding extensions.vector(1536),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Dedicated Table for Panduan Olah
create table if not exists public.panduan_olah (
    id bigserial primary key,
    kategori text not null,
    jenis_sampah text not null,
    langkah_olah text,
    alat_dibutuhkan text,
    hasil_akhir text,
    sumber text,
    embedding extensions.vector(1536),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index if not exists klasifikasi_sampah_embedding_hnsw_idx on public.klasifikasi_sampah using hnsw (embedding extensions.vector_cosine_ops);
create index if not exists panduan_olah_embedding_hnsw_idx on public.panduan_olah using hnsw (embedding extensions.vector_cosine_ops);

-- RLS
alter table public.klasifikasi_sampah enable row level security;
alter table public.panduan_olah enable row level security;

create policy "Allow read klasifikasi_sampah" on public.klasifikasi_sampah for select using (true);
create policy "Allow read panduan_olah" on public.panduan_olah for select using (true);
