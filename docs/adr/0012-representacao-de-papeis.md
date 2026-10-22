# ADR-012 — Representação de papéis

**Status:** ✅ Congelado

### Decisão

Os papéis (roles) representam permissões dentro do Smart Exit School e não o cargo profissional do usuário.

Papéis iniciais:

- owner
- administrator
- secretary
- gatekeeper

### Motivação

O mesmo cargo profissional pode exercer funções diferentes dentro do sistema.

Exemplo:

Um profissional de TI pode ser `owner` durante a implantação e posteriormente tornar-se `administrator`.

A interface poderá apresentar nomes mais amigáveis sem alterar os códigos armazenados no banco.
