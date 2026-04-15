# Engajaa — Descritivo de Funcionalidades e Regras de Negócio

> Documento gerado em 14/04/2026  
> Versão: MVP Fase 1

---

## Visão Geral

O **Engajaa** é um SaaS multi-tenant voltado para criadores de conteúdo e times de marketing que gerenciam perfis no Instagram. A plataforma conecta-se à conta do Instagram via OAuth, sincroniza os dados dos posts e oferece análises de desempenho, sugestões de conteúdo geradas por IA e agendamento de publicações.

---

## 1. Autenticação

### 1.1 Login
- O usuário acessa o sistema com e-mail e senha.
- A senha é armazenada com hash bcrypt (12 rounds).
- O login retorna dois tokens:
  - **Access Token** (JWT RS256) — expira em **15 minutos**
  - **Refresh Token** — expira em **7 dias**, armazenado em cookie `httpOnly` e registrado no Redis

### 1.2 Renovação de Sessão
- Ao expirar o access token, o frontend usa o refresh token (via cookie) para obter um novo par de tokens automaticamente.
- O refresh token anterior é invalidado no Redis a cada renovação.

### 1.3 Logout
- Remove o refresh token do Redis, invalidando a sessão em todos os dispositivos.

### 1.4 Aceite de Convite
- Quando um usuário é convidado para um workspace, recebe um link com token de convite válido por **7 dias**.
- Ao acessar o link, o usuário define seu nome e senha para ativar a conta.
- Tokens expirados são rejeitados.

---

## 2. Multi-Tenancy

Cada **tenant** (workspace) é uma organização isolada. Toda a informação no sistema — usuários, conta Instagram, posts, agendamentos e sugestões — é estritamente segregada por `tenantId`.

### 2.1 Planos de Tenant
Os tenants possuem um plano que define o nível de acesso:

| Plano       | Descrição                |
|-------------|--------------------------|
| FREE        | Plano gratuito básico    |
| PRO         | Plano profissional       |
| ENTERPRISE  | Plano corporativo        |

### 2.2 Status do Tenant

| Status      | Descrição                          |
|-------------|------------------------------------|
| ACTIVE      | Workspace ativo                    |
| SUSPENDED   | Acesso suspenso                    |
| CANCELLED   | Contrato encerrado                 |

---

## 3. Controle de Acesso (RBAC)

O sistema utiliza controle de acesso baseado em papéis com hierarquia de quatro níveis:

| Papel   | Nível | Descrição                                          |
|---------|-------|----------------------------------------------------|
| OWNER   | 4     | Proprietário do workspace. Acesso total.           |
| ADMIN   | 3     | Gerencia usuários e configurações.                 |
| EDITOR  | 2     | Cria conteúdo, agenda posts, gera sugestões.       |
| VIEWER  | 1     | Apenas visualiza dados e relatórios.               |

**Regra:** um usuário com papel de nível N tem acesso a todas as funcionalidades que exigem nível ≤ N.

---

## 4. Gestão de Usuários

### 4.1 Listagem
- Administradores (ADMIN+) podem listar todos os membros do workspace.
- Dados exibidos: nome, e-mail, papel, data de último login, data de criação.

### 4.2 Convite
- Apenas ADMIN+ podem convidar novos usuários.
- O e-mail não pode estar duplicado no workspace.
- O papel do novo usuário deve ser válido (OWNER, ADMIN, EDITOR, VIEWER).
- Um e-mail com link de convite é enviado automaticamente.

### 4.3 Alteração de Papel
- Somente OWNER pode alterar o papel de um usuário.
- Somente OWNER pode modificar contas com papel ADMIN ou superior.

### 4.4 Remoção
- Somente OWNER pode remover membros.
- O OWNER não pode remover a si mesmo.

---

## 5. Integração com Instagram

### 5.1 Conexão (OAuth)
- A conexão usa o fluxo **Instagram Login** (instagram.com/oauth/authorize).
- Apenas o OWNER pode iniciar a conexão.
- O sistema gera uma URL de autorização com o `tenantId` codificado em Base64 no parâmetro `state`.
- Escopos solicitados:
  - `instagram_business_basic`
  - `instagram_business_content_publish`
  - `instagram_business_manage_insights`

### 5.2 Callback OAuth
- Após autorização, o Instagram redireciona para o endpoint público `/instagram/callback`.
- O sistema:
  1. Troca o código de autorização por um token de curta duração.
  2. Troca o token de curta duração por um **token de longa duração** (~60 dias).
  3. Busca o perfil do usuário (username, seguidores, posts, foto, bio).
  4. Armazena o token **criptografado** (AES) no banco de dados.
  5. Inicia a sincronização de posts automaticamente (fire-and-forget).
- Em caso de erro, redireciona para o frontend com parâmetro `ig_error`.

### 5.3 Dados do Perfil Armazenados
- ID do usuário no Instagram
- Username
- Token de acesso (criptografado)
- Data de expiração do token
- Contagem de seguidores
- Contagem de posts
- URL da foto de perfil
- Biografia

### 5.4 Sincronização de Posts
- Disponível para ADMIN+.
- A cada sincronização, o sistema:
  1. Atualiza os dados do perfil (seguidores, foto, bio).
  2. Busca os últimos **100 posts** do feed via `/me/media`.
  3. Para cada post, busca métricas de insights (alcance, impressões, salvamentos, compartilhamentos).
  4. Faz upsert dos dados no banco (cria ou atualiza cada post pelo ID).
  5. Registra a data/hora da última sincronização.

### 5.5 Dados dos Posts Armazenados
- ID do post (Instagram Media ID)
- Tipo de mídia (IMAGE, VIDEO, CAROUSEL_ALBUM)
- Legenda (caption)
- Curtidas
- Comentários
- Alcance (reach)
- Impressões
- Salvamentos
- Compartilhamentos
- URL da mídia
- URL da thumbnail
- Permalink (link direto no Instagram)
- Data de publicação
- Data de sincronização

### 5.6 Desconexão
- Apenas OWNER pode desconectar.
- Remove todos os posts sincronizados e os dados da conta do workspace.

---

## 6. Análises (Analytics)

Todos os endpoints de análise requerem papel VIEWER ou superior.

### 6.1 Visão Geral (Overview)
- Período configurável: **7, 30 ou 90 dias** (padrão: 30).
- Métricas calculadas:
  - Total de curtidas
  - Total de alcance
  - Total de comentários
  - Total de salvamentos
  - **Taxa de engajamento** = (curtidas + comentários + salvamentos) / alcance × 100
  - Data da última sincronização

### 6.2 Galeria de Posts
- Retorna os últimos **100 posts** sincronizados, sem filtro de data.
- Ordenados do mais recente para o mais antigo.
- Exibidos em grade com thumbnail, legenda, tipo de mídia, curtidas, comentários, alcance e data.

### 6.3 Performance por Formato
- Agrupa **todos os posts** por tipo de mídia (IMAGE, VIDEO, CAROUSEL_ALBUM).
- Para cada formato calcula:
  - Número de posts
  - Alcance total
  - Taxa de engajamento
  - Salvamentos totais
  - **Score** = (curtidas + comentários × 2 + salvamentos × 3) / número de posts
- Ordenado por score decrescente.

### 6.4 Melhores Horários para Postagem
- Analisa **todos os posts** sincronizados.
- Agrupa postagens em janelas de **3 horas** (0h-3h, 3h-6h, etc.).
- Calcula o engajamento médio por janela horária.
- Retorna os **3 melhores horários**.

### 6.5 Métricas Diárias
- Período configurável: **7, 30 ou 90 dias** (padrão: 7).
- Para cada dia do período, calcula:
  - Alcance total
  - Engajamento total (curtidas + comentários + salvamentos)
  - Número de posts publicados
- Usado para os gráficos de Alcance Diário e Engajamento Diário.

---

## 7. Sugestões de Conteúdo (IA)

### 7.1 Geração de Sugestões
- Requer papel EDITOR ou superior.
- O sistema analisa os últimos **90 dias** de dados:
  - Desempenho por tipo de mídia (curtidas, alcance, salvamentos por formato)
  - Horários de pico de engajamento (top 3)
  - Engajamento médio por post
  - Melhor formato identificado
- Com esse contexto, chama a **API da Anthropic (Claude)** para gerar sugestões personalizadas.

### 7.2 Cache de Sugestões
- As sugestões ficam em cache na memória por **24 horas**.
- Uma nova chamada à IA dentro desse período retorna o cache.
- O usuário pode forçar a regeneração via botão "Atualizar".

### 7.3 Dados das Sugestões
Cada sugestão exibida contém:
- Título
- Insight (justificativa baseada nos dados)
- Tags (tipo de conteúdo, formato recomendado)
- Ações: "Criar conteúdo" e "Agendar"

---

## 8. Agendamento de Posts

### 8.1 Criação
- Requer papel EDITOR ou superior.
- Campos obrigatórios:
  - Tipo de mídia (REELS, CAROUSEL, IMAGE, STORY)
  - Legenda
  - URLs das mídias (array)
  - Data/hora de publicação agendada
- O post é criado com status **DRAFT** e associado ao usuário criador.

### 8.2 Listagem
- Disponível para VIEWER+.
- Retorna todos os posts do workspace, ordenados por data de agendamento crescente.

### 8.3 Edição
- Requer papel EDITOR+.
- Apenas posts com status **DRAFT** ou **SCHEDULED** podem ser editados.
- Posts **PUBLISHED** ou **FAILED** são somente leitura.
- Campos editáveis: legenda, data/hora de agendamento, status.

### 8.4 Exclusão
- Requer papel EDITOR+.
- Apenas posts com status **DRAFT** ou **SCHEDULED** podem ser excluídos.
- Posts **PUBLISHED** ou **FAILED** não podem ser removidos.

### 8.5 Status dos Posts Agendados

| Status     | Descrição                                |
|------------|------------------------------------------|
| DRAFT      | Rascunho, não agendado                   |
| SCHEDULED  | Agendado para publicação futura          |
| PUBLISHED  | Publicado com sucesso                    |
| FAILED     | Falha na publicação                      |

---

## 9. Configurações do Workspace

### 9.1 Plano e Faturamento
- Apenas OWNER pode visualizar o plano atual e o status do workspace.
- O sistema integra com **Stripe** para redirecionamento ao portal de faturamento.

### 9.2 Conta Instagram
- Exibição do status da conexão (conectado/desconectado).
- Mostra: foto de perfil, username, biografia, seguidores, total de posts, data de conexão, data da última sync.
- Ações disponíveis: Sincronizar agora (ADMIN+), Conectar (OWNER), Desconectar (OWNER).

### 9.3 Equipe
- Listagem de todos os membros com papéis.
- Formulário de convite por e-mail com seleção de papel.

---

## 10. Infraestrutura e Segurança

### 10.1 Stack Tecnológica
| Componente   | Tecnologia                              |
|--------------|-----------------------------------------|
| API          | Node.js + Express                       |
| Frontend     | React + Vite                            |
| Banco        | PostgreSQL via Prisma ORM               |
| Cache/Filas  | Redis + BullMQ                          |
| IA           | Anthropic API (Claude)                  |
| Containers   | Docker Compose                          |

### 10.2 Portas (ambiente local)
| Serviço      | Porta  |
|--------------|--------|
| API          | 3002   |
| Frontend     | 5175   |
| PostgreSQL   | 5435   |
| Redis        | 6380   |

### 10.3 Segurança
- **Helmet.js**: Headers HTTP de segurança (CSP, X-Frame-Options, etc.)
- **CORS**: Apenas origens autorizadas (configuradas via variável de ambiente)
- **Rate Limiting**: Máximo de 1.000 requisições por minuto por IP
- **JWT RS256**: Par de chaves assimétricas (private key para assinar, public key para validar)
- **Tokens criptografados**: Tokens do Instagram armazenados com AES
- **Refresh tokens no Redis**: Permite invalidação imediata em logout
- **Cookies httpOnly**: Refresh tokens inacessíveis por JavaScript

---

## 11. Módulos do Sistema

```
engajaa-api/src/
├── modules/
│   ├── auth/          — Login, logout, refresh, aceite de convite
│   ├── users/         — Listagem, convite, alteração de papel, remoção
│   ├── instagram/     — OAuth, sincronização, status, desconexão
│   ├── analytics/     — Visão geral, posts, formatos, horários, diário
│   ├── suggestions/   — Sugestões IA com cache
│   ├── scheduler/     — Criação e gerenciamento de posts agendados
│   └── tenant/        — Plano e portal de faturamento
├── middlewares/
│   ├── auth.js        — Validação de JWT
│   ├── roles.js       — Verificação de permissões por papel
│   └── tenant.js      — Isolamento de dados por tenant
└── lib/
    └── instagram.js   — Funções OAuth, token, perfil, posts e insights

engajaa-web/src/modules/
├── auth/              — LoginPage, InviteAcceptPage
├── dashboard/         — DashboardPage
├── analytics/         — AnalyticsPage
├── scheduler/         — SchedulerPage
├── settings/          — SettingsPage (Instagram, Equipe, Plano)
└── suggestions/       — SuggestionsPage
```

---

## 12. Fluxos Principais

### Fluxo de Onboarding de Novo Tenant
1. Criação do tenant (manual/futuro: self-service)
2. OWNER faz login
3. OWNER conecta conta do Instagram (OAuth)
4. Sistema sincroniza automaticamente os 100 posts mais recentes
5. Análises, sugestões e dashboard ficam disponíveis

### Fluxo de Convite de Membro
1. ADMIN acessa Configurações → Equipe
2. Informa e-mail e papel do novo membro
3. Sistema envia e-mail com link de convite (válido 7 dias)
4. Novo membro acessa o link, define nome e senha
5. Conta ativada — membro pode fazer login

### Fluxo de Sincronização Manual
1. ADMIN acessa Configurações → Conta Instagram
2. Clica em "Sincronizar agora"
3. Sistema atualiza perfil + busca posts via API do Instagram
4. Posts e métricas atualizados no banco
5. Analytics, galeria e sugestões refletem os novos dados

---

*Documento gerado automaticamente com base no código-fonte do projeto Engajaa.*
