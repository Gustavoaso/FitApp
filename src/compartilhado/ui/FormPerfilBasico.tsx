// Formulário de apelido + @usuario (RN24). Aparece no Perfil e antes do primeiro post.
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { BotaoPrimario } from './BotaoPrimario';
import { Espacamento, Tipografia } from '../tema';
import { useTema } from '../useTema';
import { validarApelido, validarUsuario } from '../perfil-regras';
import { carregarApelidoAtual, salvarApelidoEUsuario } from '../servicos/perfil-basico-servico';

export function FormPerfilBasico({ aoSalvar }: { aoSalvar: () => void }) {
  const { cores } = useTema();
  const [apelido, setApelido] = useState('');
  const [usuario, setUsuario] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  // Quem já escolheu apelido nos Grupos só completa o @usuario.
  useEffect(() => {
    carregarApelidoAtual().then(
      (a) => a && setApelido(a),
      () => {},
    );
  }, []);

  const salvar = async () => {
    const a = validarApelido(apelido);
    const u = validarUsuario(usuario);
    if ('erro' in a) return setErro(a.erro);
    if ('erro' in u) return setErro(u.erro);
    setOcupado(true);
    const falha = await salvarApelidoEUsuario(a.apelido, u.usuario);
    setOcupado(false);
    if (falha) return setErro(falha);
    aoSalvar();
  };

  const campo = [e.campo, { color: cores.texto, borderBottomColor: cores.separador }];
  return (
    <View>
      <TextInput
        accessibilityLabel="Apelido"
        style={campo}
        value={apelido}
        onChangeText={setApelido}
        placeholder="Apelido"
        placeholderTextColor={cores.textoSecundario}
        maxLength={20}
      />
      <TextInput
        accessibilityLabel="@usuario"
        style={campo}
        value={usuario}
        onChangeText={setUsuario}
        placeholder="@usuario"
        placeholderTextColor={cores.textoSecundario}
        maxLength={16}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {erro ? <Text style={[e.erro, { color: cores.erro }]}>{erro}</Text> : null}
      <BotaoPrimario texto="Salvar" aoPresionar={salvar} desabilitado={ocupado} />
    </View>
  );
}

const e = StyleSheet.create({
  campo: {
    minHeight: 44,
    fontSize: Tipografia.corpo,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: Espacamento.sm,
  },
  erro: { fontSize: Tipografia.rodape, marginVertical: Espacamento.xs },
});
