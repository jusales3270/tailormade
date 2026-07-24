-- T-009: Realtime em mensagens. Sem isso, o INSERT nunca chega às outras abas — RLS
-- continua valendo nos eventos de postgres_changes, então cada assinante só recebe as
-- linhas que já conseguiria ler via SELECT (pode_ver_canal).
alter publication supabase_realtime add table mensagens;
