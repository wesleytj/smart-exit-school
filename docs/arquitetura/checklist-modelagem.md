# Checklist de Modelagem

Este documento define o processo padrão utilizado pela AllTech para modelagem do banco de dados do Smart Exit School.

O objetivo é garantir consistência arquitetural, evitar retrabalho e manter a documentação sincronizada com a implementação.

---

# Fluxo de Desenvolvimento

Toda nova entidade deverá seguir obrigatoriamente as etapas abaixo.

## 1. Modelagem do domínio

Antes de qualquer SQL, definir:

- Responsabilidade da entidade
- Relacionamentos
- Regras de negócio
- Dependências

Nenhuma implementação deve começar nesta etapa.

---

## 2. Revisão arquitetural

Confirmar:

- [ ] Nome da tabela
- [ ] Nome das colunas
- [ ] Relacionamentos
- [ ] Cardinalidade
- [ ] Responsabilidade única (SRP)
- [ ] A entidade pertence ao domínio correto

---

## 3. ADR (Architecture Decision Record)

Verificar se a modelagem exige uma nova decisão arquitetural.

Caso positivo:

- criar nova ADR;
- congelar a decisão antes da implementação.

---

## 4. Atualização da documentação

Antes da migration:

- [ ] modelagem.md atualizado
- [ ] decisoes.md atualizado (quando necessário)
- [ ] README da migration atualizado (quando necessário)

---

## 5. Revisão técnica da tabela

Verificar:

### Estrutura

- [ ] UUID como chave primária
- [ ] Nome da tabela em inglês
- [ ] Nome das colunas em inglês

### Relacionamentos

- [ ] Foreign Keys definidas
- [ ] ON DELETE revisado
- [ ] ON UPDATE revisado (quando necessário)

### Consistência

- [ ] Campos NOT NULL revisados
- [ ] Valores DEFAULT revisados
- [ ] CHECK Constraints revisadas
- [ ] UNIQUE Constraints revisadas

### Performance

- [ ] Índices para todas as Foreign Keys
- [ ] Índices adicionais quando necessários

### Auditoria

- [ ] created_at
- [ ] updated_at

### Integração

- [ ] external_id (quando aplicável)

### Status

Quando a entidade representar apenas disponibilidade do registro:

- [ ] status
- [ ] active / inactive

Conforme ADR-013.

---

## 6. Implementação SQL

Somente após todas as etapas anteriores.

A implementação deverá seguir o padrão definido para as migrations do projeto.

---

## 7. Testes

Após a migration:

- [ ] Executar migration em banco limpo
- [ ] Verificar constraints
- [ ] Verificar índices
- [ ] Validar relacionamentos

---

## 8. Versionamento

Antes do merge:

- [ ] Commit seguindo Conventional Commits
- [ ] Pull Request
- [ ] Code Review
- [ ] Merge na main
- [ ] Tag de versão (quando aplicável)