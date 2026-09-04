# Documentation Standard

> Este documento define o padrão oficial de documentação utilizado pelo AADS.

---

# Objetivo

A documentação faz parte do desenvolvimento.

Nenhuma funcionalidade alcança **Implementation Complete** enquanto a documentação aplicável estiver inconsistente.

---

# Responsabilidade

A IA é responsável por identificar impactos na documentação.

O desenvolvedor é responsável apenas por aprovar mudanças quando necessário.

---

# Regra Fundamental

Nunca atualizar documentação por hábito.

Atualizar apenas quando houver impacto real.

---

# Quando atualizar documentação

A documentação deve ser revisada quando ocorrer:

- criação de funcionalidade;
- alteração de comportamento;
- remoção de funcionalidade;
- alteração de arquitetura;
- mudança de fluxo;
- mudança de regras de negócio;
- alteração de APIs;
- alteração de comandos;
- alteração de instalação;
- alteração de configuração.

---

# Quando NÃO atualizar

Não atualizar documentação para:

- refatorações internas;
- melhorias de performance;
- reorganização de código;
- renomeação de variáveis;
- mudanças sem impacto externo.

---

# Ordem de atualização

Sempre seguir esta sequência:

1. Código
2. Testes
3. Documentação técnica
4. ADR (se necessário)
5. README (se necessário)

---

# Evitar duplicação

Uma informação deve possuir apenas uma fonte oficial.

O restante da documentação deve apenas referenciar essa fonte.

Nunca manter a mesma informação em múltiplos documentos.

---

# README

O README deve conter apenas:

- visão geral;
- instalação;
- primeiros passos;
- estrutura do projeto;
- links para documentação.

Nunca transformar o README em documentação técnica completa.

---

# Documentação Técnica

Documentação detalhada deve permanecer em:

docs/

Cada documento deve possuir um único objetivo.

---

# ADR

Sempre utilizar ADR quando a alteração representar uma decisão arquitetural permanente.

Nunca utilizar documentação comum para registrar decisões arquiteturais.

---

# Comentários no código

Comentários devem explicar:

- por que algo existe;
- decisões incomuns;
- regras importantes.

Nunca comentar o óbvio.

---

# Atualização obrigatória

Após concluir uma Feature, a IA deve verificar:

README

↓

docs/

↓

ADRs

↓

Roadmap

↓

Templates

↓

Checklists

Somente atualizar o que realmente sofreu impacto.

---

# Critério de Qualidade

Uma documentação de qualidade deve ser:

- correta;
- objetiva;
- atualizada;
- rastreável;
- consistente;
- sem duplicação.

---

# Regra Permanente

Documentação é parte da entrega.

Uma Feature sem documentação consistente não alcança Implementation Complete.