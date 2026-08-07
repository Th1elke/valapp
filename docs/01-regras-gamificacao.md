# Regras de Gamificação — Sistema de Hábitos

## 1. Hábitos e Dificuldade

Todo hábito tem uma dificuldade fixa, escolhida na criação, que define o XP base e a punição base:

| Dificuldade | XP por check-in | Perda de HP se não cumprido |
|---|---|---|
| Fácil | 10 XP | -2 HP |
| Médio | 20 XP | -5 HP |
| Difícil | 35 XP | -10 HP |

Cada hábito também tem uma **categoria**: `Físico`, `Mente`, `Disciplina`, `Social`, `Criatividade`. A categoria não muda o XP base, mas interage com o bônus de classe (seção 4).

## 2. Ganho de XP por Check-in

XP do check-in = `XP base da dificuldade` × `multiplicador de streak` × `multiplicador de classe` (se aplicável)

### 2.1 Bônus de sequência (streak)
Streak é contado por hábito individual (dias consecutivos com check-in feito).

| Streak atual | Multiplicador |
|---|---|
| 0–6 dias | ×1.0 |
| 7–13 dias | ×1.2 |
| 14–20 dias | ×1.4 |
| 21–34 dias | ×1.7 |
| 35+ dias | ×2.0 (teto) |

### 2.2 Bônus de "dia perfeito"
Se **todos** os hábitos ativos do dia (não pausados) forem cumpridos até o fim do dia: +15 XP flat, uma vez por dia, creditado no fechamento do dia (00:00 no fuso do usuário).

## 3. Curva de Níveis

XP necessário para alcançar o nível N (a partir do nível 1):

```
XP_para_nivel(1) = 0  (todo jogador começa aqui, por convenção)
XP_para_nivel(N) = round(100 × N^1.5)   para N ≥ 2
```

| Nível | XP necessário (acumulado) |
|---|---|
| 1 | 0 |
| 2 | 283 |
| 3 | 520 |
| 4 | 800 |
| 5 | 1118 |
| 10 | 3162 |
| 20 | 8944 |

A curva é a mesma para todo usuário — não muda por classe. Classes afetam apenas *velocidade* de ganho de XP (via multiplicadores), não a curva em si.

## 4. Evolução de Classes

- **Níveis 1–4:** todo usuário é `Novato`, sem classe, sem bônus.
- **Ao alcançar o nível 5:** o usuário escolhe uma classe, uma única vez. A escolha é **definitiva** (ver seção 4.3 para exceção paga/custo).

### 4.1 Classes disponíveis (nível 5)

| Classe | Categoria bonificada | Efeito passivo |
|---|---|---|
| Guerreiro | `Físico` | +15% XP em hábitos dessa categoria |
| Mago | `Mente` | +15% XP em hábitos dessa categoria |
| Paladino | `Disciplina` | Perda de HP reduzida em 50% em qualquer hábito não cumprido (não só Disciplina) |

O multiplicador de classe se aplica **depois** do multiplicador de streak (multiplicam entre si).

### 4.2 Sub-evoluções (prestígio)
A cada classe, em marcos de nível, o avatar evolui visualmente e ganha um pequeno reforço do mesmo bônus (cosmético + incremento leve, não uma nova mecânica):

| Nível | Guerreiro | Mago | Paladino |
|---|---|---|---|
| 5 | Guerreiro | Mago | Paladino |
| 15 | Cavaleiro (+20% bônus categoria) | Arcanista (+20% bônus categoria) | Templário (redução de HP 60%) |
| 30 | Campeão (+25% bônus categoria) | Arquimago (+25% bônus categoria) | Cruzado (redução de HP 70%) |

### 4.3 Trocar de classe
Permitido uma vez a cada 90 dias, com custo de 30% do XP do nível atual (aplicado como penalidade única no momento da troca, não retroativo aos check-ins passados).

## 5. Sistema de Vida (HP) e Punições

- Todo usuário começa e mantém um valor de **HP** entre 0 e 100.
- HP inicial: 100.
- **Perda de HP:** ao fechar o dia (00:00 local), para cada hábito ativo (não pausado) que não recebeu check-in, o usuário perde o HP correspondente à dificuldade (seção 1), reduzido pelo bônus de Paladino se aplicável.
- **Streak quebrada:** hábito não cumprido zera o contador de streak *daquele hábito* (não afeta streaks de outros hábitos nem o HP além do já descrito).
- **Regeneração de HP:** dia perfeito (todos os hábitos cumpridos) regenera +5 HP, até o teto de 100.

### 5.1 Recaída (HP = 0)
Se o HP chega a 0:
1. O usuário perde **1 nível** (XP é reduzido para o piso do nível anterior, conforme a tabela da seção 3).
2. HP é restaurado para **50**.
3. Se o usuário já estava no nível 1, não há perda de nível — apenas o reset de HP para 50.
4. Se a perda de nível cruzar o limiar do nível 5 (ex: estava nível 5 com classe escolhida e cai para nível 4), a classe é **mantida** — a classe não é perdida por recaída, apenas por não ter sido escolhida ainda.

### 5.2 Escudo semanal (proteção contra punição)
Todo usuário recebe **1 escudo por semana** (renovado toda segunda-feira, não acumulável entre semanas). O escudo pode ser usado manualmente antes do fechamento do dia para:
- Cancelar a perda de HP de **um dia inteiro** (todos os hábitos daquele dia ficam isentos de punição), OU
- Preservar o streak de **um hábito específico** sem cumprir o check-in naquele dia (o streak continua contando como se o dia tivesse sido cumprido, mas sem gerar XP daquele dia).

Isso cobre imprevistos (doença, viagem) sem tornar o sistema punitivo demais.

## 6. Pausar hábitos (férias)
Um hábito pode ser marcado como `pausado` por um período definido pelo usuário (data início/fim). Enquanto pausado:
- Não gera XP.
- Não conta para punição de HP.
- Não conta para o bônus de "dia perfeito".
- O streak é congelado (não zera, não avança).

## 7. Resumo de fórmulas

```
xp_checkin = xp_base(dificuldade) × mult_streak × mult_classe

xp_para_nivel(N) = round(100 × N^1.5)

hp_perda(dificuldade) = base(dificuldade) × (0.5 se Paladino nv.5-14,
                                               0.4 se Templário nv.15-29,
                                               0.3 se Cruzado nv.30+,
                                               1.0 caso contrário)

hp_regen_dia_perfeito = +5 (teto 100)
xp_dia_perfeito = +15 flat
gold_checkin = gold_base(dificuldade)   (facil=5, medio=10, dificil=20 — sem mult. de streak/classe)
gold_dia_perfeito = +10 flat
```

## 8. Economia: Ouro e a Taverna (Loja)

Além de XP, todo check-in também rende **Ouro** — um recurso separado, deliberadamente sem multiplicador de streak ou classe (pra não espiralar junto com o XP).

| Dificuldade | Ouro por check-in |
|---|---|
| Fácil | 5 |
| Médio | 10 |
| Difícil | 20 |

Dia perfeito também rende **+10 ouro** flat, junto com o bônus de XP da seção 2.2.

A **Taverna** (loja) vende:

| Item | Custo | Efeito |
|---|---|---|
| Poção de Cura | 50 ouro | Restaura 20 HP na hora (teto 100) |
| Escudo Extra | 80 ouro | +1 escudo disponível imediatamente, até um máximo de **3 escudos acumulados** |

O escudo semanal grátis (seção 5.2) continua existindo à parte — comprar escudos só adiciona reserva extra até o teto. Ouro nunca é perdido por recaída (seção 11) — é um recurso separado do XP/nível.

## 9. Atributos (Stats)

Cada categoria de hábito mapeia 1:1 pra um atributo de RPG. O valor do atributo é a **soma de todo XP já ganho em check-ins daquela categoria** — um histórico de "quanto você já investiu" nessa área da vida, não um recurso gastável (não reseta com recaída).

| Categoria | Atributo |
|---|---|
| Físico | Força (STR) |
| Mente | Inteligência (INT) |
| Disciplina | Sabedoria (WIS) |
| Social | Carisma (CHA) |
| Criatividade | Destreza (DEX) |

Exibido como gráfico de radar (5 eixos) no Perfil, mostrando o "estilo de jogo" do usuário na vida real.

## 10. Missões (Side Quests)

Diferente de hábitos (recorrentes, diários), missões são tarefas de **conclusão única**. Reaproveitam a mesma escala de dificuldade dos hábitos, mas valem **3× mais XP e ouro** — o bônus compensa não serem repetíveis.

| Dificuldade | XP | Ouro |
|---|---|---|
| Fácil | 30 | 15 |
| Médio | 60 | 30 |
| Difícil | 105 | 60 |

Ao ser concluída, a missão soma XP+ouro de uma vez (sem streak, sem multiplicador de classe) e some da lista ativa (fica marcada como `concluída` no histórico). Missões **não entram** na punição de HP nem no cálculo de "dia perfeito" — só hábitos recorrentes contam pra isso.

## 11. Game Over (Recaída em detalhe)

Reforçando a seção 5.1 com todas as consequências explícitas de HP chegar a 0:

1. **Nível**: perde exatamente 1 nível. XP cai para o piso exato daquele nível (tabela da seção 3), não um "-X XP" arbitrário.
2. **HP**: restaurado para 50 (não 100 — a recaída dói, mas não zera o jogador pra sempre).
3. **Streaks**: cada streak individual de hábito só zera se aquele hábito específico foi um dos que causou a perda de HP (não cumprido no dia). Streaks de hábitos em dia não são afetados pela recaída em si.
4. **Recorde de streak** (`longestStreak`): nunca é apagado, nem pela recaída.
5. **Classe**: nunca é perdida ou trocada por recaída, mesmo que o nível caia abaixo de 5.
6. **Ouro**: intocado — recaída é punição de progresso (XP/nível), não financeira.

O frontend precisa deixar isso **visível na hora** — um alerta claro quando a recaída acontece, não só um número mudando silenciosamente em segundo plano.

## 12. O Grimório (Batalhas de Conhecimento)

O usuário cola conteúdo de estudo (anotações, código, resumos) e a IA (Gemini) gera, a partir dele:
1. Um **resumo** curto pra revisão passiva (aba "Fogueira").
2. Um **quiz de 3 perguntas** de múltipla escolha (4 alternativas cada) sobre o conteúdo (aba "Batalha").

### 12.1 A Batalha
As 3 perguntas são respondidas uma de cada vez. Cada resposta errada causa dano imediato:

```
dano_por_erro = 3 HP (aplicado na hora, por pergunta errada)
```

Isso é deliberadamente menor que a punição de hábito perdido (seção 5) — errar uma pergunta de quiz é um tropeço momentâneo, não abandonar uma rotina.

### 12.2 Recompensa final
Ao responder a 3ª pergunta, a taxa de acerto decide o prêmio — proporcional, não tudo-ou-nada:

```
xp_grimorio = round(150 × (acertos / 3))
```

| Acertos | XP |
|---|---|
| 3/3 | 150 (o "chefe derrotado") |
| 2/3 | 100 |
| 1/3 | 50 |
| 0/3 | 0 |

150 XP no acerto total é ~4× um check-in difícil comum — de propósito, pra recompensar estudo ativo muito mais que um check-in passivo, como pedido.

### 12.3 Atributo afetado
Todo XP do Grimório conta **inteiramente para Inteligência (INT)**, não importa o conteúdo estudado — é sempre conhecimento. Isso soma no mesmo cálculo da seção 9 (via `xp_events` tipo `grimorio`, sem precisar de um hábito "Mente" existente).

### 12.4 O que o Grimório NÃO afeta
Não dá ouro, não conta pra streak de hábito nenhum, não conta pra "dia perfeito" (seção 2.2) e não pode, sozinho, causar recaída (o dano por erro é pequeno demais pra isso sozinho — só contribui se o HP já estiver baixo por hábitos perdidos).
