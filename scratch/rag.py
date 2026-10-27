import json
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

documentos = [
    {
        "id": 1,
        "text": "Exercício: Abdominal 3/4. Músculos: abdominais. Equipamento: peso-do-corpo. Instruções: Deite-se no chão e levante o tronco em direção aos joelhos.",
    },
    {
        "id": 2,
        "text": "Exercício: Agachamento Búlgaro. Músculos: quadríceps, glúteos e posteriores. Equipamento: step ou banco. Instruções: Coloque um pé atrás em um banco e agache com a perna da frente."
    }
    ]

# Extraímos apenas os textos dos documentos
textos_para_vetorizar = [doc['text'] for doc in documentos]

# Modelo transforma cada texto em um vetor de 384 dimensoes
doc_embeddings = model.encode(textos_para_vetorizar)

print(f"\nFormato da matriz de embeddings: {doc_embeddings.shape}")
print(f"\nExemplo: os primeiros 5 números do vetor do 1º exercício: {doc_embeddings[0][:5]}\n")

pergunta = "Me fale um exercicio para fortalecer a barriga"
print(f"\nPergunta do Usuario: {pergunta}")

pergunta_embedding = model.encode([pergunta])

similaridades = np.dot(pergunta_embedding, doc_embeddings.T).flatten()

print(f"\nSimilaridades: {similaridades}\n")

idx = 1
for score in similaridades:
  print(f"\n{documentos[idx]['text']}: Score de Similaridade = {score:.3f}, {score*100:.2f}%")
  idx += 1

# Identifica o melhor documento (maior score)
melhor_idx = np.argmax(similaridades)
melhor_doc = documentos[melhor_idx]
print(f"\n🏆 MELHOR DOCUMENTO RECUPERADO (BEST DOC):")
print(f"\nNome: {melhor_doc['text']} (ID: {melhor_doc['id']})")
print(f"\nTexto do Documento Injetado: {melhor_doc['text']}")

