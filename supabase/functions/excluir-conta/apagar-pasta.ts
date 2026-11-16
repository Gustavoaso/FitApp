// Esvazia a pasta de um usuário num bucket, página a página (list devolve no máximo `limite` por vez).
export interface BucketArquivos {
  list(
    pasta: string,
    opcoes: { limit: number },
  ): Promise<{ data: { name: string }[] | null; error: Error | null }>;
  remove(caminhos: string[]): Promise<{ error: Error | null }>;
}

export async function apagarPasta(bucket: BucketArquivos, pasta: string, limite = 1000) {
  while (true) {
    const { data, error } = await bucket.list(pasta, { limit: limite });
    if (error) throw error;
    if (!data?.length) return;
    const { error: erroRemocao } = await bucket.remove(data.map((a) => `${pasta}/${a.name}`));
    if (erroRemocao) throw erroRemocao;
  }
}
