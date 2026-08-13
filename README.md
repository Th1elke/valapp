<p align="center">
  <img src="public/img/logo-val.png" width="140" alt="ValApp" />
</p>

<h1 align="center">ValApp</h1>

<p align="center">
  Um app de controle de hábitos com gamificação estilo RPG: XP, níveis, classes, HP que cai quando<br />
  você não cumpre seus hábitos, ouro, loja, missões e um "Grimório" que usa IA para transformar<br />
  conteúdo de estudo em quiz.
</p>

<p align="center">
  <a href="https://valpp.vercel.app/inicio"><strong>🔗 Demo ao vivo</strong></a>
</p>

---

## Sobre

ValApp nasceu como um experimento: e se a lista de hábitos mais chata do mundo virasse uma ficha de
personagem de RPG? Cada hábito cumprido rende XP e ouro; deixar de cumprir custa HP de verdade; ao
chegar no nível 5 você escolhe uma classe (Guerreiro, Mago, Paladino, Arqueiro, Ladino ou Bardo), cada
uma com mecânicas de assinatura próprias e uma árvore de skills; e sempre que o HP zera, uma recaída te
tira uma fatia do XP acumulado — sem destruir todo o progresso, mas doendo o suficiente pra importar.

As regras completas de design (fórmulas de XP/HP/ouro, balanceamento de classes, motivação por trás de
cada decisão) estão documentadas em [docs/01-regras-gamificacao.md](docs/01-regras-gamificacao.md).

## Funcionalidades

- **Hábitos**: CRUD completo, categorias (Físico/Mente/Disciplina/Social/Criatividade), dificuldade,
  agendamento por dias fixos da semana, streak com recorde salvo.
- **XP, nível, HP e ouro**: fórmulas com multiplicador de streak e bônus de classe; fechamento de dia
  aplica punição de HP ou bônus de dia perfeito e trata recaída (perda percentual de XP com teto, não
  reset total). Roda sozinho todo dia via Vercel Cron Job, com um botão manual como fallback.
- **6 classes jogáveis**, cada uma com 3 tiers de evolução e uma mecânica de assinatura própria (ex.:
  Arqueiro acerta um bônus flat de XP a cada 5º check-in em sequência; Ladino tem chance de dobrar XP em
  hábitos de Criatividade; Bardo preserva metade da sequência em vez de zerar). 36 skills compráveis (6
  classes × 2 caminhos × 3 tiers) + 6 passivas de raiz. Troca de classe disponível após a escolha
  inicial, a um custo de XP.
- **Escudo semanal**: protege o dia inteiro ou a sequência de um hábito específico contra a punição do
  fechamento de dia.
- **Atributos**: XP por categoria de hábito vira um radar de RPG (STR/INT/WIS/CHA/DEX).
- **Missões avulsas**: tarefas de conclusão única, valem 3× a recompensa de um hábito normal.
- **Integração com Google Classroom**: vincula a conta Google pelo perfil e importa as tarefas ativas
  das turmas como missões (`standby`, sem XP até você definir a dificuldade). A partir daí a missão
  entra no fluxo normal — mesma recompensa e mesma tela de conclusão de uma missão criada na mão. Não
  sincroniza notas nem envios, só o enunciado e o prazo.
- **Loja (Taverna)**: poções de cura, itens de batalha do Grimório, e cosméticos (títulos, bordas de
  avatar, temas de cor) — cada item com sua própria identidade visual (cor derivada do nome, ou uma
  categoria consistente quando o nome não sugere cor nenhuma).
- **Grimório (IA)**: cola um texto de estudo, a IA gera um resumo e um quiz de 3 perguntas; modo
  "Batalha" aplica dano real no HP a cada resposta errada, com recompensa proporcional ao acerto.
- **Autenticação real**: registro/login com sessão selada em cookie httpOnly, sem tabela de sessão
  própria.
- **Perfil**: foto de perfil/capa (upload real, via Vercel Blob), cosméticos equipáveis, árvore de
  skills.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | [Nuxt 4](https://nuxt.com/) (Vue 3, TypeScript) |
| UI | Tailwind CSS + [shadcn-vue](https://www.shadcn-vue.com/) (componentes montados manualmente) |
| Banco de dados | Postgres ([Neon](https://neon.tech)) via [Drizzle ORM](https://orm.drizzle.team/), driver `@neondatabase/serverless` (WebSocket, com suporte a transações interativas) |
| Autenticação | [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) |
| IA | [Gemini API](https://aistudio.google.com/) (`@google/genai`) — geração de resumo + quiz do Grimório |
| Upload de imagem | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) |
| Integração externa | Google OAuth + [Classroom API](https://developers.google.com/classroom) — importa tarefas de turmas como missões |
| Deploy | [Vercel](https://vercel.com/) |

## Rodando localmente

Pré-requisitos: Node 22+, e uma connection string de um Postgres (um banco free tier no
[Neon](https://neon.tech) ou [Supabase](https://supabase.com) resolve).

```bash
git clone https://github.com/Th1elke/valapp.git
cd valapp
npm install
copy .env.example .env        # cp no Linux/Mac
```

Preenche o `.env` (ver tabela abaixo), depois:

```bash
npm run db:migrate   # aplica as migrations no Postgres apontado por DATABASE_URL
npm run db:seed      # cria a linha inicial que a primeira conta vai "herdar" no cadastro
npm run dev           # http://localhost:3000
```

Abre `/registro` e cria sua conta — por ser o primeiro cadastro, ela herda automaticamente a linha
criada pelo `db:seed` (sem perder hábito/XP que já exista ali). Cadastros seguintes criam contas novas
e isoladas.

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | sim | Connection string Postgres |
| `NUXT_SESSION_PASSWORD` | em produção | String de 32+ caracteres pra selar o cookie de sessão; gerada automaticamente em dev se faltar |
| `GEMINI_API_KEY` | não | Chave grátis em [aistudio.google.com/apikey](https://aistudio.google.com/apikey); sem ela só o Grimório fica indisponível, o resto do app funciona normal |
| `BLOB_READ_WRITE_TOKEN` | não | Storage tab do projeto na Vercel → Create → Blob; sem ela só upload de avatar/capa falha |
| `NUXT_OAUTH_GOOGLE_CLIENT_ID` / `NUXT_OAUTH_GOOGLE_CLIENT_SECRET` | não | Credencial OAuth (Google Cloud Console → Web application), redirect URI `{origin}/auth/google`; sem elas só a vinculação com Google Classroom fica indisponível |

Scripts úteis: `npm run db:studio` (Drizzle Studio, inspeciona o banco visualmente), `npm run db:generate`
(gera uma nova migration depois de editar `db/schema.ts`).

## Estrutura do projeto

```
docs/                     regras de gamificação e modelagem do banco
shared/                   código isomórfico (client + server): types, fórmulas de XP/HP/ouro, catálogos
db/                       schema Drizzle, client, migrations, seed
server/api/               rotas da API (auth, hábitos, check-in, missões, loja, grimório, usuário)
server/routes/auth/       callback do OAuth do Google (vinculação de conta, fora do padrão /api)
server/utils/             helpers do backend (auth, datas, integração Gemini, Classroom, upload de imagem)
app/pages/                as telas (login, registro, dashboard, hábitos, missões, grimório, loja, perfil)
app/components/           componentes Vue, incluindo app/components/ui/ (shadcn-vue montado na mão)
app/composables/          hooks de fetch/mutação usados pelas páginas
app/middleware/           gate de login em toda navegação
```

## Deploy

Em produção no [Vercel](https://vercel.com/) com Postgres gerenciado pelo [Neon](https://neon.tech) e
upload de imagem no [Vercel Blob](https://vercel.com/docs/storage/vercel-blob). O checklist completo de
deploy (incluindo uma pegadinha real de região entre a function da Vercel e o banco) está em
[PROJETO.md](PROJETO.md#deploy-no-vercel).

## Limitações conhecidas

- **Sem testes automatizados** — tudo validado manualmente via requisições HTTP durante o
  desenvolvimento.
- **Modo `semanal` flexível de hábito** ("N vezes por semana, qualquer dia") ainda não implementado —
  hoje se comporta como diário. Agendamento por dias fixos da semana (`dias_customizados`) já funciona.

## Documentação adicional

- [PROJETO.md](PROJETO.md) — status detalhado do projeto, decisões técnicas e limitações conhecidas
- [GAMEPLAY.md](GAMEPLAY.md) — mapa completo de onde vive a lógica de cada sistema no código
- [docs/01-regras-gamificacao.md](docs/01-regras-gamificacao.md) — fonte da verdade de todas as regras de design
- [docs/02-modelagem-banco.md](docs/02-modelagem-banco.md) — diagrama ER e explicação de cada tabela

## Autores

[Gustavo Thielke](https://github.com/Th1elke)

[Gabriel Ferrazza](https://github.com/vgabzx)
