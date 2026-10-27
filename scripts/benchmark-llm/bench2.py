"""Benchmark 2 — arquitetura ASSISTIDA: a LLM só escolhe; o código conta e calcula.

Treino: schema com um array por grupo muscular, IDs restritos por enum e min/maxItems.
        Ordem (compostos primeiro), séries e reps saem do código.
Dieta:  schema com N refeições, cada uma com 2–4 IDs (enum). Gramas calculadas por
        mínimos quadrados com limites (scipy.lsq_linear) para bater os macros.
"""
import json, sys, time
import numpy as np
from scipy.optimize import lsq_linear
import bench
from bench import TAREFAS_TREINO, TAREFAS_DIETA, chamar

SYSTEM_SEL = "Você é um personal trainer e nutricionista esportivo. Responda apenas em JSON válido."

# ─────────────────────────── TREINO ───────────────────────────
def slots(t):
    out = {}
    for chave, (a, b) in t["dist"].items():
        grupos = chave.split("+")
        ids = [e["id"] for e in t["pool"] if e["grupo"] in grupos]
        out[chave.replace("+", "_ou_").replace("-", "_")] = (grupos, ids, a, b)
    return out

def schema_treino(t):
    props = {k: {"type": "array", "items": {"type": "integer", "enum": ids}, "minItems": a, "maxItems": b}
             for k, (_, ids, a, b) in slots(t).items()}
    return {"type": "object", "properties": props, "required": list(props)}

def prompt_treino(t):
    lista = "\n".join(f'{e["id"]}|{e["nome"]}|{e["grupo"]}|{e["tipo"]}|{e["equip"]}' for e in t["pool"])
    pedidos = "\n".join(f"- {k}: escolha de {a} a {b} exercícios" for k, (_, _, a, b) in slots(t).items())
    return (f"Escolha os exercícios do treino de {t['tipo']} de hoje.\n{pedidos}\n"
            "Prefira ao menos um exercício composto por grupo. Não repita exercícios. Varie os equipamentos.\n\n"
            f"EXERCÍCIOS (id|nome|grupo|tipo|equipamento):\n{lista}")

def avaliar_treino(t, saida):
    by_id = {e["id"]: e for e in t["pool"]}
    pts, notas = 0, []
    todos = []
    for k, (grupos, ids, a, b) in slots(t).items():
        esc = saida.get(k, [])
        todos += esc
        if all(i in ids for i in esc) and a <= len(esc) <= b: pts += 1
        else: notas.append(f"{k} fora")
        if any(by_id[i]["tipo"] == "composto" for i in esc if i in by_id) or \
           not any(by_id[i]["tipo"] == "composto" for i in ids): pts += 1
        else: notas.append(f"{k} sem composto")
    if len(set(todos)) == len(todos): pts += 1
    else: notas.append("repetido")
    mx = 2 * len(slots(t)) + 1
    ordenado = sorted(todos, key=lambda i: by_id[i]["tipo"] != "composto")  # código ordena
    notas.append(" > ".join(by_id[i]["nome"] for i in ordenado if i in by_id))
    return pts, mx, notas

# ─────────────────────────── DIETA ───────────────────────────
PROTEINAS = {"carne", "peixe", "ovo", "laticinio", "suplemento", "leguminosa"}

def schema_dieta(t):
    ids = [a["id"] for a in t["pool"]]
    ref = {"type": "object", "properties": {
        "nome": {"type": "string"},
        "alimentos": {"type": "array", "items": {"type": "integer", "enum": ids}, "minItems": 2, "maxItems": 4}},
        "required": ["nome", "alimentos"]}
    return {"type": "object", "properties": {"refeicoes": {
        "type": "array", "items": ref, "minItems": t["refeicoes"], "maxItems": t["refeicoes"]}},
        "required": ["refeicoes"]}

def prompt_dieta(t):
    lista = "\n".join(f'{a["id"]}|{a["nome"]}|{a["cat"]}' for a in t["pool"])
    m = t["meta"]
    return (f"Monte o cardápio de um dia com {t['refeicoes']} refeições (café da manhã, almoço, lanches, jantar).\n"
            f"Meta diária: {m['kcal']} kcal, proteína {m['p']} g, carboidrato {m['c']} g, gordura {m['g']} g.\n"
            "Para cada refeição escolha de 2 a 4 alimentos que combinem no contexto brasileiro "
            "(ex.: arroz com feijão no almoço, pão com ovo no café). Toda refeição deve ter uma fonte de proteína. "
            "As quantidades serão calculadas depois — escolha apenas os alimentos.\n\n"
            f"ALIMENTOS (id|nome|categoria):\n{lista}")

def calcular_gramas(t, saida):
    by_id = {a["id"]: a for a in t["pool"]}
    itens = [(ri, i) for ri, r in enumerate(saida["refeicoes"]) for i in r["alimentos"]]
    m = t["meta"]
    A = np.array([[by_id[i][k] / 100 / m[k] for _, i in itens] for k in ("kcal", "p", "c", "g")])
    b = np.ones(4)
    lam = 0.02  # puxa porções para ~120 g (evita 0 g e 400 g)
    A = np.vstack([A, lam * np.eye(len(itens)) / 120])
    b = np.concatenate([b, lam * np.ones(len(itens))])
    lo = [3 if by_id[i]["cat"] == "gordura" else 30 for _, i in itens]
    hi = [30 if by_id[i]["cat"] == "gordura" else (60 if by_id[i]["cat"] == "suplemento" else 350) for _, i in itens]
    x = lsq_linear(A, b, bounds=(lo, hi)).x
    tot = {k: sum(by_id[i][k] * g / 100 for (_, i), g in zip(itens, x)) for k in ("kcal", "p", "c", "g")}
    return itens, x, tot

def avaliar_dieta(t, saida):
    by_id = {a["id"]: a for a in t["pool"]}
    pts, notas = 0, []
    refs = saida.get("refeicoes", [])
    if len(refs) == t["refeicoes"]: pts += 1
    if all(any(by_id[i]["cat"] in PROTEINAS for i in r["alimentos"]) for r in refs): pts += 2
    else: notas.append("refeição sem proteína")
    if all(len(set(r["alimentos"])) == len(r["alimentos"]) for r in refs): pts += 1
    itens, x, tot = calcular_gramas(t, saida)
    erros = {k: abs(tot[k] - t["meta"][k]) / t["meta"][k] for k in tot}
    for k, peso in (("kcal", 2), ("p", 1), ("c", 1), ("g", 1)):
        if erros[k] <= 0.05: pts += peso
        elif erros[k] <= 0.10: pts += peso / 2
    notas.append("erro " + " ".join(f"{k}:{erros[k]*100:.0f}%" for k in erros))
    cardapio = []
    for ri, r in enumerate(refs):
        cardapio.append(r["nome"] + ": " + ", ".join(
            f'{by_id[i]["nome"]} {g:.0f}g' for (rj, i), g in zip(itens, x) if rj == ri))
    notas.append(" | ".join(cardapio))
    return pts, 9, notas

# ─────────────────────────── EXECUÇÃO ───────────────────────────
def rodar(modelo, repeticoes=2):
    bench.SYSTEM = SYSTEM_SEL
    linhas = []
    tarefas = [(t, prompt_treino, schema_treino, avaliar_treino) for t in TAREFAS_TREINO] + \
              [(t, prompt_dieta, schema_dieta, avaliar_dieta) for t in TAREFAS_DIETA]
    for t, fp, fs, aval in tarefas:
        for rep in range(repeticoes):
            try:
                txt, dt, tps = chamar(modelo, fp(t), fs(t), None)
                try: pts, mx, notas = aval(t, json.loads(txt))
                except (json.JSONDecodeError, KeyError) as e: pts, mx, notas = 0, 9, [f"saída inválida {e}"]
            except Exception as e:
                pts, mx, notas, dt, tps = 0, 9, [f"ERRO {e}"[:120]], 0, 0
            linhas.append(dict(modelo=modelo, tarefa=t["nome"], rep=rep, pts=pts, max=mx,
                               seg=round(dt, 1), tps=round(tps, 1), notas=" ; ".join(notas)))
            print(json.dumps(linhas[-1], ensure_ascii=False), flush=True)
    import requests
    requests.post(bench.OLLAMA, json={"model": modelo, "keep_alive": 0, "messages": []})
    return linhas

if __name__ == "__main__":
    for m in sys.argv[1:]:
        rodar(m)
