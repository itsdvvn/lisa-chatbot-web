-- 1. Enable pgvector extension
create extension if not exists vector with schema extensions;

-- 2. Knowledge Base Table for RAG
create table if not exists public.knowledge_base (
    id bigserial primary key,
    source_type text not null, -- 'klasifikasi', 'panduan', 'bank_sampah'
    title text not null,       -- nama jenis sampah / nama bank sampah
    category text,            -- 'Organik', 'Anorganik', 'Residu', dll.
    content text not null,     -- teks lengkap untuk konteks LLM
    metadata jsonb default '{}'::jsonb, -- metadata (link video cloudflare, maps, jam buka, dll)
    embedding extensions.vector(1536),  -- 1536 dim (OpenAI text-embedding-3-small)
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. HNSW Vector Index for Super-fast Cosine Distance Search
create index if not exists knowledge_base_embedding_hnsw_idx
on public.knowledge_base
using hnsw (embedding extensions.vector_cosine_ops);

-- 4. Semantic Search RPC Function (Cosine Distance)
create or replace function match_knowledge (
    query_embedding extensions.vector(1536),
    match_threshold float default 0.50,
    match_count int default 5
)
returns table (
    id bigint,
    source_type text,
    title text,
    category text,
    content text,
    metadata jsonb,
    similarity float
)
language sql stable
as $$
    select
        kb.id,
        kb.source_type,
        kb.title,
        kb.category,
        kb.content,
        kb.metadata,
        1 - (kb.embedding <=> query_embedding) as similarity
    from public.knowledge_base kb
    where (1 - (kb.embedding <=> query_embedding)) > match_threshold
    order by kb.embedding <=> query_embedding
    limit match_count;
$$;

-- 5. Aspirasi Siswa Table (replaces Google Sheet)
create table if not exists public.aspirasi_siswa (
    id uuid default gen_random_uuid() primary key,
    session_id text,
    pesan text not null,
    lampiran_url text,
    status text default 'Terkirim',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Row Level Security (RLS)
alter table public.knowledge_base enable row level security;
alter table public.aspirasi_siswa enable row level security;

-- Allow anonymous read on knowledge_base
create policy "Allow read knowledge_base"
on public.knowledge_base for select
using (true);

-- Allow anonymous insert on aspirasi_siswa
create policy "Allow insert aspirasi"
on public.aspirasi_siswa for insert
with check (true);
