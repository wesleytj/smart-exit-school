# Setup de Email Transacional — Brevo SMTP + Supabase Auth

**Projeto:** Smart Exit School (SES)  
**Escopo:** Infraestrutura / Email Transacional  
**Componentes:** Brevo (Relay SMTP) + Supabase Auth  
**Status:** Operacional (Validado em Homologação/Dev)  

---

## 1. Visão Geral

O fluxo de recuperação e redefinição de senhas do Smart Exit School (`/recuperar-senha` e `/redefinir-senha`) baseia-se nas capacidades de autenticação do **Supabase Auth**.

Por padrão, o serviço interno de disparo de e-mails do Supabase impõe cotas rigorosas (cerca de 3 a 4 envios por hora no plano gratuito) e remetente genérico não customizado (`noreply@mail.app.supabase.io`), o que inviabiliza fluxos confiáveis e testes contínuos de desenvolvimento e homologação.

Para garantir alta entregabilidade, estabilidade operacional e suporte a remetentes corporativos, a infraestrutura adota o **Brevo** (antigo Sendinblue) como provedor de relay SMTP externo integrado diretamente ao Supabase Auth.

```text
Usuário solicita redefinição
          ↓
Frontend SES (/recuperar-senha)
          ↓
supabase.auth.resetPasswordForEmail()
          ↓
Supabase Auth (Custom SMTP habilitado)
          ↓ (SMTP Relay na porta 587)
Brevo (smtp-relay.brevo.com)
          ↓ (Validação do Remetente Verificado)
Caixa de Entrada do Usuário (Template em Português com Magic Link/Token)
```

---

## 2. Pré-requisitos

Antes de iniciar a configuração entre as plataformas, certifique-se de dispor de:

1. **Conta no Brevo:** Acesso administrativo a uma conta Brevo ativa.
2. **Remetente Verificado:** Ao menos um endereço de e-mail de administrador/desenvolvedor validado pelo Brevo.
3. **Projeto Supabase:** Acesso com privilégios de administrador ao dashboard do projeto no Supabase.
4. **Gerenciador de Segredos:** Cofre de senhas seguro (ex.: Bitwarden, 1Password, KeePass ou cofre institucional) para guardar as credenciais SMTP geradas.

---

## 3. Passo a Passo no Brevo

### 3.1. Adicionar e Verificar o Remetente

O Brevo exige obrigatoriamente que qualquer e-mail emissor esteja pré-aprovado:

1. Acesse o painel do Brevo.
2. No canto superior direito, acesse o menu de perfil e selecione **Senders, Domains & Dedicated IPs** (ou **Remetentes e IPs**).
3. Na aba **Senders**, clique em **Add a Sender** (Adicionar Remetente).
4. Informe:
   - **From Name:** `Smart Exit School`
   - **From Email:** `<SENDER_EMAIL_VERIFICADO>` (e-mail sob controle do operador).
5. Um e-mail com link/código de confirmação será enviado para a caixa informada. Conclua a validação.
6. Certifique-se de que o remetente conste com status **Verified** no painel.

### 3.2. Gerar Chave de Acesso SMTP

1. Acesse o menu de perfil no Brevo e clique em **SMTP & API**.
2. Selecione a aba **SMTP**.
3. Clique em **Generate a new SMTP key** (Gerar nova chave SMTP).
4. Defina um identificador descritivo (ex.: `smart-exit-school-supabase-auth`).
5. Copie a chave (senha gerada) imediatamente e salve-a no seu gerenciador de segredos. **O Brevo exibe este valor apenas uma vez.**
6. Tome nota do **Login SMTP** exibido na tela (`<SMTP_USER>`).

---

## 4. Passo a Passo no Supabase

1. Acesse o dashboard do projeto no **Supabase**.
2. No menu lateral, navegue até **Authentication** → **Emails** (ou **Project Settings** → **Auth** → **SMTP Settings**).
3. Localize a seção **SMTP Settings** e ative o switch **Enable Custom SMTP**.
4. Preencha os campos exatamente com os parâmetros abaixo:

| Campo no Supabase | Valor Configurado | Descrição / Observação |
|---|---|---|
| **Sender email** | `<SENDER_EMAIL_VERIFICADO>` | **Crítico:** Deve ser rigorosamente o mesmo e-mail verificado no Brevo. |
| **Sender name** | `Smart Exit School` | Nome de exibição que aparecerá para o destinatário. |
| **Host** | `smtp-relay.brevo.com` | Host oficial do relay Brevo. |
| **Port** | `587` | Porta oficial STARTTLS (**não** utilize 585). |
| **Minimum TLS version** | `TLSv1.2` (ou padrão) | Garante transporte criptografado seguro. |
| **User** | `<SMTP_USER>` | Login/usuário da chave SMTP gerada no Brevo. |
| **Pass** | `<SMTP_PASSWORD>` | Senha/chave SMTP gerada no Brevo. |

5. Clique em **Save** no rodapé da página.

---

## 5. Template de Email ("Reset Password")

Após a conexão do SMTP, configure o conteúdo do e-mail de redefinição de senha para o idioma padrão da aplicação (Português - Brasil):

1. No dashboard do Supabase, acesse **Authentication** → **Email Templates**.
2. Selecione o template **Reset Password**.
3. No campo **Subject** (Assunto), informe um título claro:
   ```text
   Redefinição de senha — Smart Exit School
   ```
4. No campo **Body** (Corpo da Mensagem), estruture a mensagem em português mantendo as variáveis nativas do Supabase:
   - `{{ .ConfirmationURL }}`: Link contendo o token de redefinição seguro gerado pelo Supabase.
   - `{{ .Token }}`: Código OTP (caso o fluxo use token numérico).
   - `{{ .SiteURL }}`: URL base da aplicação configurada em **URL Configuration**.

> **Nota:** Assegure-se de que a **Redirect URL** (em *Authentication → URL Configuration*) inclua a rota `/redefinir-senha` da aplicação para redirecionamento correto pós-clique.

---

## 6. Troubleshooting e Lições Aprendidas

Durante a homologação deste setup, foram identificados e solucionados comportamentos operacionais relevantes:

### 6.1. Falha de Conexão com Porta 585 (Timeout / Handshake Error)
- **Problema:** A conexão falha e nenhum e-mail é enviado quando configurada a porta `585`.
- **Causa:** A porta `585` é legada e não suportada pelo relay do Brevo para autenticação STARTTLS padrão.
- **Solução:** Utilizar expressamente a porta **`587`**.

### 6.2. Rejeição com Erro "sender ... is not valid"
- **Problema:** O Supabase tenta enviar, mas o Brevo recusa o despacho com a mensagem de que o remetente não é válido.
- **Causa:** Preenchimento do campo **Sender email** no Supabase com o identificador de usuário SMTP (`<SMTP_USER>`) em vez de um endereço de e-mail verificado.
- **Solução:** O campo **Sender email** deve conter obrigatoriamente um e-mail previamente validado na lista de Senders do Brevo (`<SENDER_EMAIL_VERIFICADO>`). O `<SMTP_USER>` deve ser usado exclusivamente no campo **User**.

### 6.3. Diagnóstico e Auditoria em Tempo Real via Logs do Brevo
- **Procedimento:** Sempre que um e-mail não for recebido na ponta final:
  1. No painel do Brevo, acesse **Transactional** → **Real-time Logs** (ou **Statistics**).
  2. Localize a tentativa de envio para o e-mail de destino.
  3. Verifique o status retornado: `Delivered` (Entregue), `Deferred` (Adiado), `Blocked` (Bloqueado) ou `Hard Bounce`.
  4. O detalhe técnico do evento aponta exatamente o código de erro retornado pelos servidores de e-mail de destino.

---

## 7. Roadmap Futuro — Migração para Domínio Próprio

Em ambiente de desenvolvimento e testes iniciais, o envio utiliza uma conta de e-mail pessoal verificada (`<SENDER_EMAIL_VERIFICADO>`). 

Para o ambiente corporativo de produção, a infraestrutura deve evoluir para um domínio institucional próprio (ex.: `noreply@<dominio>.com.br`):

1. **Adicionar Domínio no Brevo:**  
   Em **Senders, Domains & Dedicated IPs** → **Domains**, registrar o domínio oficial da escola ou da mantenedora.
2. **Configuração de DNS (DKIM, SPF e DMARC):**  
   Inserir os registros TXT/CNAME fornecidos pelo Brevo na zona DNS do domínio para garantir reputação máxima e evitar classificação como SPAM.
3. **Atualização no Supabase Auth:**  
   Substituir o campo **Sender email** nas configurações de SMTP do Supabase pelo endereço institucional (ex.: `noreply@<dominio>.com.br`).

---

## 8. Segurança e Governança de Credenciais

- **Segregação Estrita:** Credenciais de relay SMTP (`<SMTP_USER>`, `<SMTP_PASSWORD>`) e tokens de API **nunca** devem ser inseridos em arquivos `.env`, scripts locais ou commitados no repositório Git.
- **Persistência Exclusiva:** As credenciais existem unicamente de forma cifrada na infraestrutura do Supabase e no cofre de segredos da equipe técnica.
- **Rotação Periódica:** Em caso de suspeita de comprometimento, revogue a chave SMTP imediatamente no painel do Brevo e gere um novo par de credenciais atualizando o Supabase Auth.
