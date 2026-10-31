# Avaliação dos planos: 2026-10-30

Modelo llama3.2 (embeddings mxbai-embed-large), Ollama e Supabase locais, 8 perfis fictícios em sequência.
**2 de 8 aprovados.** Reprovado = o plano saiu, mas a reconferência achou problema; falhou = o serviço não entregou plano.
Tempo médio (planos entregues): 107 s. Limite do app 180 s; meta 60 s.

| Perfil | Situação | Tempo | Plano |
|---|---|---|---|
| Iniciante em casa | falhou | 1050 s | - |
| Avançado 6x | falhou | 952 s | - |
| Mulher 50+ emagrecimento | falhou | 304 s | - |
| Vegano | falhou | 65 s | - |
| Sem lactose | falhou | 50 s | - |
| 2x por semana | aprovado | 64 s | Superior / Inferior; 2 dias, 10 exercícios; 1917 kcal; 3 fundamentos |
| Restrição no joelho | aprovado | 149 s | Empurrar / Puxar / Pernas; 3 dias, 13 exercícios; 1722 kcal; 3 fundamentos |
| Peso do corpo intermediário | falhou | 34 s | - |

## Detalhes

### Iniciante em casa
- Não consegui falar com o gerador de planos. Confira se o Mac está ligado e na mesma rede.
- [ollama] The operation was aborted due to timeout

### Avançado 6x
- Não consegui falar com o gerador de planos. Confira se o Mac está ligado e na mesma rede.
- [ollama] The operation was aborted due to timeout

### Mulher 50+ emagrecimento
- Não consegui falar com o gerador de planos. Confira se o Mac está ligado e na mesma rede.
- [ollama] The operation was aborted due to timeout

### Vegano
- {"message":"An unexpected error occurred"}

### Sem lactose
- {"code":"57014","details":null,"hint":null,"message":"canceling statement due to statement timeout"}

### 2x por semana
- Levou 64 s: acima da meta de 60 s.

### Restrição no joelho
- Levou 149 s: acima da meta de 60 s.

### Peso do corpo intermediário
- {"code":"57014","details":null,"hint":null,"message":"canceling statement due to statement timeout"}
