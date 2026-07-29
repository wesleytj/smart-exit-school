# AADS — AllTech AI Development Standard

> Um padrão de desenvolvimento assistido por Inteligência Artificial criado pela AllTech Solutions.

---

# Objetivo

O AADS (AllTech AI Development Standard) define como projetos da AllTech devem ser desenvolvidos utilizando Inteligência Artificial.

Seu objetivo é garantir que qualquer IA siga sempre o mesmo padrão de trabalho, evitando improvisações, esquecimentos e inconsistências entre tarefas.

O AADS não descreve regras específicas de um projeto.

Ele define **como trabalhar**.

Enquanto cada projeto possui sua própria arquitetura, regras de negócio e documentação, o AADS estabelece um processo único para desenvolvimento, documentação, Git, qualidade e revisão.

---

# Filosofia

Todo desenvolvimento deve ser:

- previsível;
- reproduzível;
- documentado;
- auditável;
- seguro;
- incremental.

Nenhuma implementação deve depender da memória do desenvolvedor ou da IA.

O processo sempre deve conduzir ao mesmo resultado.

---

# Princípios

O AADS segue alguns princípios fundamentais.

- Arquitetura antes da implementação.
- Documentação faz parte do desenvolvimento.
- Git não é opcional.
- Toda alteração deve possuir rastreabilidade.
- O projeto deve permanecer compilando durante toda a evolução.
- Nunca esconder problemas.
- Nunca declarar Implementation Complete enquanto existirem erros conhecidos relacionados à tarefa.

---

# Estrutura

O AADS é dividido em módulos independentes.

adr/
Decisões arquiteturais do próprio AADS.

checklists/
Checklists operacionais e Definition of Done.

constitution/
Princípios permanentes do padrão.

engine/
Protocolos de execução e verificações automáticas.

prompts/
Prompts padronizados para IA.

standards/
Fluxos oficiais de desenvolvimento.

templates/
Templates reutilizáveis.

workflows/
Workflows de bootstrap e features.

CHANGELOG.md
Histórico de evolução do AADS.


---

# Escopo

O AADS define:

- fluxo de desenvolvimento;
- padrões de Git;
- documentação;
- Definition of Done;
- arquitetura;
- revisão;
- testes;
- versionamento;
- recuperação de falhas.

O AADS não substitui a documentação do projeto.

Cada projeto continua responsável por manter seus próprios documentos.

---

# Versionamento

O AADS evolui continuamente.

Mudanças significativas devem gerar novas ADRs e atualização do CHANGELOG.

---

# Estado atual

Versão: **0.2.2**

Status:

> Cursor Rules: **ACTIVE FOR VALIDATION** (não stable).  
> Em desenvolvimento dentro do projeto Smart Exit School.

Quando atingir estabilidade suficiente, será promovido para um repositório próprio da AllTech Solutions.