# Troubleshooting — Smart Exit School

Guia prático para identificação, diagnóstico e resolução de problemas comuns no ambiente de desenvolvimento e produção do Smart Exit School.

---

## 1. Autenticação, Sessão e Recuperação de Senha

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

### 1.3. E-mail de Recuperação de Senha Não Chega
* **Sintoma:** Ao submeter a tela `/recuperar-senha`, o e-mail transacional com o link de redefinição não é recebido.
* **Diagnóstico e Soluções:**
  1. **Relay SMTP no Supabase Auth:** Certifique-se de que as configurações de Custom SMTP estão ativas no Supabase (Authentication → Email Templates → SMTP Settings), conforme detalhado no [Guia de Setup Brevo](infra/smtp-brevo-setup.md).
  2. **Remetente Verificado:** O e-mail remetente configurado deve estar validado no Brevo.
  3. **Quota / Rate Limit:** Verifique se a conta Brevo não atingiu o limite de envios do plano.
  4. **Filtro de Spam:** Cheque a pasta de spam ou lixo eletrônico.

---

## 2. Serverless Edge Functions (Deno)

### 2.1. Erro 403 Forbidden ao Iniciar Impersonation
* **Sintoma:** O modal de impersonation exibe erro `Forbidden: caller is not a platform admin`.
* **Causa:** O usuário autenticado que está chamando a função não está cadastrado na tabela `public.platform_admins`.
* **Solução:**
  - Verificar se o usuário chamador possui privilégios de plataforma:
    ```sql
    SELECT public.is_platform_admin();
    ```
  - Se necessário em ambiente local, vincule o ID do usuário em `public.platform_admins`:
    ```sql
    INSERT INTO public.platform_admins (profile_id) VALUES ('<uuid-do-admin>') ON CONFLICT DO NOTHING;
    ```

---

### 2.2. Erro de CORS ao Chamar Edge Functions
* **Sintoma:** O navegador bloqueia requisições com mensagem de falha em `Access-Control-Allow-Origin`.
* **Solução:**
  - Verificar se o módulo `_shared/cors.ts` está presente e importado na função.
  - Garantir que requisições pré-vôo (`OPTIONS`) retornem status 200 com os cabeçalhos de CORS esperados.

---

### 2.3. Erro `JWT secret not found` ou Assinatura Inválida
* **Sintoma:** A Edge Function `impersonate-user` retorna erro de servidor ao assinar o token.
* **Causa:** A variável `SUPABASE_JWT_SECRET` não foi injetada no ambiente.
* **Solução:**
  - Localmente, certifique-se de executar `npx supabase functions serve --no-verify-jwt`.
  - No Supabase Cloud, defina o segredo via CLI:
    ```bash
    npx supabase secrets set SUPABASE_JWT_SECRET="seu-jwt-secret"
    ```

---

### 2.4. Função Retorna 404 Not Found
* **Sintoma:** A requisição para `/functions/v1/impersonate-user` retorna 404.
* **Causa:** O servidor local de funções não foi iniciado ou o nome do endpoint está incorreto.
* **Solução:** Iniciar o runtime local em terminal separado:
  ```bash
  npx supabase functions serve --no-verify-jwt
  ```

---

## 3. Monitor Operacional e Telão TV (`/tv`)

### 3.1. Chamadas Acionadas no Painel Não Aparecem no Telão
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

### 3.2. Síntese de Voz Sem Áudio no Telão
* **Sintoma:** O telão exibe o nome do aluno, mas a voz sintetizada não toca.
* **Causas e Soluções:**
  1. **Política de Autoplay dos Navegadores:** Navegadores modernos exigem que o usuário interaja com a página (clique inicial) antes de autorizar a reprodução de áudio/Web Speech API. Clique em qualquer área do telão para desbloquear o áudio.
  2. **Voz do Sistema Indisponível:** Verifique se o sistema operacional possui vozes em português instaladas para a Web Speech API.

---

## 4. Banco de Dados Local e Migrações (Supabase)

### 4.1. Falha ao Iniciar o Supabase Local (`npx supabase start`)
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

### 4.2. Divergências de Schema ou Falha no Database Auditor
* **Sintoma:** O comando `npm run audit:db` ou `npm run validate:rls` retorna erros de tabelas ou policies ausentes.
* **Solução:**
  - Execute o reset completo do banco local para reaplicar todas as 22 migrations e o seed baseline:
    ```bash
    npx supabase db reset
    ```
  - Em seguida, reexecute a auditoria:
    ```bash
    npm run audit:db
    ```

---

## 5. Ambiente e Frontend

### 5.1. Erros de Roteamento SPA na Vercel (404 em Reload)
* **Sintoma:** Ao atualizar páginas como `/painel`, `/admin/institutions`, `/recuperar-senha` ou `/redefinir-senha`, o navegador recebia `404 NOT_FOUND`.
* **Solução:** Confirmar que o arquivo [vercel.json](../vercel.json) está presente na raiz com a configuração de rewrites direcionando para `/index.html`.

---

### 5.2. Falha nos Testes Unitários (`npm test`)
* **Sintoma:** Testes falhando localmente.
* **Solução:**
  - Execute a suíte de testes com o runner nativo do Node.js:
    ```bash
    npm test
    ```
  - Verifique se a infraestrutura do Supabase local está em execução se os testes exigirem validação de integração.
