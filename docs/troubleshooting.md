# Troubleshooting — Smart Exit School

Lista de problemas conhecidos, causas prováveis e soluções baseadas no comportamento do código.

---

## Autenticação e sessão

### E-mail ou senha incorretos (escola)

**Sintoma:** Mensagem vermelha no login.

**Causas:**

1. Escola não existe em `@SmartExit:schools`
2. Senha digitada diferente da cadastrada (comparação exata)
3. MOCK_SCHOOLS ainda não seedados (primeiro acesso)

**Soluções:**

```javascript
// Verificar escolas cadastradas
JSON.parse(localStorage.getItem('@SmartExit:schools'))
```

- Login Super Admin e criar instituição
- Ou acessar `/painel` uma vez para seed automático (se vazio)
- Ou usar credenciais mock documentadas

---

### Painel redireciona para login imediatamente

**Sintoma:** `/painel` flasha e volta para `/login`.

**Causa:** `@SmartExit:loggedSchool` ausente ou inválido.

**Solução:**

1. Fazer login pela tela `/login`
2. Ou restaurar sessão manualmente via DevTools

---

### Super Admin não consegue acessar painel escola

**Comportamento esperado:** Super Admin vai para `/admin/institutions`, não `/painel`.

**Solução:** Logout admin → login com credenciais da escola.

---

## Telão (/tv)

### Telão mostra "Carregando..." indefinidamente

**Causa:** `@SmartExit:loggedSchool` ausente — `TvDisplay` não encontra escola.

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

**Solução:** Recadastrar ou usar Super Admin. Dados mock reinseridos se `@SmartExit:schools` vazio no `/painel`.

---

### Reset de fábrica apagou tudo

**Comportamento esperado:** `localStorage.clear()` em `handleResetSystem()`.

**Solução:** Recriar instituições via Super Admin ou usar MOCK_SCHOOLS.

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

**Causa:** Servidor estático sem SPA fallback.

**Solução:** Configurar rewrite para `index.html` (ver [deploy.md](deploy.md)).

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
