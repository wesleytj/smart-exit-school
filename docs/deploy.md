# Deploy — Smart Exit School

## Ambiente de Produção

O Smart Exit School opera em modelo arquitetural desacoplado, combinando um frontend estático de alta performance hospedado na **Vercel** com um backend escalável gerenciado no **Supabase Cloud**:

* **Frontend (Vercel):** `https://smart-exit-school.vercel.app`
* **Backend / Database (Supabase Cloud):** Projeto `yantfnekslrzhussewdh` (PostgreSQL com RLS ativo)
* **Automação & CI:** GitHub Actions executando lint e build em Pull Requests e pushes para a branch `main`.

---

## Arquitetura de Deploy

```mermaid
flowchart LR
    Dev[Desenvolvedor / Git] -->|Push para main| Repo[GitHub Repo]
    Repo -->|Trigger CI| GHA[GitHub Actions<br/>Lint + Build]
    Repo -->|Deploy Automático| Vercel[Vercel Edge Network<br/>SPA React 19]
    Vercel -->|HTTPS / JWT| Supabase[Supabase Cloud<br/>PostgreSQL + Auth + RLS]
    Users[Navegadores & Telões TV] -->|Acesso Web| Vercel
    Users -.->|PostgREST / Auth| Supabase
```

---

## Roteamento e Fallback SPA (`vercel.json`)

Como a aplicação é uma Single Page Application (SPA) que utiliza o `react-router-dom` no modo `BrowserRouter`, as rotas client-side (`/login`, `/painel`, `/admin/institutions`, `/tv`) exigem redirecionamento interno para o `index.html`.

O arquivo [vercel.json](../vercel.json) está versionado na raiz do repositório garantindo esse fallback:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Isso elimina erros de rota `404 NOT_FOUND` no servidor de borda e delega o roteamento e os guards de autorização para a aplicação React.

---

## Variáveis de Ambiente em Produção

O frontend consome variáveis prefixadas com `VITE_` em tempo de compilação. No painel da Vercel (Project Settings → Environment Variables), configure:

| Variável | Obrigatória | Finalidade |
|---|---|---|
| `VITE_SUPABASE_URL` | Sim | URL HTTPS do projeto Supabase de produção |
| `VITE_SUPABASE_ANON_KEY` | Sim | Chave pública `anon` com permissões restritas pelo RLS |

> **Segurança:** A identidade do usuário é validada via **Supabase Auth**. Não existem credenciais, e-mails administrativos ou senhas hardcoded no bundle compilado (`dist/`). O controle de acesso a dados é governado pelo motor de Row Level Security (RLS) diretamente no PostgreSQL.

---

## Processo de Build

O build de produção é gerado pelo Vite:

```bash
npm run build
```

* **Diretório de saída:** `dist/`
* **Conteúdo:** HTML, JavaScript minificado, CSS com Tailwind 4 e assets estáticos otimizados.

Para testar o bundle de produção localmente antes do deploy:

```bash
npm run preview
```

---

## Checklist de Deploy de Nova Versão

1. **Validação Local:**
   - `npm run lint` (verificação de código limpo)
   - `npm test` (suíte de testes unitários passando)
   - `npm run audit:db` / `npm run validate:rls` (se houver migrações de banco)
2. **Entrega Git:**
   - Abertura de Pull Request para a branch `main`.
   - Validação dos checks do GitHub Actions (CI).
   - Aprovação humana formalizada via Decision Gate (`G-MERGE`).
3. **Deploy Contínuo:**
   - Ao realizar o merge na `main`, a Vercel compila e disponibiliza a nova versão em produção automaticamente.
