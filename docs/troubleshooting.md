# Troubleshooting — Smart Exit School

Guia prático para identificação, diagnóstico e resolução de problemas comuns no ambiente de desenvolvimento e produção do Smart Exit School.

---

## 1. Autenticação e Sessão

### 1.1. Erro de Login ou Credenciais Inválidas
* **Sintoma:** Mensagem de erro de autenticação na tela `/login`.
* **Causas Prováveis:**
  1. E-mail ou senha incorretos no Supabase Auth.
  2. Usuário existente em `auth.users`, mas sem vínculo em `public.school_members` (para operadores de escola).
* **Solução:**
  - Conferir se o usuário existe no painel do Supabase (Authentication → Users).
  - Verificar se há membership ativa correspondente:
    ```sql
    SELECT * FROM public.school_members WHERE profile_id = '<user-id>' AND status = 'active';
    ```
  - Para ambiente local, certifique-se de que o seed ou o cadastro de teste foi executado.

---

### 1.2. Painel Redireciona para `/login` Automaticamente
* **Sintoma:** Ao navegar para `/painel`, o browser é redirecionado imediatamente para `/login`.
* **Causas Prováveis:**
  - Sessão do Supabase Auth expirada ou ausente.
  - O usuário autenticado não possui nenhuma membership ativa (`school_members`), disparando o guard `TenantPanelGate`.
* **Solução:**
  - Realizar novo login com credenciais autorizadas.
  - Verificar se a conta possui ao menos uma escola associada com `status = 'active'`.

---

### 1.3. Platform Admin Redirecionado para `/admin/institutions`
* **Comportamento Esperado:** Se uma conta possuir a flag de Platform Admin (verificada via RPC `public.is_platform_admin()`), ela não opera como tenant escolar e é intencionalmente direcionada para `/admin/institutions`.

---

## 2. Monitor Operacional e Telão TV (`/tv`)

### 2.1. Chamadas Acionadas no Painel Não Aparecem no Telão
* **Sintoma:** O operador clica para chamar o aluno no painel institucional, mas o nome não surge na fila do telão.
* **Diagnóstico e Soluções:**
  1. **Fonte da Verdade em `public.pickup_events`:** As chamadas são gravadas no Supabase, não no `localStorage`. Verifique no Supabase Studio se a linha foi criada:
     ```sql
     SELECT * FROM public.pickup_events 
     WHERE school_id = '<school-id>' AND status = 'called' 
     ORDER BY called_at DESC;
     ```
  2. **Escola Diferente:** Certifique-se de que o painel e o telão estão operando sob o mesmo `school_id`.
  3. **Portão Inválido ou Ausente:** A chamada exige um `gate_id` ativo daquela instituição. Se o portão foi desativado, o envio é rejeitado.
  4. **Chamada Duplicada:** Se o aluno já possuir um evento com `status = 'called'`, a constraint parcial de unicidade impede uma segunda chamada ativa para a mesma matrícula.
  5. **Intervalo de Atualização:** O telão realiza consulta ativa (`pickupService.getActiveCallsBySchool`) a cada 5 segundos (`ACTIVE_CALL_POLL_MS`). Aguarde o ciclo de polling.

---

### 2.2. Telão Mostra "Carregando..." Indefinidamente
* **Causa:** O componente está aguardando a resolução do contexto de tenant ou a conexão com o Supabase falhou.
* **Solução:**
  - Verifique o console do navegador (F12) para checar erros de rede ou CORS.
  - Certifique-se de que o `.env.local` contém as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` válidas.

---

## 3. Banco de Dados Local e Migrações (Supabase)

### 3.1. Falha ao Iniciar o Supabase Local (`npx supabase start`)
* **Sintomas:** Erros de conexão Docker, portas em uso ou timeout.
* **Solução:**
  1. Certifique-se de que o Docker Desktop está em execução.
  2. Verifique se as portas 54321, 54322 ou 54323 não estão ocupadas por outros processos.
  3. Pare e reinicie a stack do Supabase:
     ```bash
     npx supabase stop
     npx supabase start
     ```

---

### 3.2. Divergências de Schema ou Falha no Database Auditor
* **Sintoma:** O comando `npm run audit:db` ou `npm run validate:rls` retorna erros de tabelas ou policies ausentes.
* **Solução:**
  - Execute o reset completo do banco local para reaplicar todas as 18 migrations e o seed:
    ```bash
    npx supabase db reset
    ```
  - Em seguida, reexecute a auditoria:
    ```bash
    npm run audit:db
    ```

---

## 4. Ambiente e Frontend

### 4.1. Erros de Roteamento SPA na Vercel (404 em Reload)
* **Sintoma:** Ao atualizar páginas como `/painel` ou `/admin/institutions`, o navegador recebia `404 NOT_FOUND`.
* **Solução:** Confirmar que o arquivo [vercel.json](../vercel.json) está presente na raiz com a configuração de rewrites direcionando para `/index.html`.

---

### 4.2. Falha nos Testes Unitários (`npm test`)
* **Sintoma:** Testes falhando localmente.
* **Solução:**
  - Execute a suíte de testes com o runner nativo do Node.js:
    ```bash
    npm test
    ```
  - Certifique-se de que não há arquivos temporários corrompidos no working tree.
