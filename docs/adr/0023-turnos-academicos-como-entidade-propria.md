# ADR-023 — Turnos Acadêmicos como entidade própria

**Status:** ✅ Congelado

### Decisão

O Smart Exit School modelará os turnos acadêmicos através da tabela `academic_shifts`.

A tabela `academic_groups` possuirá uma chave estrangeira (`academic_shift_id`) apontando para essa entidade.

O turno **não será armazenado** como texto livre dentro de `academic_groups`.

### Estrutura

academic_levels
        │
        │
academic_groups ───────── academic_shifts

### Exemplos de turnos

- Morning
- Afternoon
- Full-time
- Night

A tradução desses valores será responsabilidade do frontend.

### Motivação

O turno representa um conceito do domínio acadêmico e será utilizado em diversas funcionalidades do sistema, como:

- organização das filas de saída;
- filtros;
- dashboards;
- relatórios;
- integrações com ERP;
- importação via Excel;
- regras de negócio.

Modelá-lo como entidade evita duplicação de valores, padroniza os dados e facilita futuras evoluções.

### Consequências

- Banco de dados mais consistente.
- Evita valores diferentes para o mesmo turno.
- Facilita internacionalização.
- Simplifica consultas e filtros.
- Mantém a arquitetura preparada para crescimento.
