-- A função revela nomes de colunas; só quem tem login chama.
revoke execute on function public.validar_compatibilidade_planejamento() from anon, public;
grant execute on function public.validar_compatibilidade_planejamento() to authenticated;
