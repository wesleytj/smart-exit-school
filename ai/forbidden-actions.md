# Forbidden Actions — Smart Exit School

Ações que IAs **NÃO devem realizar** ao trabalhar neste projeto, salvo solicitação explícita do usuário.

---

## Regras gerais

| # | Ação proibida | Motivo |
|---|---------------|--------|
| 1 | Inventar backend, API ou banco de dados | Não existem no projeto |
| 2 | Assumir integrações externas (Firebase, Supabase, etc.) | Não identificadas |
| 3 | Documentar funcionalidades não presentes no código | Requisito do projeto |
| 4 | Instalar dependências sem necessidade clara | Stack mínima intencional |
| 5 | Migrar para TypeScript sem solicitação | Projeto é JavaScript |
| 6 | Criar commits ou push sem pedido explícito | Regra do usuário |

---

## Layout e UI

| # | Ação proibida | Motivo |
|---|---------------|--------|
| 7 | Alterar layouts/visual sem solicitação | Preservar identidade AllTech |
| 8 | Modificar paleta de cores default (`#f97316`, `#3b82f6`) globalmente | Cores de marca |
| 9 | Remover dark mode ou whitelabel | Features de plano |
| 10 | Alterar copy/textos de upgrade de planos | Marketing definido |
| 11 | Redesenhar telão `/tv` sem solicitação | Interface operacional crítica |
| 12 | Modificar sidebar/abas do InstitutionPanel sem necessidade | Navegação estabelecida |

---

## Regras de negócio

| # | Ação proibida | Motivo |
|---|---------------|--------|
| 13 | Alterar fluxo de chamada de alunos sem autorização | Core business |
| 14 | Modificar matriz de permissões por plano | Modelo SaaS |
| 15 | Remover verificação anti-duplicata na fila | Regra de negócio |
| 16 | Unificar `exits` e `gatesList` sem plano de migração | Breaking change |
| 17 | Alterar credenciais mock/admin sem aviso | Ambiente de teste |
| 18 | Implementar bloqueio login Inativo sem validar | Comportamento atual documentado |

---

## Dados e persistência

| # | Ação proibida | Motivo |
|---|---------------|--------|
| 19 | Modificar schema localStorage sem migração | Dados existentes quebram |
| 20 | Renomear chaves `@SmartExit:*` | Quebra sync telão/painel |
| 21 | Usar chaves legado `institutions`/`currentUser` | Inconsistentes |
| 22 | Adicionar IndexedDB/SQL.js sem solicitação | Mudança arquitetural |
| 23 | Executar `localStorage.clear()` fora do reset | Perda de dados |

---

## Código

| # | Ação proibida | Motivo |
|---|---------------|--------|
| 24 | Reativar/usar `StudentCard.jsx` sem integração planejada | Código morto |
| 25 | Reativar/usar `students.js` mock | Substituído por studentsList |
| 26 | Importar `App.css` | Template legado Vite |
| 27 | Refatorar `InstitutionPanel.jsx` massivamente sem pedido | Arquivo crítico monolítico |
| 28 | Adicionar hooks após early return | Viola Rules of Hooks |
| 29 | Criar abstrações prematuras (services, repositories) | Over-engineering |
| 30 | Adicionar testes triviais que assertam render | Regra do usuário |

---

## Segurança

| # | Ação proibida | Motivo |
|---|---------------|--------|
| 31 | Commitar senhas reais ou `.env` com secrets | Segurança |
| 32 | Expor credenciais admin em docs públicos de produção | admin123 é dev only |
| 33 | Implementar hash de senha sem backend | Falsa segurança |
| 34 | Desabilitar ESLint hooks rules | Protege integridade React |

---

## Dependências

| # | Ação proibida | Motivo |
|---|---------------|--------|
| 35 | Adicionar axios/fetch para APIs inexistentes | YAGNI |
| 36 | Adicionar Redux/Zustand sem necessidade | Estado local suficiente |
| 37 | Adicionar UI libraries (MUI, Chakra) | Tailwind estabelecido |
| 38 | Adicionar i18n library sem implementar traduções | Seletor existe; tradução não |
| 39 | Substituir lucide-react por outra lib de ícones | Consistência |

---

## Deploy e infra

| # | Ação proibida | Motivo |
|---|---------------|--------|
| 40 | Configurar CI/CD específico sem solicitação | Não definido |
| 41 | Criar Dockerfile sem solicitação | Não definido |
| 42 | Alterar `vite.config.js` base path sem contexto | Pode quebrar deploy |
| 43 | Publicar/deploy sem pedido explícito | Regra do usuário |

---

## Documentação

| # | Ação proibida | Motivo |
|---|---------------|--------|
| 44 | Criar arquivos markdown não solicitados | Regra do usuário |
| 45 | Documentar APIs/endpoints fictícios | Requisito do projeto |
| 46 | Atualizar README template Vite genérico sem substituir | Já substituído |

---

## Restrições observadas no projeto

1. **Dados cadastrais readonly** — UI diz "contate suporte"; IA não deve habilitar edição sem pedido
2. **Reset de fábrica** — ação destrutiva; não mover/trigger acidentalmente
3. **MOCK_SCHOOLS seed** — não remover sem alternativa de bootstrap
4. **Plano Trial** — label existe; não implementar expiração sem spec
5. **Botões upgrade** — sem handler; não simular pagamento falso
6. **Encoding CSV windows-1252** — não alterar sem validar escolas brasileiras
7. **Polling 2s no telão** — necessário para sync; não remover sem alternativa
8. **FileReader base64 logos** — cuidado com limite localStorage

---

## Quando em dúvida

1. Ler `InstitutionPanel.jsx` e [regras-de-negocio.md](../docs/regras-de-negocio.md)
2. Perguntar ao usuário antes de mudanças arquiteturais
3. Preferir diff mínimo e focado
4. Documentar incertezas em "Pontos que precisam de validação"
