-- Dedicated Table for Lokasi Bank Sampah
create table if not exists public.lokasi_bank_sampah (
    id bigserial primary key,
    daerah text,
    kota text not null,
    nama_bank_sampah text,
    alamat text,
    jenis_sampah text,
    jam_operasional text,
    keterangan text,
    embedding extensions.vector(1536),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- HNSW Vector Index for semantic location search
create index if not exists lokasi_bank_sampah_embedding_hnsw_idx
on public.lokasi_bank_sampah
using hnsw (embedding extensions.vector_cosine_ops);

-- Enable RLS and public read
alter table public.lokasi_bank_sampah enable row level security;

create policy "Allow read lokasi_bank_sampah"
on public.lokasi_bank_sampah for select
using (true);

-- RPC for semantic search specifically on bank sampah
create or replace function match_bank_sampah (
    query_embedding extensions.vector(1536),
    match_threshold float default 0.45,
    match_count int default 5
)
returns table (
    id bigint,
    daerah text,
    kota text,
    nama_bank_sampah text,
    alamat text,
    jenis_sampah text,
    jam_operasional text,
    keterangan text,
    similarity float
)
language sql stable
as $$
    select
        b.id,
        b.daerah,
        b.kota,
        b.nama_bank_sampah,
        b.alamat,
        b.jenis_sampah,
        b.jam_operasional,
        b.keterangan,
        1 - (b.embedding <=> query_embedding) as similarity
    from public.lokasi_bank_sampah b
    where (1 - (b.embedding <=> query_embedding)) > match_threshold
    order by b.embedding <=> query_embedding
    limit match_count;
$$;
