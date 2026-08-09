# ValApp — Status do Projeto

App de controle de hábitos com gamificação estilo RPG: XP, níveis, classes (Guerreiro/Mago/Paladino/Arqueiro/Ladino/Bardo), HP que cai quando você não cumpre hábitos, ouro, loja, missões avulsas e um "Grimório" que usa IA pra transformar conteúdo de estudo em quiz.

Este arquivo é o ponto de partida pra continuar o projeto em outra máquina — lê ele antes de mexer em qualquer coisa.

## Stack

- **Nuxt 4** (Vue 3, `app/` como srcDir) + **Tailwind CSS** + **shadcn-vue** (componentes montados na mão em `app/components/ui/`, não via CLI — ver nota abaixo)
- **Drizzle ORM** sobre **SQLite** (`better-sqlite3`) — temporário, ver seção de decisões
- **Gemini API** (`@google/genai`, modelo `gemini-3.5-flash`) pro Grimório
- Fonte: **General Sans** (via `@nuxt/fonts`, provider Fontshare — gratuita para uso comercial)

## Como rodar em uma máquina nova

```bash
npm install
copy .env.example .env        # ou cp no Linux/Mac
```

Edita o `.env` gerado:
- `DATABASE_URL="file:./db/local.db"` já vem certo, não precisa mudar.
- `GEMINI_API_KEY=""` — pega uma chave grátis em https://aistudio.google.com/apikey (sem cartão) e cola aqui. Sem isso o Grimório não funciona (o resto do app funciona normalmente).
- `NUXT_SESSION_PASSWORD` — string de 32+ caracteres pra selar o cookie de sessão; o `nuxt-auth-utils` gera uma sozinho em dev se faltar, mas em produção é obrigatório definir.

```bash
npm run db:migrate   # aplica as migrations em db/migrations/ no SQLite local
npm run db:seed      # cria a linha inicial que a primeira conta vai "herdar" no cadastro
npm run dev           # sobe em http://localhost:3000 (ou 3001 se a 3000 estiver ocupada)
```

Abra `/registro` e crie sua conta — como é o primeiro cadastro no banco, ele automaticamente assume a linha criada pelo `db:seed` (então qualquer hábito/XP que já exista ali não se perde). Cadastros seguintes criam contas novas e zeradas normalmente.

Scripts úteis: `npm run db:studio` (abre o Drizzle Studio pra inspecionar o banco visualmente), `npm run db:generate` (gera uma nova migration depois de editar `db/schema.ts`).

## O que já foi feito

### Fase 1 — Planejamento (docs/)
- [docs/01-regras-gamificacao.md](docs/01-regras-gamificacao.md) — **a fonte da verdade de todas as regras** (fórmulas de XP, níveis, classes, HP, ouro, atributos, missões, recaída, Grimório). Qualquer dúvida de "como isso deveria funcionar" começa aí.
- [docs/02-modelagem-banco.md](docs/02-modelagem-banco.md) — diagrama ER e explicação de cada tabela.

### Fase 2 — Sistema core
- Setup do projeto (Nuxt + shadcn-vue + Drizzle).
- Backend real: hábitos (CRUD), check-in (calcula XP com streak + bônus de classe, atualiza nível), desfazer check-in do dia, escolha de classe no nível 5, fechamento de dia (`POST /api/daily-closure`, aplica punição de HP ou bônus de dia perfeito, trata recaída).
- Telas reais (não mockadas): Dashboard, Hábitos, Perfil — todas puxando dados via `useFetch`/composables em `app/composables/`.

### Fase 3 — Economia, atributos, missões, game over
- **Ouro**: todo check-in rende ouro (independente de streak/classe); dia perfeito também dá bônus.
- **Loja** (`/loja`, "Taverna"): compra Poção de Cura (+20 HP) e Escudo Extra com ouro.
- **Atributos** (`/perfil`): cada categoria de hábito vira um atributo de RPG (STR/INT/WIS/CHA/DEX), somado a partir do XP ganho por categoria, exibido num radar chart SVG customizado.
- **Missões** (`/missoes`): tarefas de conclusão única, valem 3× XP/ouro de um hábito normal.
- **Game Over**: quando HP chega a 0, o dashboard mostra um modal explícito com o que aconteceu (perda de nível, HP restaurado a 50, ouro/classe intocados).

### Fase 4 — Grimório (IA)
- `/grimorio`: cola conteúdo de estudo → Gemini gera resumo + quiz de 3 perguntas (JSON estruturado nativo via `responseSchema`, validado de novo no servidor).
- Aba "Fogueira" (resumo pra revisão passiva) e "Batalha" (quiz, uma pergunta por vez, dano real no HP do jogador ao errar).
- Recompensa proporcional à taxa de acerto, creditada inteiramente em Inteligência.
- Histórico de sessões anteriores, retomável.

### Fase 5 — Autenticação real
- Cadastro (`/registro`) e login (`/login`) via `nuxt-auth-utils` — sessão selada em cookie httpOnly, sem tabela de sessão própria; senha com hash scrypt (`hashPassword`/`verifyPassword`).
- Toda rota de `server/api/**` resolve o usuário logado via `requireUserId(event)` (`server/utils/auth.ts`) em vez de um id fixo — 401 automático se não houver sessão.
- Middleware global (`app/middleware/auth.global.ts`) redireciona pra `/login` quem não está autenticado, e pra `/` quem já está logado e tenta acessar `/login`/`/registro`.
- **Primeira conta criada herda os dados existentes**: o cadastro detecta a linha semente do `db/seed.ts` (sentinel `passwordHash: 'no-auth-yet'`) e a "reivindica" em vez de criar do zero, então hábitos/XP/ouro que já existiam no banco não se perdem. Cadastros seguintes criam contas novas e isoladas — multiusuário de verdade.
- Skill tree, missões, Grimório, loja, cosméticos — todo o resto do app é agnóstico a isso, já que só falavam com o usuário via essas rotas.

### Fase 6 — 3 classes novas (Arqueiro, Ladino, Bardo)
- Cada uma com mecânica de assinatura própria, sem usar `classXpMultiplier`/`classHpReductionFactor`: **Arqueiro** (Tiro Certeiro — bônus flat de XP a cada 5º check-in em sequência), **Ladino** (Golpe Duplo — chance de dobrar XP em check-in de Criatividade) e **Bardo** (Segunda Voz — sequência quebrada em hábito Social vira metade, não zero).
- 18 skills novas (2 caminhos × 3 tiers por classe) + 3 passivas de raiz, seguindo exatamente o molde das 3 classes originais — ver tabela completa em [GAMEPLAY.md](GAMEPLAY.md#árvore-de-habilidades).
- Missões ganharam um campo `category` opcional (mesmo enum dos hábitos) só pra alimentar bônus de classe por categoria (Boa Fama, Mão Rápida, Última Flecha, Tributo).
- Grimório ganhou um segundo "ultimate" opt-in por batalha (Aposta Alta, Ladino) além do Elixir do Erudito já existente.

### Fase 7 — Escudo real e troca de classe
- **Escudo semanal** (docs seção 5.2): `POST /api/user/shield` gasta um escudo pra proteger o dia inteiro (`protecao_dia`, cancela a perda de HP no fechamento) ou a sequência de um hábito específico (`protecao_streak`, streak conta como cumprida mas sem XP/ouro). Renovação semanal (+1, até o teto de `getMaxShields`) é feita de forma preguiçosa em `ensureWeeklyShield` (`server/utils/shield.ts`) sempre que a linha do usuário é tocada — não tem cron, então essa é a alternativa até a fase de deploy real. Limite de 1 uso por semana mesmo com escudos guardados (unique index `shield_uses_user_week_unique`), pra não deixar o escudo virar um jeito de zerar uma semana inteira de recaída.
- **Troca de classe** (docs seção 4.3): `POST /api/user/class` agora aceita trocar a classe já escolhida, não só a escolha inicial no nível 5 — custa 30% do XP atual e só libera de novo depois de 90 dias (`lastClassChangeAt`/`classChosenAt`). UI em `/perfil`.

## Decisões e limitações conhecidas (importante!)

1. **SQLite, não Postgres.** O plano original era Postgres + Drizzle, mas a máquina de desenvolvimento não tinha Docker nem Postgres instalado. O schema (`db/schema.ts`) é logicamente idêntico, só usa `sqlite-core` em vez de `pg-core`. Migrar pra Postgres depois é trocar o dialeto no schema, em `db/client.ts` e em `drizzle.config.ts` — ver nota no topo de [docs/02-modelagem-banco.md](docs/02-modelagem-banco.md).
2. ~~Sem autenticação.~~ **Resolvido** — cadastro/login reais via `nuxt-auth-utils` (sessão selada em cookie, hashing de senha embutido). Cada rota resolve o usuário logado via `requireUserId()` (`server/utils/auth.ts`); `DEMO_USER_ID` (`shared/constants.ts`) só sobrevive como sentinel do `db/seed.ts` pra primeira conta herdar os dados. Ver seção "Autenticação" em [GAMEPLAY.md](GAMEPLAY.md) pra detalhes.
3. **Sem job agendado real.** O fechamento de dia (`POST /api/daily-closure`) que aplica punição de HP / bônus de dia perfeito é disparado **manualmente** pelo botão "Fechar dia de ontem" no dashboard, não roda sozinho à meia-noite. Em produção isso precisa virar um cron real.
4. **shadcn-vue sem CLI.** O CLI `shadcn-vue add` trava neste ambiente (terminal sem TTY). Os componentes em `app/components/ui/` foram escritos na mão seguindo o padrão exato do registry oficial. Pra adicionar um novo componente, tenta `npx shadcn-vue@latest add <nome>` num terminal interativo normal primeiro; se travar, monta na mão copiando o padrão dos que já existem.
5. **Fonte não é a Gilroy/Lufga original.** Trocada por **General Sans** (mesma família visual, mas com licença livre confirmada) porque não dava pra garantir licença das fontes originais que foram mostradas como referência. Se você tiver os arquivos `.woff2` licenciados, dá pra trocar via `@nuxt/fonts` com provider `local`.
6. ~~Git ainda não inicializado.~~ **Resolvido** — repositório criado, primeiro commit feito.

## Regras documentadas mas com implementação parcial

- **Hábitos semanais** — o modo `semanal` do enum `habitFrequency` (meta flexível "N vezes por semana, qualquer dia") ainda não foi implementado; hoje se comporta como diário. `dias_customizados` (dias fixos da semana, ex. só fim de semana) já funciona de ponta a ponta — ver `shared/habitSchedule.ts`.
- **Pausar hábito com datas** — o schema tem `pausedFrom`/`pausedUntil`, mas a tela de Hábitos só alterna `ativo`/`pausado` na hora, sem escolher um período de férias.

## O que falta fazer

Em ordem sugerida de prioridade:

1. ~~Autenticação real~~ — feito, ver "O que já foi feito" e a decisão #2 acima.
2. ~~Uso de escudo~~ e ~~troca de classe~~ — feito, ver Fase 7 em "O que já foi feito".
3. **Postgres em produção** — trocar o dialeto quando houver Docker/serviço disponível (ver decisão #1 acima).
4. **Cron real** para o fechamento diário (hoje é o botão manual).
5. Modo `semanal` flexível e pausa com datas (itens acima — `dias_customizados` já está pronto).
6. **Deploy** (nenhum ambiente de produção configurado ainda).
7. **Testes automatizados** — tudo até agora foi validado manualmente via requisições HTTP durante o desenvolvimento; não há suíte de testes.

## Mapa rápido do código

```
docs/                     regras de gamificação e modelagem do banco (leia primeiro)
shared/                   código isomórfico (client + server): types, fórmulas de XP/HP/ouro, constantes
db/                       schema Drizzle, client, migrations, seed
server/api/               rotas da API (auth, hábitos, check-in, missões, loja, grimório, usuário, fechamento de dia)
server/utils/             helpers do backend (auth, datas, integração Gemini, DTOs do grimório)
app/pages/                as telas (login, registro, dashboard, hábitos, missões, grimório, loja, perfil)
app/components/           componentes Vue, incluindo app/components/ui/ (shadcn-vue montado na mão)
app/composables/          hooks de fetch/mutação usados pelas páginas
app/middleware/           auth.global.ts — gate de login em toda navegação
```
