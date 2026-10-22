# ADR-013 — Padronização de Status das Entidades

**Status:** ✅ Congelado

### Decisão

Sempre que uma entidade do domínio necessitar representar apenas se um registro está disponível para utilização, será utilizado o campo:

status

Valores permitidos:

- active
- inactive

### Motivação

Esse padrão simplifica a modelagem do banco de dados, mantém consistência entre as tabelas e reduz a complexidade das regras de negócio.

Estados mais específicos deverão ser modelados apenas quando representarem conceitos próprios do domínio.

Exemplos:

- payments
  - pending
  - paid
  - cancelled

- pickups
  - pending
  - approved
  - denied
  - completed

Nesses casos, o campo representa o fluxo de negócio e não apenas a disponibilidade do registro.

### Consequências

- Consistência entre entidades administrativas.
- Menor curva de aprendizado.
- CRUDs simplificados.
- Facilita filtros e consultas.
