import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { CartaoOpcao } from './CartaoOpcao';
import { ChipOpcao } from './ChipOpcao';
import { Stepper } from './Stepper';
import { Roda } from './Roda';

jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn() }));

it('CartaoOpcao é um radio, marca o estado e chama a ação', async () => {
  const aoPressionar = jest.fn();
  await render(
    <CartaoOpcao
      titulo="Na academia"
      descricao="Máquinas"
      selecionado
      aoPressionar={aoPressionar}
    />,
  );
  const cartao = screen.getByRole('radio', { name: 'Na academia' });
  expect(cartao).toBeChecked();
  await fireEvent.press(cartao);
  expect(aoPressionar).toHaveBeenCalledTimes(1);
});

it('ChipOpcao usa checkbox na multiescolha e radio na escolha única', async () => {
  await render(
    <>
      <ChipOpcao rotulo="Joelho" multipla selecionado={false} aoPressionar={jest.fn()} />
      <ChipOpcao rotulo="4" legenda="selecionado" selecionado aoPressionar={jest.fn()} />
    </>,
  );
  expect(screen.getByRole('checkbox', { name: 'Joelho' })).not.toBeChecked();
  expect(screen.getByRole('radio', { name: '4 selecionado' })).toBeChecked();
});

describe('Stepper', () => {
  it('muda de 1 em 1 e trava nos limites', async () => {
    const aoMudar = jest.fn();
    const { rerender } = await render(
      <Stepper rotulo="Refeições" valor={5} min={3} max={6} aoMudar={aoMudar} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Aumentar' }));
    expect(aoMudar).toHaveBeenLastCalledWith(6);
    await fireEvent.press(screen.getByRole('button', { name: 'Diminuir' }));
    expect(aoMudar).toHaveBeenLastCalledWith(4);

    await rerender(<Stepper rotulo="Refeições" valor={6} min={3} max={6} aoMudar={aoMudar} />);
    expect(screen.getByRole('button', { name: 'Aumentar' })).toBeDisabled();
    await rerender(<Stepper rotulo="Refeições" valor={3} min={3} max={6} aoMudar={aoMudar} />);
    expect(screen.getByRole('button', { name: 'Diminuir' })).toBeDisabled();
  });
});

describe('Roda', () => {
  it('o item que para na faixa do meio vira o valor, sem passar dos limites', async () => {
    const aoMudar = jest.fn();
    await render(<Roda rotulo="Idade" valor={30} min={14} max={100} aoMudar={aoMudar} />);
    const rolagem = screen.getByTestId('roda');
    // 44 pt por item: 10 itens abaixo do 30 = 40.
    await fireEvent(rolagem, 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { y: 44 * 26 } },
    });
    expect(aoMudar).toHaveBeenLastCalledWith(40);
    await fireEvent(rolagem, 'momentumScrollEnd', { nativeEvent: { contentOffset: { y: -500 } } });
    expect(aoMudar).toHaveBeenLastCalledWith(14);
    await fireEvent(rolagem, 'momentumScrollEnd', { nativeEvent: { contentOffset: { y: 99999 } } });
    expect(aoMudar).toHaveBeenLastCalledWith(100);
  });
});
