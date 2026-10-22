# ADR-022 — Padronização de entidades administrativas

**Status:** ✅ Congelado

### Decisão

Tabelas de configuração (cadastros administrativos) seguirão um padrão comum sempre que fizer sentido.

Campos preferenciais:

- status
- external_id
- created_at
- updated_at

Opcionalmente:

- display_order

O comportamento e os valores do campo `status`, quando utilizado, seguem a ADR-013.

### Regras de Integridade

Sempre que possível, regras universais do domínio deverão ser protegidas pelo banco de dados através de `CHECK Constraints`.

Exemplos:

- valores permitidos para `status`;
- `display_order > 0`;
- outras validações estruturais que sejam invariavelmente verdadeiras.

Regras específicas de negócio ou de interface deverão permanecer na camada da aplicação.

### Motivação

- Consistência do banco.
- Menor curva de aprendizado.
- Facilita manutenção.
- Facilita integrações.
- Simplifica o desenvolvimento do frontend.

### Consequências

- Interfaces administrativas tornam-se mais consistentes.
- CRUDs compartilham praticamente o mesmo comportamento.
- Facilita reutilização de componentes React.
