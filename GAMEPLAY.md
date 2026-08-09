# Gameplay — mapa da lógica

Guia de "onde está o código de cada sistema". Pra regras de design originais (fórmulas, motivação), veja [docs/01-regras-gamificacao.md](docs/01-regras-gamificacao.md) — este arquivo aqui é o mapa atualizado do que existe no código *hoje*, incluindo tudo que foi adicionado depois daquele documento (poções em inventário, itens de batalha do Grimório, cosméticos, etc.).

Convenção geral do projeto: a maior parte das regras/fórmulas puras vive em `shared/` (roda no client e no server, sem tocar banco). As rotas em `server/api/` fazem a leitura/escrita no banco e chamam essas funções. As páginas em `app/pages/` e componentes em `app/components/` só exibem o que a API devolve.

## Índice rápido — sistema → arquivos

| Sistema | Regras/fórmulas (`shared/`) | Rotas (`server/api/`) | Schema (`db/schema.ts`) | UI principal |
|---|---|---|---|---|
| XP, níveis, streak, classes | `gamification.ts` | `habits/[id]/checkin.post.ts`, `daily-closure.post.ts` | `users`, `habits`, `xpEvents` | `app/pages/index.vue`, `perfil.vue` |
| HP, recaída | `gamification.ts` | `daily-closure.post.ts`, `grimoire/[id]/answer.post.ts` | `users`, `hpEvents` | `index.vue` (card Vida, modal recaída) |
| Ouro | `gamification.ts` | `habits/[id]/checkin.post.ts`, `daily-closure.post.ts` | `users`, `goldEvents` | header, `index.vue` |
| Hábitos / check-in | — | `habits/*` | `habits`, `checkIns` | `habitos.vue`, `HabitCard.vue` |
| Missões | `gamification.ts` (`missionXpReward`/`missionGoldReward`) | `missions/*` | `missions` | `missoes.vue` |
| Fechamento de dia | `gamification.ts` | `daily-closure.post.ts` | `dailyClosures` | botão "Fechar dia de ontem" em `index.vue` |
| Atributos (radar) | — | `user/stats.get.ts` | deriva de `checkIns` + `xpEvents` | `AttributeRadar.vue` |
| Grimório (IA + batalha) | `gamification.ts` (constantes `GRIMOIRE_*`) | `grimoire/*`, `server/utils/gemini.ts` | `grimoireSessions` | `grimorio.vue` |
| Loja / itens instantâneos | `economy.ts` | `shop/purchase.post.ts` | `users` (campos `shieldsRemaining`, `restDayDate`) | `loja.vue` |
| Inventário (poções + itens de batalha) | `economy.ts` | `shop/purchase.post.ts`, `user/use-potion.post.ts`, `grimoire/*` | `userInventory` | `ActiveItemsWidget.vue`, `loja.vue` |
| Cosméticos (títulos/bordas/temas) | `cosmetics.ts` | `shop/purchase.post.ts`, `cosmetics/equip.post.ts` | `userCosmetics`, `users` (campos `equipped*`) | `perfil.vue`, `ClassAvatar.vue`, `app/plugins/theme.client.ts` |
| Foto de perfil / capa | — | `user/avatar.post.ts`, `user/cover.post.ts`, `server/utils/userImageUpload.ts` | `users` (`avatarUrl`, `coverUrl`) | `perfil.vue` |
| Árvore de Habilidades | `skills.ts` (catálogo), `server/utils/skills.ts` (`getUnlockedSkillIds`/`consumeInventoryItem`) | `user/skills/unlock.post.ts` (+ efeitos espalhados nas rotas acima, ver seção própria) | `userSkills` | `SkillTree.vue` (em `perfil.vue`) |
| Autenticação | `server/utils/auth.ts` (`requireUserId`) | `auth/register.post.ts`, `auth/login.post.ts` (logout é built-in do `nuxt-auth-utils`) | `users` (`email`, `passwordHash`) | `login.vue`, `registro.vue`, `auth.global.ts` |

Autenticação real via `nuxt-auth-utils` — toda rota resolve o usuário logado com `requireUserId(event)` (`server/utils/auth.ts`), não um id fixo. Ver seção "Autenticação" no fim deste arquivo.

---

## XP e Níveis

- Fórmula de XP acumulado necessário pro nível N: `xpForLevel(level)` em `shared/gamification.ts` — `100 × nível^1.5`, exceto nível 1 que é fixado em 0.
- `levelForXp(xp)` faz o caminho inverso (usado sempre que XP muda, pra recalcular o nível).
- XP de um check-in: `computeCheckinXp()` = XP base da dificuldade (`DIFFICULTY_XP`: fácil 10 / médio 20 / difícil 35, ou 50 no lugar de 35 com a skill Fúria Cega) × multiplicador de streak × multiplicador de classe, com um ×1.5 final se a skill Voto de Disciplina estiver ativa e o HP estiver abaixo de 30%, e ×1.05 se for Bardo (Voz Encantadora) em hábito Social.
- Multiplicador de streak: `streakMultiplier()` — 1.0 até 1.2 (7+ dias), 1.4 (14+), 1.7 (21+), 2.0 (35+); a skill Adrenalina (Guerreiro) reduz esses limiares em 20%, Refrão Curto (Bardo) em 10%.
- Multiplicador de classe: `classXpMultiplier()` — Guerreiro (+15/20/25% em hábitos Físico) e Mago (+15/20/25% em Mente) dependendo do tier (nível 5/15/30), mais +5% fixo da passiva de raiz (Sangue Quente/Foco Arcano, automática a partir do nível 5). Paladino não tem bônus de XP (tem redução de dano). Arqueiro/Ladino/Bardo também não usam esse multiplicador — cada um tem sua própria mecânica de assinatura (ver seção Classes).
- **Tiro Certeiro** (Arqueiro): `tiroCertoBonus()` em `shared/gamification.ts` — a cada 5º check-in consecutivo na sequência de um hábito (4º com Fluxo Constante), soma um bônus **flat** de 50%/80% (com Ponto Fraco) + 5pp (passiva Olho de Falcão) do XP base da dificuldade — de propósito **não** multiplicado por streak/classe, pra não escalar indefinidamente com sequências longas. Registrado como uma linha extra em `xpEvents` (`type: 'tiro_certeiro'`), separada do XP normal do check-in. Disparo Perfeito (ultimate) também dispara esse bônus num Dia Perfeito, independente do contador de streak.
- **Golpe Duplo** (Ladino): `golpeDuploChance()` em `shared/gamification.ts` — cada check-in em hábito de Criatividade tem uma chance (15/20/25% por tier + 5pp da passiva Instinto + 5pp com Mão Leve + 8pp com Prática) de dobrar o XP daquele check-in; a rolagem (`Math.random()`) acontece em `checkin.post.ts`. Quando acerta, a linha em `xpEvents` usa `type: 'golpe_duplo'` em vez de `'checkin'`.
- **Hábito Dominado**: ao bater `HABIT_DOMINATED_STREAK` (100) dias de sequência num hábito, `habits.dominatedAt` é marcado e o check-in daquele dia credita um bônus único de `HABIT_DOMINATED_BONUS_XP` (105 XP, tipo `ajuste_manual`) em vez do XP normal. Dias seguintes com `dominatedAt` já setado dão **0 XP** de check-in (streak, ouro e dia perfeito continuam normais) — evita que um hábito antigo continue sendo a fonte de XP mais fácil pra sempre. Perder a sequência (`daily-closure.post.ts`) zera `dominatedAt` junto com o streak. Badge "Dominado" em `HabitCard.vue`/`habitos.vue`.
- Todo ganho/perda de XP gera uma linha em `xpEvents` (tabela) com um `type` do enum `xpEventTypes` (`checkin`, `dia_perfeito`, `penalidade_recaida`, `custo_troca_classe`, `ajuste_manual`, `missao`, `grimorio`, `tiro_certeiro`, `golpe_duplo`).

## HP e Recaída

- `HP_MAX = 100`, `HP_INITIAL = 100`, `RELAPSE_HP_RESTORE = 50` em `shared/gamification.ts`.
- Perda de HP por hábito não cumprido: `computeHpLoss()` — base por dificuldade (`DIFFICULTY_HP_LOSS`: 2/5/10, dobrado em Fácil com Fúria Cega) reduzido por `classHpReductionFactor()` (Paladino: -50%/-40%/-30% conforme tier, mais -5% fixo da passiva de raiz Aura Sagrada).
- **Recaída** (HP chega a 0) — balanceamento revisado: em vez de derrubar um nível inteiro (achatava o early game e destruía o late game), `computeRelapseXp()` agora remove uma **porcentagem do XP atual com teto**: `RELAPSE_XP_LOSS_PERCENT = 0.15` (15%), `RELAPSE_XP_LOSS_CAP = 500`. O nível é recalculado depois via `levelForXp` — pode ou não cair, dependendo de onde a perda cai. HP volta pra `RELAPSE_HP_RESTORE` (50) via `getRelapseHpRestore()`, que também aplica Tudo ou Nada (Guerreiro, restaura só 1 HP) ou Fênix (Paladino, restaura 80 HP). Ouro e classe ficam intocados. Implementado em dois lugares com a mesma lógica: `server/api/daily-closure.post.ts` (hábito não cumprido) e `server/api/grimoire/[id]/answer.post.ts` (erro na Batalha).
- Toda mudança de HP gera uma linha em `hpEvents` (`hpEventTypes`: `habito_nao_cumprido`, `regen_dia_perfeito`, `reset_recaida`, `escudo_usado`, `pocao_cura`, `grimorio_erro`, `penitencia`).

## Ouro

- Ganho flat por check-in (sem multiplicador de streak/classe, de propósito): `computeCheckinGold()` — `DIFFICULTY_GOLD` (5/10/20), +3 em hábitos Físico com Saqueador (Guerreiro), +3 em Disciplina com Provisões (Arqueiro), +3 em Social com Aplausos (Bardo), ×1.5 com Voto de Disciplina (HP < 30%).
- Bônus de dia perfeito: `PERFECT_DAY_GOLD_BONUS = 10`, ×3 com Tudo ou Nada.
- Missões: `missionGoldReward()` guarda o valor base na missão na criação; Tributo aplica +50% **na conclusão** (`missions/[id]/complete.post.ts`), não na criação — assim uma missão criada antes de comprar a skill ainda recebe o bônus se for concluída depois.
- Nunca é perdido em recaída.
- Toda mudança gera linha em `goldEvents` (`goldEventTypes`: `checkin`, `dia_perfeito`, `missao`, `compra`, `ajuste_manual`, `grimorio`).

## Sequência (Streak)

- Por **hábito individual**, não por usuário — colunas `habits.streakCount`/`habits.longestStreak`.
- Incrementada em `server/api/habits/[id]/checkin.post.ts`.
- Zerada em `server/api/daily-closure.post.ts` quando o hábito não é cumprido no dia — antes de zerar, o valor antigo é salvo em `habits.lastBrokenStreak`/`lastBrokenStreakDate` (usado pela Ampulheta do Tempo, ver seção Loja).
- **Segunda Voz** (Bardo): em vez de zerar, a sequência quebrada de um hábito Social vira `Math.floor(streakCount / 2)` — com a skill Refrão, vale pra qualquer categoria, não só Social.
- Se o usuário tiver um Ticket da Estalagem ativo (`users.restDayDate` bate com a data do fechamento), a zerada é pulada inteiramente naquele dia.

## Classes

- `getClassInfo()` em `shared/gamification.ts` — 6 classes (Guerreiro/Mago/Paladino/Arqueiro/Ladino/Bardo), cada uma com 3 tiers de nome (nível 5/15/30) e gradiente visual fixo (não muda com tema equipado, é identidade da classe). `playerClasses` (`db/schema.ts`) é o enum fonte da verdade — consumido de forma genérica em `user/class.post.ts` e `dev/inject.post.ts`, então uma classe nova só precisa entrar nesse array + `getClassInfo`/`ROOT_PASSIVES`/`SKILLS` pra já funcionar em toda a UI (`ClassAvatar.vue`, `SkillTree.vue`, `perfil.vue`).
- Escolha inicial: `POST /api/user/class` (nível ≥ 5, sem custo). A mesma rota também faz a **troca de classe** depois da escolha inicial (docs seção 4.3): 1x a cada 90 dias (`lastClassChangeAt`, cai pra `classChosenAt` se nunca trocou antes), custando 30% do XP atual (`CLASS_CHANGE_XP_COST_PERCENT` em `shared/gamification.ts`, registrado em `classChanges` + um `xpEvents` tipo `custo_troca_classe`). UI em `perfil.vue`.
- **Mecânica de assinatura por classe** (em vez de `classXpMultiplier`/`classHpReductionFactor`, Arqueiro/Ladino/Bardo têm sua própria fórmula dedicada — ver seções XP e Sequência acima):
  - **Arqueiro** — Tiro Certeiro: bônus flat de XP a cada 5º check-in em sequência.
  - **Ladino** — Golpe Duplo: chance de dobrar o XP de um check-in de Criatividade.
  - **Bardo** — Segunda Voz: sequência quebrada em hábito Social vira metade, não zero.

## Hábitos e Check-in

- CRUD em `server/api/habits/index.{get,post}.ts` e `server/api/habits/[id].{patch,delete}.ts`.
- Check-in / desfazer: `server/api/habits/[id]/checkin.{post,delete}.ts` — aplica XP/ouro (fórmulas acima), atualiza streak.
- Um check-in por hábito por dia (`checkIns` tem unique constraint em `habitId`+`checkinDate`).
- **Agendamento por dia da semana**: `habits.frequency` (`diaria` | `semanal` | `dias_customizados`) + `habits.customDays` (array de 0-6, domingo-sábado, igual `Date#getDay()`). Lógica central em `shared/habitSchedule.ts` — `isHabitScheduled(frequency, customDays, dateStr)`. Só `dias_customizados` filtra de verdade; `diaria` e `semanal` sempre retornam `true` (o modo flexível "N vezes por semana, dia livre" de `semanal` não foi implementado — por ora ela se comporta como diária). Onde isso é aplicado:
  - `checkin.post.ts` recusa (400) check-in num dia não agendado.
  - `daily-closure.post.ts` só considera um hábito "perdido" (perda de HP, quebra de streak) se ele estivesse agendado pro dia do fechamento — filtro em `eligibleHabits`.
  - Dashboard (`index.vue`) filtra "Hábitos de hoje" (e o cálculo de dia perfeito) pelo mesmo `isHabitScheduled`, usando `shared/date.ts` (`todayStr()`, versão isomórfica do helper que já existia em `server/utils/date.ts`).
- Pausa com datas (`pausedFrom`/`pausedUntil`) continua só no schema, sem lógica — ver seção final.

## Fechamento de Dia (Daily Closure)

- `POST /api/daily-closure` (`server/api/daily-closure.post.ts`) — hoje é disparado manualmente pelo botão "Fechar dia de ontem" no Dashboard, não roda sozinho.
- Idempotente por usuário+data via unique constraint em `dailyClosures`.
- Fluxo: acha hábitos ativos sem check-in na data → se tiver Ticket da Estalagem ativo pra essa data, encerra sem aplicar nada (+15 HP extra com Graça da Estalagem/Paladino, +15 HP com Última Canção/Bardo) → senão, zera (ou divide por 2, ver Segunda Voz acima) streak dos hábitos perdidos (salvando snapshot pra Ampulheta) → calcula perda de HP total ou, se dia perfeito, aplica bônus (+5 HP, +15 XP, +10 ouro, ×3 com Tudo ou Nada/Guerreiro ou ×2 com Show Deve Continuar/Bardo) → checa recaída.
- **Show Deve Continuar** (Bardo, ultimate): dobra o bônus de dia perfeito, no máximo 1×/semana — controlado por `users.lastShowMustGoOnDate` (só dispara de novo se passaram ≥ 7 dias desde o último disparo).

## Missões

- CRUD em `server/api/missions/*`; completar uma: `server/api/missions/[id]/complete.post.ts`.
- Recompensa = recompensa de um hábito da mesma dificuldade × `MISSION_REWARD_MULTIPLIER` (3), via `missionXpReward()`/`missionGoldReward()` em `shared/gamification.ts`.
- Tarefas de conclusão única (não recorrentes, sem streak).
- `missions.category` (mesmo enum de `habits.category`, **opcional** — só existe pra alimentar bônus de classe por categoria, não afeta a recompensa base) alimenta, na conclusão: Tributo (Guerreiro, qualquer categoria), Boa Fama (Bardo, +50% ouro só em Social) e Mão Rápida (Ladino, +50% ouro só em Criatividade); Última Flecha (Arqueiro) dá 1 Poção Pequena de brinde só em missão de Disciplina (mesmo padrão do Mercenário/Guerreiro, que vale pra qualquer categoria).

## Atributos (Radar)

- `GET /api/user/stats` (`server/api/user/stats.get.ts`) soma o XP de `checkIns` agrupado por categoria do hábito (`habits.category` → `fisico`/`mente`/`disciplina`/`social`/`criatividade`, mapeados pra STR/INT/WIS/CHA/DEX em `shared/types.ts`).
- XP do Grimório conta 100% pra Inteligência (Mente), somado à parte via `xpEvents` do tipo `grimorio`.
- Renderizado em `app/components/AttributeRadar.vue` — SVG feito à mão, cor sempre `hsl(var(--primary))` (por isso já acompanha o tema equipado automaticamente).

## Grimório (IA + Batalha)

Constantes em `shared/gamification.ts`: `GRIMOIRE_QUIZ_LENGTH = 3`, `GRIMOIRE_BOSS_XP = 150`, `GRIMOIRE_BOSS_GOLD = 50`, `GRIMOIRE_HP_LOSS_PERCENT = 0.1`, `GRIMOIRE_MIN_LENGTH = 100`, `GRIMOIRE_MAX_LENGTH = 12000` (`GRIMOIRE_MAX_LENGTH_BOOSTED = 30000` com Pena Mágica).

- **Geração do quiz**: `POST /api/grimoire` (`server/api/grimoire/index.post.ts`) chama `server/utils/gemini.ts` (Gemini API, `responseSchema` estruturado) → gera resumo + 3 perguntas. O `correctIndex`/`explanation` de cada pergunta **nunca vai pro client** antes de responder (`PublicQuizQuestionDTO` em `shared/types.ts` tira esses campos) — importante pra qualquer feature nova mexer nisso com cuidado (ex.: Olho da Visão precisou de uma rota própria no servidor por causa disso).
- **Responder pergunta**: `POST /api/grimoire/[id]/answer` (`server/api/grimoire/[id]/answer.post.ts`) — acerto não faz nada de HP; erro aplica `grimoireHpLoss()` = 10% do HP máximo (10 HP), **dobrado** (20 HP) se a sessão tiver `xpBoosted` (Elixir do Erudito) e **dobrado de novo** com Aposta Alta (Ladino) — mais XP em jogo, mais risco, de propósito (era um valor fixo de 3 HP antes do balanceamento, baixo demais pro tamanho da recompensa). Erro zerando o HP aplica a mesma recaída percentual da seção HP acima. A skill Clarividência (Mago) perdoa o primeiro erro de cada batalha sem perda de HP (`grimoireSessions.clarividenciaUsed` controla o "já usei nessa batalha") — a resposta errada ainda **conta** como tentativa, só não tira HP. Fintar o Destino (Ladino) é diferente: 25% de chance, **sem limite por batalha**, de o erro simplesmente não contar (retorno antecipado igual ao Escudo de Cristal, `GrimoireAnswerResultDTO.dodged: true`, a pergunta pode ser respondida de novo). Ao completar as 3 perguntas, calcula XP via `grimoireXpReward(correctCount) = round(150 × acertos / 3)`, dobrado se `xpBoosted`, dobrado de novo com Aposta Alta; com Leitura Dinâmica (Mago) **ou** Aposta Alta (Ladino) também credita `grimoireGoldReward(correctCount)` em ouro (dobrado com Aposta Alta).
- **Aposta Alta** (Ladino, ultimate): opt-in por batalha via `apostaAlta: true` no corpo de `POST /api/grimoire` (mesmo padrão do `useElixir`) — só tem efeito se o jogador realmente possuir a skill `ladino_aposta_alta` (`grimoireSessions.apostaAltaUsada` só fica `true` depois de checar `hasSkill`); dobra a perda de HP por erro e dobra XP/ouro na vitória, sem gastar item de inventário.
- **Mensagem de resultado**: só mostra "Chefe derrotado!" quando `correctCount === 3`; menos que isso mostra "O chefe resistiu" — a barra de vida do chefe (`monsterHpPercent` em `grimorio.vue`) é sempre `100 - (acertos/3)×100`, então ela já reflete o resultado real independente da mensagem.
- **Itens de batalha** (ver Inventário abaixo pra como são comprados/guardados):
  - *Olho da Visão Verdadeira*: `POST /api/grimoire/[id]/reveal-hint` sorteia 2 índices errados no servidor e devolve só esses (nunca o certo). Com Manipulação do Destino (Mago, ultimate) o efeito é de graça 1x por batalha, sem gastar inventário (`grimoireSessions.manipulacaoUsada`).
  - *Escudo de Cristal*: tratado dentro do próprio `answer.post.ts` — se errar e tiver escudo, absorve o golpe automaticamente (sem gastar HP, sem avançar a pergunta) em vez de processar como erro normal.
  - *Elixir do Erudito*: opt-in no corpo do `POST /api/grimoire` (`useElixir`), grava `xpBoosted` na sessão.
  - *Pena Mágica*: detectada automaticamente em `POST /api/grimoire` quando o texto passa de `GRIMOIRE_MAX_LENGTH` e o usuário tem uma no inventário.
  - Todo consumo de item de batalha passa por `consumeInventoryItem()` (`server/utils/skills.ts`), que rola a chance de 15% da skill Transmutação (Mago, ultimate) de não gastar a unidade — o efeito acontece de qualquer forma, só a dedução do inventário é que pode ser poupada.

## Loja / Itens instantâneos

Catálogo inteiro em `shared/economy.ts` (`SHOP_ITEMS`), cada item com um `effect.kind`. Tudo processado por uma rota só: `POST /api/shop/purchase` (`server/api/shop/purchase.post.ts`), com um `switch` por `effect.kind`:

| `effect.kind` | O que faz | Exemplo |
|---|---|---|
| `inventory` | Soma quantidade em `userInventory` | poções, itens do Grimório |
| `shield` | `+1 users.shieldsRemaining` (teto dinâmico via `getMaxShields()`: 3, ou 5 com Armadura Reforçada) | Escudo Extra |
| `streak_restore` | Restaura `habits.streakCount` a partir do snapshot `lastBrokenStreak` (exige `targetHabitId` no corpo) | Ampulheta do Tempo |
| `rest_day` | Marca `users.restDayDate = hoje`; próximo fechamento de dia nessa data pula HP/streak inteiramente | Ticket da Estalagem |

- Preço efetivo: `getEffectiveCost()` em `shared/economy.ts` aplica -20% em Olho da Visão/Escudo de Cristal/Elixir do Erudito com a skill Barganha Arcana (Mago) — Pena Mágica fica de fora de propósito. Corda Extra (Arqueiro) aplica -20% em Ampulheta do Tempo/Ticket da Estalagem; Bolsos Cheios (Ladino) aplica -15% nas 3 poções.
- Escudo semanal grátis: renovado de forma preguiçosa por `ensureWeeklyShield()` (`server/utils/shield.ts`) — sem cron, então o teto (`getMaxShields()`) é reposto em +1 sempre que a linha do usuário é tocada (login, uso de escudo, etc.) e a semana (`shieldWeekStart`) mudou. `POST /api/user/shield` gasta 1 escudo pra reservar uma proteção (`shieldUses`, no máximo 1 uso por semana): `protecao_dia` cancela toda a perda de HP daquele fechamento, `protecao_streak` preserva a sequência de um hábito específico sem gerar XP/ouro. O efeito só é aplicado depois, no `daily-closure.post.ts` do dia protegido.
- **Gold sink de prestígio**: dois cosméticos de altíssimo custo e puramente decorativos — título "Lenda Viva" (2500 ouro) e tema "Tema Platina" (2000 ouro), em `shared/cosmetics.ts` — existem só pra dar um destino ao ouro acumulado em níveis altos, sem efeito de jogo.

## Inventário (poções + itens de batalha do Grimório)

- Tabela `userInventory` (`userId`, `itemId`, `quantity`) — guarda os 7 tipos possíveis (`inventoryItemIds` em `db/schema.ts`): `potion_small/medium/large`, `olho_visao`, `escudo_cristal`, `elixir_erudito`, `pena_magica`.
- Comprado via `shop/purchase.post.ts` (`effect.kind === 'inventory'`).
- **Poções** são as únicas de uso manual fora de contexto: `POST /api/user/use-potion` (`server/api/user/use-potion.post.ts`) consome via `consumeInventoryItem()` (rola Transmutação) e cura `getPotionHealAmount(itemId, skills)` — base `POTION_HEAL_AMOUNTS` (20/50/100 HP, em `shared/economy.ts`), +25% com Metabolismo Mágico (Mago) — com teto `HP_MAX`.
- Os 4 itens do Grimório são usados em contexto (ver seção Grimório) — não têm uma rota genérica de "usar".
- UI: `app/components/ActiveItemsWidget.vue` — grid que ordena itens possuídos primeiro, poções são clicáveis (chamam `use-potion`), os demais são só informativos.

## Cosméticos (títulos, bordas, temas)

- Catálogo em `shared/cosmetics.ts`: `TITLES`, `BORDERS`, `THEMES` (todos em `COSMETIC_ITEMS`).
- Comprados pela mesma rota `shop/purchase.post.ts`, mas como **não são um `ShopEffect`** (são compra binária contra um catálogo separado), a rota primeiro tenta achar o id em `SHOP_ITEMS`, e se não achar, tenta em `COSMETIC_ITEMS` — nesse caso só grava posse em `userCosmetics`, sem `switch` de efeito.
- Equipar (troca livre entre já possuídos): `POST /api/cosmetics/equip` (`server/api/cosmetics/equip.post.ts`) — atualiza `users.equippedTitle`/`equippedAvatarBorder`/`equippedTheme`.
- **Temas**: `THEME_COLORS` em `shared/cosmetics.ts` mapeia cada tema pra `{primary, ring, background, card}` em HSL. Aplicado em runtime por `app/plugins/theme.client.ts`, que observa `user.equippedTheme` e sobrescreve essas custom properties CSS no `<html>`. Qualquer gradiente/cor que precise seguir o tema tem que usar `hsl(var(--primary))`/a classe Tailwind `primary` — cores hardcoded (tipo `fuchsia-500`) não acompanham.
- **Bordas**: `BORDER_STYLES` em `shared/cosmetics.ts`, dois tipos: `ring` (cor sólida, aplicada como `ring-*` direto no avatar) e `gradient` (bordas animadas — Arco-Íris, Aura Pulsante — que precisam de um wrapper sem `overflow-hidden` porque o efeito é um `::before` que passa dos limites do círculo; ver `app/components/ClassAvatar.vue` e as classes `.border-anim-*` em `app/assets/css/tailwind.css`).
- **Importante**: `tailwind.config.ts` precisa escanear `./shared/**/*.ts` no `content` — como essas classes Tailwind (`ring-amber-400/80` etc.) só aparecem como string dentro de `shared/cosmetics.ts`, sem isso o Tailwind purga elas do CSS final e as bordas somem visualmente (bug real que já aconteceu).

## Foto de perfil e capa

- Upload genérico compartilhado em `server/utils/userImageUpload.ts` (`saveUserImage`) — valida tipo (PNG/JPEG/WEBP/GIF) e tamanho (5MB), salva em `public/uploads/<subdir>/<DEMO_USER_ID>.<ext>` (pasta ignorada no git), sobrescrevendo qualquer arquivo anterior do usuário.
- Avatar: `POST /api/user/avatar` → `users.avatarUrl`. Capa: `POST /api/user/cover` → `users.coverUrl`.
- Só funciona rodando localmente (grava em `public/` do processo Nitro) — não sobrevive a um deploy serverless de verdade, é uma limitação conhecida enquanto o projeto for local-only.

## Árvore de Habilidades

- Catálogo completo em `shared/skills.ts`: 6 classes × 2 caminhos (`path: 'a'|'b'`) × 3 tiers = 36 skills (`SKILLS`), mais `ROOT_PASSIVES` (Sangue Quente/Foco Arcano/Aura Sagrada/Olho de Falcão/Instinto/Voz Encantadora — automáticas a partir do nível 5, **não** são compráveis, já embutidas em `classXpMultiplier()`/`classHpReductionFactor()`/`tiroCertoPercent()`/`golpeDuploChance()`/`computeCheckinXp()`, conforme a classe). Os dois caminhos de uma classe **não são exclusivos**: dá pra investir SP nos dois, só respeitando a ordem de tier dentro de cada caminho (`getPrerequisiteSkillId()`).
- **SP (skill points)**: `getAvailableSP(level, unlockedCount) = max(0, level - 4) - unlockedCount` — 1 ponto por nível a partir do 5.
- Posse: tabela `userSkills` (`userId`, `skillId`, unique por par). `server/utils/skills.ts` expõe `getUnlockedSkillIds(tx, userId)`, chamado uma vez no início da transação de qualquer rota que precise reagir a skills.
- Comprar: `POST /api/user/skills/unlock` (`server/api/user/skills/unlock.post.ts`) — valida classe, SP disponível e prerequisito de tier antes de inserir.
- **Padrão de código**: toda fórmula pura em `shared/gamification.ts`/`shared/economy.ts` que um skill modifica ganha um parâmetro opcional `skills: readonly string[] = []` (default vazio preserva o comportamento de quem ainda não foi atualizado pra passar skills). `consumeInventoryItem()` centraliza o consumo de item com o roll de Transmutação, reaproveitado em toda rota que gasta um consumível.
- UI: `app/components/SkillTree.vue`, dentro de `perfil.vue` (só aparece com `playerClass` escolhida) — mostra a passiva de raiz, os dois caminhos lado a lado e o contador de SP; compra via `useSkills.ts` (`unlockSkill`).

| Classe | Caminho | Tier 1 (1 SP) | Tier 2 (3 SP) | Tier 3 / ultimate (5 SP) |
|---|---|---|---|---|
| Guerreiro | Berserker | Adrenalina — limiares de streak -20% | Fúria Cega — XP Difícil 35→50, mas Fácil perdido tira 2× HP | Tudo ou Nada — bônus de dia perfeito ×3, mas recaída restaura só 1 HP |
| Guerreiro | Senhor da Guerra | Saqueador — +3 ouro em check-in Físico | Tributo — missões pagam +50% ouro (aplicado na conclusão) | Mercenário — missão concluída dá de brinde 1 Poção Pequena |
| Mago | Arquimago | Leitura Dinâmica — Chefe derrotado também dá ouro | Clarividência — primeiro erro de cada Batalha não tira HP | Manipulação do Destino — Olho da Visão de graça 1×/batalha |
| Mago | Alquimista | Metabolismo Mágico — poções curam +25% | Barganha Arcana — Olho/Escudo/Elixir -20% na Taverna | Transmutação — 15% de chance de não gastar o consumível |
| Paladino | Guardião | Armadura Reforçada — teto de escudos 3→5 | Baluarte — **dormente** (ver abaixo) | Graça da Estalagem — Ticket da Estalagem também cura 25 HP |
| Paladino | Cruzado | Penitência — check-in no dia seguinte a uma quebra de streak cura +3 HP | Fênix — recaída restaura 80 HP em vez de 50 | Voto de Disciplina — HP < 30%: XP e ouro de check-in ×1.5 |
| Arqueiro | Tiro Certeiro | Fluxo Constante — bônus dispara a cada 4 check-ins em vez de 5 | Ponto Fraco — bônus do Tiro Certeiro 50%→80% | Disparo Perfeito — Dia Perfeito também dispara um Tiro Certeiro extra |
| Arqueiro | Caçador | Provisões — +3 ouro em check-in de Disciplina | Corda Extra — Ampulheta/Ticket -20% na Taverna | Última Flecha — missão de Disciplina dá de brinde 1 Poção Pequena |
| Ladino | Golpe Duplo | Mão Leve — +5pp na chance de Golpe Duplo | Prática — +8pp na chance de Golpe Duplo (cumulativo) | Fintar o Destino — 25% de anular um erro no Grimório, sem limite |
| Ladino | Trapaça | Bolsos Cheios — poções -15% na Taverna | Mão Rápida — missões de Criatividade pagam +50% ouro | Aposta Alta — opt-in no Grimório: dobra risco e recompensa |
| Bardo | Segunda Voz | Refrão Curto — limiares de streak -10% | Refrão — Segunda Voz passa a valer pra qualquer categoria | Show Deve Continuar — Dia Perfeito ×2, no máx. 1×/semana |
| Bardo | Performance | Aplausos — +3 ouro em check-in Social | Boa Fama — missões de Social pagam +50% ouro | Última Canção — Ticket da Estalagem também cura 15 HP |

**Baluarte não fica mais dormente**: agora que `protecao_streak` existe, `daily-closure.post.ts` credita o XP base do hábito protegido (sem multiplicador de streak/classe, igual ao Tiro Certeiro) quando o usuário tem `paladino_baluarte`, registrado como `xpEvents` tipo `baluarte`.

---

## Autenticação

- Módulo: `nuxt-auth-utils` (`nuxt.config.ts` → `modules`). Sessão selada e assinada num cookie httpOnly (sem tabela de sessão própria, sem Redis) — a chave de selagem é `NUXT_SESSION_PASSWORD` no `.env` (auto-gerada em dev, obrigatória em produção).
- `server/utils/auth.ts`: `requireUserId(event)` — chama `requireUserSession(event)` (401 automático se não logado) e devolve `session.user.id`. É a primeira linha de praticamente toda rota de `server/api/**` que toca dado de usuário; substitui o antigo `DEMO_USER_ID` fixo.
- Tipagem da sessão: `declare module '#auth-utils' { interface User { id, email, name } }`, no mesmo `server/utils/auth.ts` — de propósito **não** guarda `passwordHash` nem outro dado sensível no cookie.
- `POST /api/auth/register` (`server/api/auth/register.post.ts`): valida e-mail/senha (mín. 8 caracteres)/nome, faz hash da senha (`hashPassword`, scrypt) e chama `setUserSession`. **Reivindicação da conta seed**: se existir exatamente 1 usuário no banco e o `passwordHash` dele ainda for o sentinel `'no-auth-yet'` (a linha que `db/seed.ts` cria), o registro atualiza essa linha em vez de inserir uma nova — assim a primeira pessoa a se cadastrar herda hábitos/XP/ouro que já existiam, sem migração manual. Da segunda conta em diante, cadastro sempre cria um usuário novo e zerado.
- `POST /api/auth/login` (`server/api/auth/login.post.ts`): busca por e-mail, `verifyPassword`, mensagem de erro genérica (não diferencia "e-mail não existe" de "senha errada").
- Logout não tem rota própria — `useUserSession().clear()` no client já chama o endpoint que o módulo registra sozinho (`DELETE /api/_auth/session`).
- Client: `useUserSession()` (composable global do módulo) expõe `loggedIn`/`user`/`fetch`/`clear`, funciona em SSR e CSR. `app/middleware/auth.global.ts` redireciona pra `/login` quem não está logado (exceto em `/login`/`/registro`) e pra `/` quem já está logado tentando acessar essas duas páginas. `app/layouts/auth.vue` é o layout minimalista (sem sidebar/header) das telas de login/registro.
- `DEMO_USER_ID` (`shared/constants.ts`) continua existindo, mas só é usado por `db/seed.ts` agora — é o id fixo da linha que a Fase de reivindicação acima procura.

## Coisas documentadas mas não implementadas

Isso já estava listado no `PROJETO.md`, repetindo aqui porque é fácil de esquecer mexendo em gameplay:

- ~~Troca de classe depois da escolha inicial~~ — **resolvido**, ver seção "Classes".
- ~~Uso real de escudo pra proteger um dia/streak específico~~ — **resolvido**, ver seção "Loja / Itens instantâneos" (também destravou a skill Baluarte, seção Árvore de Habilidades).
- ~~Hábitos semanais / dias customizados~~ — **resolvido** pra `dias_customizados` (dias fixos da semana), ver seção "Hábitos e Check-in". O modo `semanal` flexível ("N vezes por semana, qualquer dia") continua pendente — hoje se comporta como diário.
- Pausar hábito com datas (`pausedFrom`/`pausedUntil` no schema, UI só tem ativo/pausado na hora).
