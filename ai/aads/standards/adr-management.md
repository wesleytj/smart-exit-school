# ADR Management

> Este documento define o padrão oficial para criação, atualização e manutenção de Architecture Decision Records (ADR) dentro do AADS.

---

# Objetivo

As ADRs registram decisões arquiteturais permanentes.

Seu objetivo é preservar o contexto técnico, evitar rediscussões futuras e fornecer rastreabilidade para decisões importantes.

Toda decisão arquitetural relevante deve possuir uma ADR correspondente.

---

# O que é uma ADR?

Uma ADR (Architecture Decision Record) documenta:

- o problema;
- o contexto;
- as alternativas consideradas;
- a decisão tomada;
- as consequências.

Ela explica o "porquê", não apenas o "como".

---

# Quando criar uma ADR

A IA deve propor uma nova ADR sempre que ocorrer qualquer uma das situações abaixo.

## Arquitetura

- criação de nova arquitetura;
- alteração significativa da arquitetura;
- mudança de padrão arquitetural;
- substituição de tecnologias principais.

---

## Banco de Dados

- alteração estrutural importante;
- mudança de estratégia de persistência;
- nova política de RLS;
- mudança de autenticação;
- novo modelo de domínio.

---

## Segurança

- alteração de autenticação;
- alteração de autorização;
- mudanças em permissões;
- alterações de criptografia;
- novas políticas de segurança.

---

## Desenvolvimento

- novo padrão de desenvolvimento;
- mudança de fluxo;
- alteração de Git Workflow;
- mudança do processo oficial.

---

## Produto

- mudança estrutural de regras de negócio;
- funcionalidades que alteram o comportamento central do sistema.

---

## Inteligência Artificial

- alteração do comportamento padrão da IA;
- novos workflows obrigatórios;
- mudanças permanentes do AADS.

---

# Quando NÃO criar uma ADR

Não criar ADR para:

- correções de bugs;
- refatorações internas;
- renomeação de arquivos;
- melhorias visuais;
- otimizações locais;
- ajustes de lint;
- documentação simples;
- comentários;
- testes.

---

# Responsabilidade

A IA é responsável por identificar quando uma ADR deve existir.

O desenvolvedor é responsável por aprovar sua criação.

---

# Processo de criação

Sempre seguir esta ordem.

1. Detectar necessidade.

↓

2. Comunicar ao desenvolvedor.

↓

3. Explicar o motivo.

↓

4. Propor o título.

↓

5. Definir a numeração.

↓

6. Criar a ADR.

↓

7. Atualizar documentação relacionada.

---

# Numeração

As ADRs são sequenciais.

Exemplo:

ADR-001

ADR-002

ADR-003

...

Nunca reutilizar números.

Nunca renumerar ADRs existentes.

---

# Estrutura obrigatória

Toda ADR deve conter:

# Título

---

## Status

Proposta

Aceita

Substituída

Obsoleta

---

## Contexto

---

## Problema

---

## Alternativas

---

## Decisão

---

## Consequências

---

## Impactos

---

## Documentos relacionados

---

## Issue relacionada

---

## Pull Request relacionado

---

# Atualização de ADRs

Uma ADR pode receber pequenas correções.

Entretanto, caso a decisão arquitetural seja alterada, deve ser criada uma nova ADR.

A ADR antiga permanece registrada.

Ela deve ser marcada como:

Substituída.

---

# Obsolescência

Uma ADR nunca deve ser apagada.

Caso deixe de representar a arquitetura atual:

marcar como

Obsoleta

ou

Substituída pela ADR-XXX

---

# Relacionamentos

Sempre que possível relacionar:

ADR

↓

Issue

↓

Branch

↓

Pull Request

↓

Merge

Isso garante rastreabilidade completa.

---

# Papel da IA

Sempre que detectar uma mudança arquitetural significativa, a IA deve perguntar:

"Esta alteração merece uma ADR?"

Caso a resposta seja sim, deve interromper a implementação até que a decisão arquitetural esteja registrada ou aprovada pelo desenvolvedor.

---

# Regra Permanente

Nenhuma decisão arquitetural importante deve existir apenas no código.

Ela deve possuir documentação permanente através de uma ADR.