-- Standard LangChain SupabaseVectorStore search function
create or replace function match_documents (
  query_embedding extensions.vector(1536),
  match_count int default 5,
  filter jsonb default '{}'::jsonb
) returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    kb.id,
    kb.content,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) as similarity
  from public.knowledge_base kb
  where (filter = '{}'::jsonb or kb.metadata @> filter)
  order by kb.embedding <=> query_embedding
  limit match_count;
end;
$$;
