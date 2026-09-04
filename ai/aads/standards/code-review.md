# Code Review Standard

> Este documento define o processo oficial de revisão técnica de código do AADS.

---

# Objetivo

Toda implementação deve passar por uma revisão técnica antes de declarar **Implementation Complete**.

A revisão de código faz parte do desenvolvimento.

Ela não é opcional.

---

# Responsabilidade

A IA é responsável por executar a revisão completa.

O desenvolvedor é responsável apenas por aprovar alterações quando necessário.

---

# Quando revisar

A revisão deve ocorrer:

- antes de declarar Implementation Complete;
- antes da abertura de um Pull Request;
- antes de declarar Delivery Complete.

---

# O que revisar

## Arquitetura

Verificar:

- responsabilidades corretas;
- separação de camadas;
- baixo acoplamento;
- alta coesão;
- reutilização de código;
- respeito às ADRs.

---

## Código

Verificar:

- duplicação;
- código morto;
- TODOs esquecidos;
- comentários desnecessários;
- nomenclatura consistente;
- funções muito grandes;
- responsabilidades incorretas.

---

## Qualidade

Verificar:

- legibilidade;
- simplicidade;
- consistência;
- clareza;
- previsibilidade.

---

## Segurança

Verificar:

- credenciais hardcoded;
- secrets;
- permissões;
- validações;
- autenticação;
- autorização.

---

## Performance

Verificar:

- loops desnecessários;
- consultas repetidas;
- renderizações desnecessárias;
- complexidade excessiva.

---

## Documentação

Verificar se existe impacto em:

- README;
- docs;
- ADRs;
- Roadmap;
- Templates.

---

## Git

Verificar:

- branch correta;
- commits organizados;
- Issue relacionada;
- PR preparado;
- "Closes #N" presente.

---

# Perguntas obrigatórias

Antes de concluir, a IA deve responder internamente:

Existe código duplicado?

Existe código morto?

Existe uma solução mais simples?

Existe alguma quebra arquitetural?

Existe alguma violação das ADRs?

Existe alguma documentação desatualizada?

Existe algum risco de regressão?

Existe alguma melhoria pequena que pode ser feita agora?

Existe algo que deveria virar uma ADR?

---

# Classificação

Toda revisão deve resultar em um destes estados.

## Aprovado

Sem pendências.

---

## Aprovado com Observações

Pode prosseguir, mas existem melhorias futuras.

Registrar no Roadmap quando necessário.

---

## Reprovado

A implementação deve retornar para correção.

---

# Critérios de reprovação

A revisão deve falhar quando existir:

- erro de build;
- erro de lint;
- quebra arquitetural;
- documentação inconsistente;
- violação das ADRs;
- código duplicado relevante;
- funcionalidade incompleta;
- regressão conhecida.

---

# Regra Permanente

Nenhuma Feature pode declarar Implementation Complete sem passar pela revisão técnica definida neste documento.