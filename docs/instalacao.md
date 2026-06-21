# Instalação — Smart Exit School

Tutorial completo para configurar e executar o projeto localmente.

---

## Pré-requisitos

| Requisito | Versão | Observação |
|-----------|--------|------------|
| Node.js | **Não especificado** no projeto | Recomendado: LTS 20.x ou 22.x |
| npm | Incluso com Node.js | Usado pelo projeto |
| Git | Qualquer versão recente | Para clonar o repositório |
| Navegador moderno | Chrome, Firefox, Edge, Safari | ES Modules + localStorage |

**Não necessário:**

- Banco de dados
- Docker
- Variáveis de ambiente

---

## 1. Clonar o projeto

```bash
git clone <url-do-repositorio>
cd smart-exit-school
```

Substitua `<url-do-repositorio>` pela URL real do repositório Git.

---

## 2. Instalar dependências

```bash
npm install
```

Isso instala as dependências definidas em `package.json` e resolve versões via `package-lock.json`.

---

## 3. Configurar ambiente

**Nenhuma configuração obrigatória.**

O projeto não utiliza arquivos `.env`. Opcionalmente, você pode limpar dados anteriores no navegador:

```javascript
// DevTools Console
localStorage.clear()
```

---

## 4. Executar localmente

### Modo desenvolvimento (recomendado)

```bash
npm run dev
```

Saída esperada (similar):

```
  VITE v8.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Acesse `http://localhost:5173` no navegador.

### Modo produção local

```bash
npm run build
npm run preview
```

---

## 5. Primeiro acesso

### Fluxo recomendado para teste

1. Acesse `http://localhost:5173` → redirect para `/login`
2. Na primeira execução, `@SmartExit:schools` estará vazio
3. Faça login com uma escola mock **ou** Super Admin

### Credenciais Super Admin

| Campo | Valor |
|-------|-------|
| E-mail | `admin@alltech.com` |
| Senha | `admin123` |

Destino: Painel Super Admin em `/admin/institutions`

### Credenciais escolas mock

Inseridas automaticamente no primeiro acesso ao `/painel` (se localStorage vazio):

| E-mail | Senha | Plano |
|--------|-------|-------|
| teste@basic.com | 123456 | Basic |
| teste@premium.com | 123456 | Premium |
| teste@diamond.com | 123456 | Diamond |

**Nota:** MOCK_SCHOOLS são seedados ao acessar `/painel`, não no login. Para login direto, acesse `/painel` uma vez ou crie escola via Super Admin.

### Criar instituição customizada

1. Login Super Admin
2. "Nova Instituição"
3. Preencher nome, e-mail, senha, plano
4. Logout → Login com credenciais criadas

---

## 6. Testar fluxo completo

```mermaid
flowchart TD
    A[Login escola Premium] --> B[/painel]
    B --> C[Cadastrar turma]
    C --> D[Adicionar portão em exits via mock ou import]
    D --> E[Cadastrar alunos]
    E --> F[Monitor: Chamar aluno]
    F --> G[Abrir /tv em nova aba]
    G --> H[Verificar chamada no telão]
    F --> I[Confirmar saída]
```

### Passo a passo

1. Login: `teste@premium.com` / `123456`
2. Aba **Gestão de Turmas** → criar "3º A"
3. Aba **Gestão de Alunos** → cadastrar aluno vinculado à turma
4. Aba **Monitor de Saída** → clicar "Chamar"
5. Clicar "Abrir Telão (TV)" ou acessar `/tv`
6. Verificar exibição da chamada
7. "Confirmar Saída" no monitor

---

## 7. Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | Executar ESLint |

---

## 8. Estrutura após instalação

```
smart-exit-school/
├── node_modules/     # Criado após npm install
├── dist/             # Criado após npm run build
└── ...
```

Ambos estão no `.gitignore` (`node_modules`, `dist`).

---

## Problemas comuns

Consulte [troubleshooting.md](troubleshooting.md) para lista detalhada.

| Problema | Solução rápida |
|----------|----------------|
| Login escola falha | Verificar se escola existe em `@SmartExit:schools` |
| Telão vazio | Fazer login da escola antes; mesma origem localhost |
| Dados inconsistentes | `localStorage.clear()` + reload |
| Porta 5173 ocupada | Vite usa próxima porta automaticamente |

---

## Pontos que precisam de validação

- Versão mínima de Node.js para Vite 8
- URL exata do repositório Git para clone
