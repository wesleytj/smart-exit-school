# Smart Exit School

Sistema web moderno para gestão e monitoramento da saída de alunos em instituições de ensino, desenvolvido pela **AllTech Solutions**.

![Preview Smart Exit School](https://github.com/wesleytj/smart-exit-school/blob/main/docs/screenshots/preview_ses.gif)

## Descrição

O **Smart Exit School** é uma plataforma robusta desenvolvida no modelo **SaaS (Software as a Service)**, focada em otimizar e organizar a logística de saída escolar. Operando como uma Single Page Application (SPA) multi-instituição, o sistema conecta o fluxo operacional das escolas com painéis em tempo real (Telão/TV), garantindo que os alunos sejam chamados de forma clara, segura e eficiente.

## Problema que resolve

O final do expediente escolar costuma ser um momento de estresse, gerando aglomerações em portões, desencontros entre pais e alunos e poluição sonora com o uso excessivo de microfones. 

O Smart Exit School resolve esse problema ao **digitalizar a fila de chamadas**, permitindo que inspetores e professores acionem a saída dos alunos de forma silenciosa e coordenada, enquanto os pais e os próprios alunos acompanham o status visualmente através de monitores e telões estrategicamente posicionados na escola.

## Principais funcionalidades

- **Gestão Multi-instituição (SaaS):** Painel Super Admin exclusivo para gerenciamento de clientes, escolas parceiras e controle de assinaturas.
- **Controle de Acessos e Planos:** Sistema flexível de *tiers* (Basic, Premium, Diamond) com recursos habilitados dinamicamente por plano.
- **Painel Operacional Institucional:** Interface intuitiva para gestão rápida de turmas, alunos e portões de saída.
- **Monitor de Chamadas em Tempo Real:** Telão otimizado (TV) para exibição do aluno atualizado na fila, incluindo histórico de chamadas recentes e indicação do portão de saída.
- **Importação em Lote:** Cadastro acelerado de grandes volumes de alunos via arquivos CSV.
- **Personalização e Whitelabel:** Suporte a logomarcas customizadas e paleta de cores dinâmicas adaptadas à identidade visual de cada escola (Planos Premium/Diamond).
- **Dark Mode:** Interface adaptável aos modos claro e escuro, reduzindo o cansaço visual de operadores.

## Diferenciais

- **Interface de Alta Performance:** Navegação fluida, sem recarregamento de páginas, focada na experiência do usuário (UX).
- **Identidade Visual Enterprise:** Motor de estilos dinâmicos que assume as cores institucionais do cliente de ponta a ponta.
- **Arquitetura Modular:** Arquitetura baseada em componentes reutilizáveis e abstração de serviços, facilitando a integração futura com ecossistemas mobile e geolocalização.

## Tecnologias utilizadas

O projeto adota uma stack moderna e consolidada no ecossistema de desenvolvimento web:

- **React 19** 
- **Vite 8** (Build tool e Dev server ultra-rápido)
- **Tailwind CSS 4** (Utility-first framework via `@tailwindcss/vite`)
- **React Router DOM 7** (Roteamento de interface)
- **Lucide React** (Biblioteca de ícones SVG consistentes)
- **Supabase** (PostgreSQL + Auth — schema em migração; client `@supabase/supabase-js`)

## Arquitetura geral

A arquitetura do projeto segue o padrão modular em um ecossistema React, garantindo separação de responsabilidades:

- `/components`: Estruturas de interface agnósticas e reutilizáveis (Botões, Modais, Inputs).
- `/pages`: Componentes de visualização de alto nível atrelados às rotas da aplicação.
- `/services`: Camada de abstração de dados (DAL) — isolando persistência da UI.
- `/lib`: Client Supabase.
- `/supabase`: Migrations SQL, seed e configuração do banco PostgreSQL.
- `/assets`: Recursos estáticos e mídias globais.

## Screenshots

| Painel Administrativo | Monitor de Chamadas (TV) |
| :---: | :---: |
| ![Painel Admin](https://github.com/wesleytj/smart-exit-school/blob/main/docs/screenshots/dashboard_institucional.png) | ![Monitor TV](https://github.com/wesleytj/smart-exit-school/blob/main/docs/screenshots/telao_saida.png) |

## Como executar localmente

Siga as instruções abaixo para configurar o ambiente de desenvolvimento em sua máquina local:

```bash
# 1. Clone o repositório
git clone https://github.com/wesleytj/smart-exit-school.git
cd smart-exit-school

# 2. Instale as dependências do projeto
npm install

# 3. Configure variáveis de ambiente (Supabase)
cp .env.example .env.local   # se .env.example existir; ou crie manualmente
# VITE_SUPABASE_URL=
# VITE_SUPABASE_ANON_KEY=

# 4. Aplique migrations locais (opcional — requer Supabase CLI)
npx supabase db reset

# 5. Inicie o servidor de desenvolvimento
npm run dev

# Acesse a URL exibida no terminal (geralmente http://localhost:5173).
# O frontend ainda utiliza localStorage para operações operacionais; o schema PostgreSQL está em migração.
```

## Documentação

A documentação detalhada do ecossistema encontra-se na pasta `/docs`:

- Arquitetura e Fluxos

- Estrutura de Pastas e Módulos

- Regras de Negócio e Permissões

- Guia de Deploy

## Roadmap

O desenvolvimento do Smart Exit School é contínuo. Nossos próximos grandes marcos incluem:

- [ ] Módulo de Relatórios Analytics: Gráficos gerenciais de auditoria e tempo de saída.

- [ ] Ecossistema Mobile (Diamond): Integração com aplicativo para pais, incluindo geolocalização ("Estou Chegando").

- [ ] Gestão de Frotas: Módulo dedicado para controle de vans e transportes escolares.

- [ ] API Rest e Webhooks: Permitir integrações de catracas e sistemas legados de escolas via endpoints abertos.

- [ ] Internacionalização (i18n): Suporte nativo a múltiplos idiomas.

## Status atual do projeto

**Fase:** `Beta` / `Em Desenvolvimento Ativo`.

| Área | Status |
|------|--------|
| Frontend SPA + DAL | ✅ Funcional |
| Schema PostgreSQL (Auth + Academic) | ✅ Migrations 0001–0002 |
| Integração Supabase no frontend | ⚠️ Parcial (`schoolService` leitura) |
| Supabase Auth (ADR-004) | ❌ Pendente no frontend |
| RLS | ❌ Pendente |
| Produção 1.0 | 🚧 Em consolidação |

## Sobre a AllTech Solutions

A **AllTech Solutions** tem como missão transformar desafios logísticos do cotidiano através de soluções tecnológicas inteligentes, escaláveis e acessíveis. O Smart Exit School é uma de nossas iniciativas voltadas para a revolução digital na infraestrutura da educação básica.

**Autor:** Wesley Treib Jacques 