# Coding Rules — Smart Exit School

Regras derivadas dos padrões identificados no código existente. IAs devem seguir estas convenções ao contribuir.

---

## Linguagem e arquivos

| Regra | Detalhe |
|-------|---------|
| Linguagem | JavaScript (ES Modules) — **não TypeScript** |
| Extensão componentes | `.jsx` |
| Extensão utilitários | `.js` |
| `"type": "module"` | Imports ES6 (`import`/`export`) |
| Idioma comentários | Português (principalmente em `InstitutionPanel.jsx`) |
| Idioma UI | Português (BR) |

---

## Estrutura de componentes

### Páginas

- Uma página = um arquivo em `src/pages/`
- Export default: `export default function PageName()`
- Componentes funcionais exclusivamente (sem classes)

### Padrão InstitutionPanel (monolito)

Seções organizadas com comentários:

```javascript
// SEÇÃO 1: REFS E NAVEGAÇÃO
// SEÇÃO 2: ESTADOS GLOBAIS
// SEÇÃO 3: ESTADOS DAS FUNCIONALIDADES
// SEÇÃO 4: useEffect
// SEÇÃO 5: EARLY RETURN (if (!school) return null)
// SEÇÃO 6: HANDLERS
// SEÇÃO 7: ESTILOS CALCULADOS
// SEÇÃO 8: RENDER JSX
```

**Regra React crítica:** Todos hooks (`useState`, `useEffect`, `useRef`) **antes** do primeiro `return` condicional.

### Componentes compartilhados

- Colocar em `src/components/`
- Atualmente subutilizado — preferir consistência com páginas existentes

---

## Estilização

| Regra | Detalhe |
|-------|---------|
| Framework | Tailwind CSS 4 utility classes |
| Evitar | CSS modules, styled-components |
| Tema | Cores via CSS variables `--color-primary`, `--color-secondary` |
| Dark mode | Classe `.dark` em `document.documentElement` ou wrapper |
| Cores dinâmicas | Inline `style={{ '--color-primary': ... }}` |
| Ícones | `lucide-react` — import nomeado |
| Paleta default | Primary `#f97316`, Secondary `#3b82f6`, Dark bg `#161616` |

### Classes Tailwind comuns

- Cards: `rounded-2xl border border-slate-200 shadow-sm`
- Botões primários: `bg-primary text-white hover:opacity-90 rounded-xl font-bold`
- Dark: `dark:bg-[#1a1a1a] dark:border-[#2a2a2a] dark:text-white`

---

## Estado e persistência

```javascript
// Padrão de save identificado
function saveSchoolData(updatedSchool) {
  setSchool(updatedSchool)
  localStorage.setItem("@SmartExit:loggedSchool", JSON.stringify(updatedSchool))
  const allSchools = JSON.parse(localStorage.getItem("@SmartExit:schools")) || []
  const updated = allSchools.map(s => s.id === updatedSchool.id ? updatedSchool : s)
  localStorage.setItem("@SmartExit:schools", JSON.stringify(updated))
}
```

| Regra | Detalhe |
|-------|---------|
| Prefixo chaves | `@SmartExit:` |
| Serialização | `JSON.stringify` / `JSON.parse` |
| IDs | `Date.now()` ou `Date.now().toString()` |
| Estado local | `useState` — sem Redux/Context |
| Navegação | `useNavigate()` do react-router-dom |

---

## Roteamento

- Definir rotas apenas em `App.jsx`
- Usar `BrowserRouter`, `Routes`, `Route`, `Navigate`
- Guards via `useEffect` + `navigate("/login")` — não há componente ProtectedRoute

---

## Nomenclatura

| Elemento | Convenção | Exemplo |
|----------|-----------|---------|
| Componentes | PascalCase | `InstitutionPanel` |
| Funções handler | camelCase com prefixo `handle` | `handleCallStudent` |
| Estados | camelCase descritivo | `calledStudents`, `gateFormName` |
| Constantes | UPPER_SNAKE ou PascalCase | `MOCK_SCHOOLS`, `DEFAULT_PRIMARY_COLOR` |
| Chaves storage | `@SmartExit:recurso` | `@SmartExit:schools` |
| Abas | string id lowercase | `"monitor"`, `"students"` |

---

## Formulários

- Submit via `onSubmit` com `e.preventDefault()`
- Validação mínima: checks inline + HTML `required`
- Feedback: `alert()` para sucesso/import; `window.confirm()` para destrutivo
- Erros login: state `error` + div condicional

---

## Planos SaaS

Sempre verificar `school.plan` antes de habilitar features:

```javascript
school.plan === "Basic"           // bloqueio
school.plan === "Premium"       // whitelabel, dark mode
school.plan === "Diamond"       // API, fleet
["Premium", "Diamond"].includes(school.plan)  // cores custom
```

---

## Imports

Ordem observada:

1. React hooks
2. react-router-dom
3. lucide-react icons
4. Assets locais
5. Componentes locais (se houver)

```javascript
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Users, Settings } from "lucide-react"
import LogoAllTech from "../assets/logotipo_alltech_solutions_icon.png"
```

---

## ESLint

- Config flat: `eslint.config.js`
- Executar: `npm run lint`
- Plugins: react-hooks, react-refresh

---

## Boas práticas identificadas

1. Confirmar ações destrutivas com `window.confirm`
2. Scroll to top ao editar (`window.scrollTo`)
3. Limpar forms após submit (`handleCancelXEdit`)
4. Migrar dados legados no load (classes string → object)
5. Comentários de seção em arquivos grandes

## Anti-padrões a evitar

1. Adicionar hooks após early return
2. Criar novas chaves localStorage sem prefixo `@SmartExit:`
3. Introduzir TypeScript sem migração planejada
4. Extrair micro-abstrações desnecessárias
5. Usar `StudentCard` ou `students.js` legados

---

## Testes

**Não existem.** Se adicionar, definir framework e estrutura com o time primeiro.

---

## Commits

Seguir estilo do repositório quando commits forem solicitados explicitamente.
