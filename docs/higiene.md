# Registro de Higiene do Repositório — Ciclo D (Gate D-HYG)

**Data:** 13/10/2026  
**SHA Base de Avaliação:** `622ae9e2a25db670d6714451c1b462f00e0934c3`  
**Autoridade / Governança:** MyHub / AADS  
**Regime:** Mutação autorizada de higiene (D-HYG)  

---

## 1. Arquivos Órfãos Removidos

Em conformidade com a auditoria de higiene pré-Ciclo E, os seguintes 4 arquivos versionados foram removidos do repositório por ausência comprovada de uso ou duplicidade funcional:

| Arquivo Removido | Tamanho | Motivo Técnico / Auditoria de Referências |
|---|---|---|
| `src/services/core/supabaseClient.js` | 256 B | **Duplicata não utilizada:** instanciação redundante do cliente Supabase. O projeto padronizou e utiliza exclusivamente `src/lib/supabase.js`. |
| `src/components/StudentCard.jsx` | 2.4 KB | **Componente não referenciado:** herdado do template conceitual inicial com fotos de alunos, sem qualquer import ativo nas páginas da aplicação (`InstitutionPanel`, `InstitutionsManager`, etc.). |
| `src/App.css` | 2.8 KB | **Boilerplate residual do Vite:** estilos de demonstração (`.hero`, `.counter`, `#next-steps`) gerados na inicialização do projeto (`create-vite`), sem nenhum import no código (`src/App.jsx` ou outros). |
| `public/sounds/call.mp3` | 259.1 KB | **Duplicata de asset estático:** cópia idêntica byte-a-byte de `public/call.mp3`. A aplicação (`src/pages/TvDisplay.jsx`) consome exclusivamente a rota `/call.mp3`. |

---

## 2. Critérios de Segurança e Validação Pré-Commit

A remoção dos arquivos foi submetida aos seguintes testes de integridade antes da consolidação do commit:

1. **Build de Produção:**
   ```bash
   npm run build
   ```
   *Resultado:* Compilado com sucesso pelo Vite em 1.15s sem erros de módulo não encontrado.

2. **Suíte Unitária Completa:**
   ```bash
   npm run test:unit
   ```
   *Resultado:* 204 testes unitários PASS em 38 suítes / 14 arquivos (823ms), confirmando zero regressões no domínio ou nos serviços.

---

## 3. Ajustes no `.gitignore`

Antes da edição, realizou-se a checagem com `git check-ignore` para evitar cruft de configuração e duplicação desnecessária:
- `supabase/.branches/` e `supabase/.temp/`: **Não adicionados ao `.gitignore` raiz**, pois já são ignorados compulsoriamente pelo arquivo `supabase/.gitignore` (evitando duplicação redundante).
- Regras genuinamente novas adicionadas ao `.gitignore` da raiz:
  ```gitignore
  # Scripts e arquivos temporários de diagnóstico
  scripts/temp/
  *.tmp
  ```
