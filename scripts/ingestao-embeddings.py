import requests
from supabase import create_client
from dotenv import load_dotenv
from tqdm import tqdm
import os

load_dotenv()


senha = os.getenv("SUPABASE_KEY")
url = os.getenv("SUPABASE_URL")
client = create_client(url, senha)

tamanho_lote = 1000
pagina = 0
todos_alimentos = []


##DADOS DOS EXERCICIOS##
resposta = client.table("base_exercicios").select("id,nome,grupo_primario,equipamento,nivel").is_("embedding", "null").execute()
dados = resposta.data

##DADOS DOS ALIMENTOS##
while True:
    inicio = pagina * tamanho_lote
    fim = inicio + tamanho_lote - 1
    
    resposta_alimentos = client.table("base_alimentos").select("id,nome,marca,calorias_100g,proteinas_100g,carboidratos_100g,gorduras_100g").is_("embedding", "null").range(inicio, fim).execute()
    dados_alimentos = resposta_alimentos.data

    if len(dados_alimentos) == 0:
        break
    else:
        todos_alimentos.extend(dados_alimentos)
        pagina += 1

##DADOS DE CONHECIMENTO##
resposta = client.table("base_conhecimento").select("id,tipo,titulo,fonte,conteudo").is_("embedding", "null").execute()
dados_conhecimento = resposta.data

##GERACAO DE EMBEDDING DOS EXERCICIOS##
if len(dados) > 0:
    documentos = []
    for exercicio in tqdm(dados, desc="Processando Exercícios"):
        texto = f"Exercício: {exercicio['nome']}. Grupo Muscular: {exercicio['grupo_primario']}. Equipamento: {exercicio['equipamento']}. Nível: {exercicio['nivel']}."
        documentos.append({"id": exercicio["id"], "text": texto})

        resposta = requests.post("http://localhost:11434/api/embeddings", json={
            "model": "mxbai-embed-large",
            "prompt": texto
        })
        vetor = resposta.json()["embedding"]  # Lista de 1024 números
        client.table("base_exercicios").update({"embedding": vetor}).eq("id", exercicio["id"]).execute()
    print("ingestao base exercicios concluida")
else:
    print("nenhum exercicio para ser processado")


##GERACAO DE EMBEDDING DOS ALIMENTOS##
if len(todos_alimentos) > 0:
    documentos = []
    for alimento in tqdm(todos_alimentos, desc="Processando Alimentos"):
        texto = f"Alimento: {alimento['nome']}. Marca: {alimento['marca']}. Calorias: {alimento['calorias_100g']}kcal/100g. Proteínas: {alimento['proteinas_100g']}g. Carboidratos: {alimento['carboidratos_100g']}g. Gorduras: {alimento['gorduras_100g']}g."
        documentos.append({"id": alimento["id"], "text": texto})

        resposta = requests.post("http://localhost:11434/api/embeddings", json={
            "model": "mxbai-embed-large",
            "prompt": texto
        })
        vetor = resposta.json()["embedding"]  # Lista de 1024 números
        client.table("base_alimentos").update({"embedding": vetor}).eq("id", alimento["id"]).execute()
    print("ingestao base alimentos concluida")
else:
    print("nenhum alimento para ser processado")


##GERACAO DE EMBEDDING DE CONHECIMENTO##
if len(dados_conhecimento) > 0:
    documentos = []
    for conhecimento in tqdm(dados_conhecimento, desc="Processando Conhecimento"):
        texto = f"Tipo: {conhecimento['tipo']}. Título: {conhecimento['titulo']}. Fonte: {conhecimento['fonte']}. Conteúdo: {conhecimento['conteudo']}."
        documentos.append({"id": conhecimento["id"], "text": texto})

        resposta = requests.post("http://localhost:11434/api/embeddings", json={
            "model": "mxbai-embed-large",
            "prompt": texto
        })
        vetor = resposta.json()["embedding"]  # Lista de 1024 números
        client.table("base_conhecimento").update({"embedding": vetor}).eq("id", conhecimento["id"]).execute()
    print("ingestao base conhecimento concluida")
else:
    print("nenhum conhecimento para ser processado")