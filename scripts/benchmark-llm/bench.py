"""Benchmark de LLMs locais (Ollama) nas tarefas reais do FitApp.

Tarefas:
  - treino: montar 1 dia (Push/Legs/Pull) escolhendo exercícios de uma lista com IDs
  - dieta: montar N refeições escolhendo alimentos (IDs) e gramas para bater metas de macros
Usa saída estruturada do Ollama (format = JSON Schema). IDs curtos (inteiros) mapeados no código.
"""
import json, random, sys, time, warnings
warnings.filterwarnings("ignore")
import requests

OLLAMA = "http://localhost:11434/api/chat"
DATASET = __import__("os").path.join(__import__("os").path.dirname(__file__), "../../scratch/exercicios-bd-ptbr/exercises/exercises-ptbr-full-translation.json")
random.seed(42)

# ─────────────────────────── EXERCÍCIOS ───────────────────────────
raw = json.load(open(DATASET))
raw = [x for x in raw if x["category"] in ("forca", "powerlifting")
       and "alongamento" not in x["name"].lower() and x["mechanic"]]
NIVEIS = {"iniciante": ["iniciante"], "intermediario": ["iniciante", "intermediario"],
          "avancado": ["iniciante", "intermediario", "avancado"]}

def pool_exercicios(grupos, equipamentos, nivel, por_grupo=8):
    pool = []
    for g in grupos:
        cand = [x for x in raw if x["primaryMuscles"][0] == g and x["equipment"] in equipamentos
                and x["level"] in NIVEIS[nivel]]
        random.shuffle(cand)
        pool += cand[:por_grupo]
    return [{"id": i + 1, "nome": x["name"], "grupo": x["primaryMuscles"][0],
             "tipo": x["mechanic"], "equip": x["equipment"]} for i, x in enumerate(pool)]

ACADEMIA = ["barra", "halteres", "cabo", "maquina"]
CASA = ["peso-do-corpo", "halteres"]

TAREFAS_TREINO = [
    dict(nome="Push academia intermediário", tipo="Push",
         pool=pool_exercicios(["peito", "ombros", "triceps"], ACADEMIA, "intermediario"),
         regra="6 exercícios: 2 a 3 de peito, 1 a 2 de ombros, 1 a 2 de triceps.",
         dist={"peito": (2, 3), "ombros": (1, 2), "triceps": (1, 2)}, total=(6, 6)),
    dict(nome="Legs em casa iniciante", tipo="Legs",
         pool=pool_exercicios(["quadriceps", "isquiotibiais", "gluteos", "panturrilhas"], CASA, "iniciante"),
         regra="6 exercícios: 2 de quadriceps, 2 de posterior (isquiotibiais ou gluteos), 1 a 2 de panturrilhas.",
         dist={"quadriceps": (2, 2), "isquiotibiais+gluteos": (2, 3), "panturrilhas": (1, 2)}, total=(6, 6)),
    dict(nome="Pull academia avançado", tipo="Pull",
         pool=pool_exercicios(["dorsais", "meio-das-costas", "trapezio", "biceps"], ACADEMIA, "avancado"),
         regra="6 exercícios: 3 de costas (dorsais ou meio-das-costas), 1 de trapezio, 2 de biceps.",
         dist={"dorsais+meio-das-costas": (3, 3), "trapezio": (1, 1), "biceps": (2, 2)}, total=(6, 6)),
]

SCHEMA_TREINO = {
    "type": "object",
    "properties": {"exercicios": {"type": "array", "items": {
        "type": "object",
        "properties": {"id": {"type": "integer"}, "series": {"type": "integer"},
                       "repeticoes": {"type": "string"}, "descansoSegundos": {"type": "integer"}},
        "required": ["id", "series", "repeticoes", "descansoSegundos"]}}},
    "required": ["exercicios"],
}

def prompt_treino(t):
    lista = "\n".join(f'{e["id"]}|{e["nome"]}|{e["grupo"]}|{e["tipo"]}' for e in t["pool"])
    return (f"Monte o treino de {t['tipo']} de hoje.\nREGRA: {t['regra']}\n"
            "Coloque os exercícios compostos antes dos isolados. Não repita exercícios.\n"
            "Use apenas IDs da lista. Séries entre 2 e 5. Repetições no formato '8-12'.\n\n"
            f"EXERCÍCIOS (id|nome|grupo|tipo):\n{lista}")

def avaliar_treino(t, saida):
    pts, notas = 0, []
    ex = saida.get("exercicios", [])
    by_id = {e["id"]: e for e in t["pool"]}
    ids = [e.get("id") for e in ex]
    validos = [i for i in ids if i in by_id]
    if ids and len(validos) == len(ids): pts += 2
    else: notas.append(f"{len(ids) - len(validos)} id(s) inválido(s)")
    if len(set(ids)) == len(ids): pts += 1
    else: notas.append("repetido")
    lo, hi = t["total"]
    if lo <= len(ex) <= hi: pts += 1
    else: notas.append(f"{len(ex)} exercícios")
    ok_dist = True
    for chave, (a, b) in t["dist"].items():
        n = sum(1 for i in validos if by_id[i]["grupo"] in chave.split("+"))
        if not a <= n <= b: ok_dist = False; notas.append(f"{chave}={n}")
    pts += 3 if ok_dist else 0
    tipos = [by_id[i]["tipo"] for i in validos]
    if "isolado" not in tipos or "composto" not in tipos[tipos.index("isolado"):]: pts += 1
    else: notas.append("isolado antes de composto")
    if all(2 <= e.get("series", 0) <= 5 and "-" in str(e.get("repeticoes", "")) for e in ex) and ex: pts += 1
    else: notas.append("séries/reps fora do padrão")
    return pts, 9, notas

# ─────────────────────────── ALIMENTOS (TACO, por 100 g) ───────────────────────────
ALIMENTOS = [  # nome, cat, kcal, p, c, g
    ("Arroz branco cozido", "graos", 128, 2.5, 28.1, 0.2), ("Feijão carioca cozido", "leguminosa", 76, 4.8, 13.6, 0.5),
    ("Peito de frango grelhado", "carne", 159, 32.0, 0, 2.5), ("Patinho bovino grelhado", "carne", 219, 35.9, 0, 7.3),
    ("Filé de tilápia grelhado", "peixe", 128, 26.2, 0, 2.7), ("Ovo de galinha cozido", "ovo", 146, 13.3, 0.6, 9.5),
    ("Pão francês", "graos", 300, 8.0, 58.6, 3.1), ("Aveia em flocos", "graos", 394, 13.9, 66.6, 8.5),
    ("Batata-doce cozida", "tuberculo", 77, 0.6, 18.4, 0.1), ("Macarrão cozido", "graos", 157, 5.8, 30.9, 0.9),
    ("Cuscuz de milho cozido", "graos", 113, 2.2, 25.3, 0.7), ("Tapioca (goma hidratada)", "graos", 240, 0, 60, 0),
    ("Banana prata", "fruta", 98, 1.3, 26.0, 0.1), ("Maçã", "fruta", 56, 0.3, 15.2, 0),
    ("Mamão papaia", "fruta", 40, 0.5, 10.4, 0.1), ("Abacate", "fruta", 96, 1.2, 6.0, 8.4),
    ("Leite integral", "laticinio", 61, 2.9, 4.3, 3.2), ("Iogurte natural", "laticinio", 51, 4.1, 1.9, 3.0),
    ("Queijo minas frescal", "laticinio", 264, 17.4, 3.2, 20.2), ("Whey protein", "suplemento", 400, 80, 8, 6),
    ("Brócolis cozido", "vegetal", 25, 2.1, 4.4, 0.5), ("Alface", "vegetal", 11, 1.3, 1.7, 0.2),
    ("Tomate", "vegetal", 15, 1.1, 3.1, 0.2), ("Azeite de oliva", "gordura", 884, 0, 0, 100),
    ("Pasta de amendoim", "gordura", 588, 25.0, 20.0, 50.0), ("Castanha-do-pará", "gordura", 643, 14.5, 15.1, 63.5),
    ("Tofu", "leguminosa", 82, 8.5, 2.0, 4.8), ("Lentilha cozida", "leguminosa", 93, 6.3, 16.3, 0.5),
    ("Grão-de-bico cozido", "leguminosa", 164, 8.9, 27.4, 2.6),
]

def pool_alimentos(excluir=()):
    return [{"id": i + 1, "nome": n, "cat": c, "kcal": k, "p": p, "c": cc, "g": g}
            for i, (n, c, k, p, cc, g) in enumerate([a for a in ALIMENTOS if a[1] not in excluir])]

TAREFAS_DIETA = [
    dict(nome="Onívoro 2400 kcal 4 ref.", refeicoes=4, meta=dict(kcal=2400, p=160, c=280, g=70), pool=pool_alimentos()),
    dict(nome="Vegetariano 2000 kcal 5 ref.", refeicoes=5, meta=dict(kcal=2000, p=120, c=240, g=60),
         pool=pool_alimentos(excluir=("carne", "peixe"))),
]

SCHEMA_DIETA = {
    "type": "object",
    "properties": {"refeicoes": {"type": "array", "items": {
        "type": "object",
        "properties": {"nome": {"type": "string"}, "horario": {"type": "string"},
                       "alimentos": {"type": "array", "items": {
                           "type": "object",
                           "properties": {"id": {"type": "integer"}, "gramas": {"type": "integer"}},
                           "required": ["id", "gramas"]}}},
        "required": ["nome", "horario", "alimentos"]}}},
    "required": ["refeicoes"],
}

def prompt_dieta(t):
    m = t["meta"]
    lista = "\n".join(f'{a["id"]}|{a["nome"]}|{a["kcal"]}|{a["p"]}|{a["c"]}|{a["g"]}' for a in t["pool"])
    return (f"Monte a dieta de um dia com exatamente {t['refeicoes']} refeições.\n"
            f"META DIÁRIA: {m['kcal']} kcal, proteínas {m['p']} g, carboidratos {m['c']} g, gorduras {m['g']} g.\n"
            "Os valores da lista são por 100 g. Escolha as gramas de cada alimento para a soma do dia bater a meta.\n"
            "Inclua uma fonte de proteína em cada refeição. Use apenas IDs da lista. Porções realistas.\n\n"
            f"ALIMENTOS (id|nome|kcal|prot|carb|gord por 100 g):\n{lista}")

def avaliar_dieta(t, saida):
    pts, notas = 0, []
    by_id = {a["id"]: a for a in t["pool"]}
    refs = saida.get("refeicoes", [])
    itens = [a for r in refs for a in r.get("alimentos", [])]
    validos = [a for a in itens if a.get("id") in by_id]
    if itens and len(validos) == len(itens): pts += 2
    else: notas.append(f"{len(itens) - len(validos)} id(s) inválido(s)")
    if len(refs) == t["refeicoes"]: pts += 1
    else: notas.append(f"{len(refs)} refeições")
    if validos and all(5 <= a.get("gramas", 0) <= 500 for a in validos): pts += 1
    else: notas.append("porção irreal")
    tot = {k: sum(by_id[a["id"]][k] * a["gramas"] / 100 for a in validos) for k in ("kcal", "p", "c", "g")}
    erros = {k: abs(tot[k] - t["meta"][k]) / t["meta"][k] for k in tot}
    for k, peso in (("kcal", 2), ("p", 1), ("c", 1), ("g", 1)):
        if erros[k] <= 0.10: pts += peso
        elif erros[k] <= 0.20: pts += peso / 2
    notas.append("erro " + " ".join(f"{k}:{erros[k]*100:+.0f}%".replace("+", "") for k in erros))
    return pts, 9, notas

# ─────────────────────────── EXECUÇÃO ───────────────────────────
SYSTEM = ("Você é um personal trainer e nutricionista esportivo. Responda apenas em JSON válido "
          "seguindo o schema. Idioma: português do Brasil.")

def chamar(modelo, prompt, schema, think):
    body = {"model": modelo, "stream": False, "format": schema, "keep_alive": "5m",
            "messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": prompt}],
            "options": {"temperature": 0.2, "num_ctx": 8192}}
    if think is not None: body["think"] = think
    t0 = time.time()
    r = requests.post(OLLAMA, json=body, timeout=900)
    dt = time.time() - t0
    r.raise_for_status()
    j = r.json()
    tps = j.get("eval_count", 0) / max(j.get("eval_duration", 1) / 1e9, 1e-9)
    return j["message"]["content"], dt, tps

def rodar(modelo, think, repeticoes):
    rotulo = modelo + (" (think)" if think else "")
    linhas = []
    tarefas = [("treino", t, prompt_treino, SCHEMA_TREINO, avaliar_treino) for t in TAREFAS_TREINO] + \
              [("dieta", t, prompt_dieta, SCHEMA_DIETA, avaliar_dieta) for t in TAREFAS_DIETA]
    for kind, t, fp, schema, aval in tarefas:
        for rep in range(repeticoes):
            try:
                txt, dt, tps = chamar(modelo, fp(t), schema, think)
                try: saida = json.loads(txt); pts, mx, notas = aval(t, saida)
                except json.JSONDecodeError: pts, mx, notas = 0, 9, ["JSON inválido"]
            except Exception as e:
                pts, mx, notas, dt, tps = 0, 9, [f"ERRO {e}"[:120]], 0, 0
            linhas.append(dict(modelo=rotulo, tarefa=t["nome"], rep=rep, pts=pts, max=mx,
                               seg=round(dt, 1), tps=round(tps, 1), notas="; ".join(notas)))
            print(json.dumps(linhas[-1], ensure_ascii=False), flush=True)
    requests.post(OLLAMA, json={"model": modelo, "keep_alive": 0, "messages": []})  # descarrega da RAM
    return linhas

if __name__ == "__main__":
    configs = [a.split("=") for a in sys.argv[1:]]  # ex.: qwen3.5:4b=false
    todas = []
    for modelo, think in configs:
        think = {"true": True, "false": False, "none": None}[think]
        todas += rodar(modelo, think, repeticoes=2 if think is not True else 1)
    json.dump(todas, open(sys.argv[0].replace("bench.py", "resultados.json"), "w"), ensure_ascii=False, indent=1)
