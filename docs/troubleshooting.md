# Troubleshooting — Smart Exit School

Lista de problemas conhecidos, causas prováveis e soluções baseadas no comportamento do código.

---

## Autenticação e sessão

Contrato vigente: [autenticacao.md](autenticacao.md). `@SmartExit:loggedSchool` não autoriza acesso.

### E-mail ou senha incorretos

**Sintoma:** Mensagem de falha no login.

**Causas:**

1. Credencial rejeitada pelo Supabase Auth
2. Sessão válida com zero memberships ativas: não há contexto de escola

**Solução:**

- Confirmar o usuário no Supabase Auth
- Confirmar membership ativa em `school_members` para o `auth.uid()`
- O seed local não cria `school_members`. Em produção, o primeiro vínculo escolar de homologação foi SQL privilegiado; a aplicação não cria membership. Ver [autenticacao.md](autenticacao.md).

---

### Painel redireciona para login imediatamente

**Sintoma:** `/painel` volta para `/login`.

**Causa:** Sem sessão Auth, ou sessão sem membership ativa (a sessão de operador é encerrada).

**Solução:**

1. Entrar por `/login` com Supabase Auth
2. Ter ao menos uma membership ativa, ou escolher entre as autorizadas
3. Não restaurar `@SmartExit:loggedSchool` manualmente — isso não autoriza o painel

---

### Platform Admin não abre o painel da escola

**Comportamento esperado:** `is_platform_admin()` envia para `/admin/institutions`. Platform Admin não é tenant de escola.

---

## Telão (/tv)

### Telão mostra "Carregando..." indefinidamente

**Causa:** o telão depende de cache operacional local da escola já aberta no painel. Esse cache não autoriza o tenant.

**Solução:**

1. Fazer login da escola em outra aba **mesma origem** (mesmo protocolo/host/porta)
2. Recarregar `/tv`

---

### Chamadas não aparecem no telão

**Causas:**

1. Abas em origens diferentes (ex: `127.0.0.1` vs `localhost`)
2. Evento `storage` não dispara na mesma aba (comportamento do browser)
3. `schoolId` diferente entre sessões

**Soluções:**

- Usar mesma URL base em ambas abas
- Aguardar polling (2 segundos)
- Verificar chave:

```javascript
const school = JSON.parse(localStorage.getItem('@SmartExit:loggedSchool'))
localStorage.getItem(`@SmartExit:called:${school.id}`)
```

---

### Dark mode não sincroniza no telão

**Causa:** `@SmartExit:darkMode` alterado na mesma aba — evento `storage` só dispara cross-tab.

**Solução:** Recarregar telão ou alterar dark mode com telão aberto em outra aba.

---

## Dados e persistência

### Dados sumiram após reload

**Causas:**

1. Reset de fábrica executado
2. Navegação privada / limpeza de dados
3. Browser diferente ou perfil diferente

**Solução:** Recadastrar os dados operacionais no painel da escola já autorizada. O catálogo de instituições está em `public.schools`, não em `@SmartExit:schools`.

---

### Reset de fábrica apagou tudo

**Comportamento esperado:** `localStorage.clear()` em `handleResetSystem()`.

**Solução:** Recriar instituições pelo fluxo de Platform Admin. O reset local não apaga `public.schools`.

---

### Importação CSV não adiciona alunos

**Causas:**

1. Formato incorreto (colunas, separador)
2. Todos os nomes já existem (duplicatas ignoradas)
3. Arquivo vazio ou só header

**Soluções:**

- Formato: `Nome;Turma` ou `Nome,Turma`
- Encoding: salvar CSV como Windows-1252 ou UTF-8 simples
- Verificar alert de feedback

---

### Logo customizado não aparece

**Causas:**

1. Plano Basic (whitelabel bloqueado)
2. Imagem muito grande (limite localStorage ~5MB total)

**Solução:** Usar escola Premium/Diamond; reduzir tamanho da imagem.

---

## UI e funcionalidades

### Portões cadastrados não aparecem no monitor

**Causa:** Monitor usa `school.exits`, não `gatesList`.

**Solução:** Adicionar portões em `school.exits` (MOCK já inclui) ou sincronizar manualmente — **bug de design identificado**.

---

### Relatórios / Fleet mostram "Em breve"

**Comportamento esperado:** Funcionalidades placeholder.

**Solução:** Aguardar implementação futura.

---

### Idioma alterado mas UI continua em português

**Comportamento esperado:** i18n não implementado.

---

### Botões de upgrade não fazem nada

**Comportamento esperado:** Botões sem `onClick` handler — apenas UI.

---

## Build e desenvolvimento

### `npm run dev` falha

**Causas:**

1. Node.js incompatível
2. `node_modules` corrompido

**Soluções:**

```bash
rm -rf node_modules
npm install
npm run dev
```

---

### Rotas retornam 404 em produção

**Causa provável:** servidor estático sem SPA fallback. O repositório não tem `vercel.json`.

**Observação de homologação:** o Vercel respondeu `404 NOT_FOUND` para o usuário escolar em `/admin/institutions`, para o Platform Admin em `/painel`, e também para um acesso a `/painel` em que a sessão pode já ter sido perdida. Um 404 do Vercel não distingue rota inexistente, fallback de SPA ou bloqueio da aplicação. Não é evidência de RLS nem de autorização. O login, com sessão válida, direcionou o usuário escolar para `/painel` e o Platform Admin para `/admin/institutions`.

**Solução:** Configurar rewrite para `index.html` (ver [deploy.md](deploy.md)). Esta observação não autoriza corrigir o hosting nesta atualização documental.

---

### ESLint errors

```bash
npm run lint
```

Corrigir conforme output ou verificar `eslint.config.js`.

---

## Erros de imagem / assets

### Logo AllTech não carrega

**Causa:** Arquivo ausente em `src/assets/`.

**Verificar:** `logotipo_alltech_solutions_icon.png` existe no repositório.

---

## Segurança (ambiente de desenvolvimento)

### Credenciais visíveis no código-fonte

**Comportamento conhecido:** Admin password em `Login.jsx`; senhas escolas em localStorage plaintext.

**Recomendação:** Não usar dados reais em ambiente de desenvolvimento exposto.

---

## Pontos que precisam de validação

- Comportamento em Safari iOS (localStorage limits, fullscreen)
- Compatibilidade com modo kiosk para telão
- Limite exato de alunos antes de degradar performance
