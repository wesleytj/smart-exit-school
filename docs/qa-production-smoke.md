# Smoke de Production — fixture QA Pickup

Procedimento do fixture permanente usado para validar a fila operacional de retirada em Production.

Política: [qa-data-governance.md](./qa-data-governance.md).  
Registro planejado: [qa-inventory.md](./qa-inventory.md).

Este documento descreve o procedimento. A criação do fixture é uma etapa posterior e ainda não foi executada.

## Objetivo

Permitir smoke tests de Production da Fase 1 de `pickup_events` com um aluno de QA identificado, reversível e separado dos alunos já existentes.

Fluxo coberto:

```text
aluno QA ativo
    ↓
Monitor
    ↓
seleção explícita do gate
    ↓
pickup_event called
    ↓
TV
    ↓
polling
    ↓
completed
    ↓
fixture inactive
```

## Escopo

Inclui a preparação, a execução, a restauração e a verificação do fixture abaixo.

Fora deste procedimento:

- alunos já existentes na instituição, inclusive o registro de matrícula `TEST-001`;
- criação de turma;
- exclusão do fixture;
- exclusão de `pickup_events`;
- alteração de schema, RLS, grants ou código;
- SQL, `service_role` ou migration como meio de executar o fluxo.

## Ambiente

| Campo | Valor |
|---|---|
| Ambiente | Production |
| Aplicação | `https://smart-exit-school.vercel.app` |
| Instituição | Colégio Adventista de Esteio |
| Execução | Conta escolar de homologação dessa instituição, pela interface |
| Fonte da fila | `public.pickup_events` |

A conta escolar opera pela aplicação. Este procedimento não usa SQL, `service_role` nem migration.

## Identificação do fixture

```text
QA Pickup Smoke
QA-PICKUP-001
Colégio Adventista de Esteio
6ma
inactive fora da janela de teste
```

| Campo | Valor |
|---|---|
| Nome | `QA Pickup Smoke` |
| Matrícula | `QA-PICKUP-001` |
| Instituição | Colégio Adventista de Esteio |
| Turma | `6ma` (turma já existente) |
| Portão do smoke | `Portão` (portão já existente e ativo) |
| Papel | Fixture permanente de Production |

Os identificadores de banco (`students.id`, `student_enrollments.id`, `student_group_assignments.id`) ficam vazios até a criação autorizada. O inventário os recebe depois, com os valores reais. Não há UUID de planejamento.

## Estado de repouso

Fora da janela de teste:

- `students.status = inactive`;
- o aluno não aparece em Alunos Disponíveis no Monitor;
- nenhum `pickup_events` desse fixture permanece com `status = called`.

Durante a janela, o status passa a `active` somente para o smoke e volta a `inactive` na restauração.

Eventos `completed` permanecem. São evidência histórica e não são limpeza pendente.

## Pré-condições

Antes de preparar ou executar:

- este procedimento revisado;
- fixture ainda inexistente na preparação inicial, ou já cadastrado com matrícula `QA-PICKUP-001` nas execuções seguintes;
- turma `6ma` existente;
- portão `Portão` ativo;
- conta escolar da instituição autenticada pela aplicação;
- nenhum evento `called` aberto para a matrícula do fixture;
- alunos já existentes, inclusive `TEST-001`, fora do roteiro.

## Preparação inicial do fixture

Executar uma vez, pela Gestão de Alunos, depois da revisão deste procedimento.

1. Confirmar que não existe aluno com matrícula `QA-PICKUP-001`.
2. Cadastrar nome `QA Pickup Smoke`, matrícula `QA-PICKUP-001`, turma `6ma`.
3. Anotar no inventário os IDs reais de aluno, matrícula acadêmica e vínculo de turma.
4. Inativar o aluno na mesma sessão.
5. Confirmar o estado de repouso: status `inactive`, ausente no Monitor, sem evento `called`.

O cadastro da aplicação cria o aluno ativo. A inativação imediata é parte da preparação, não um passo opcional.

Não criar turma. Não cadastrar outro portão. Não usar um aluno já existente.

## Execução do smoke test

1. Entrar com a conta escolar da instituição.
2. Abrir o Monitor.
3. Ativar somente `QA Pickup Smoke`.
4. Confirmar que o aluno aparece em Alunos Disponíveis, com turma `6ma` e matrícula disponível para chamada.
5. Confirmar que nenhum portão vem selecionado.
6. Selecionar explicitamente o portão `Portão`.
7. Clicar em **Chamar**.
8. Confirmar o aluno na fila ativa do Monitor.
9. Abrir a TV da mesma instituição e confirmar o mesmo aluno.
10. Observar o polling sem refresh manual.
11. Em **Confirmar Saída**, concluir o evento.
12. Seguir a restauração.

## Validações de `pickup_events`

Na criação:

- `status = called`;
- `school_id` é a escola da sessão;
- `student_enrollment_id` é a matrícula de `QA-PICKUP-001`;
- `gate_id` é o portão `Portão` selecionado na tela;
- `called_at` preenchido;
- `completed_at` vazio.

Na conclusão:

- o mesmo evento passa de `called` para `completed`;
- `completed_at` preenchido;
- `school_id`, `student_enrollment_id`, `gate_id` e `called_at` permanecem os da criação.

A operação de conclusão não exclui a linha. Nenhuma etapa deste procedimento exclui `pickup_events`.

## Validação do Monitor

- Antes da ativação, `QA Pickup Smoke` não está em Alunos Disponíveis.
- Depois da ativação, o aluno está disponível e a fila ainda não o contém.
- Depois de **Chamar**, o aluno sai dos disponíveis e entra na Fila de Chamada, com o portão `Portão`.
- Depois de **Confirmar Saída**, o aluno sai da fila ativa.
- A fila ativa representa somente `status = called`.

## Validação da TV

- A TV usa a mesma instituição e a mesma fila.
- O aluno chamado aparece sem refresh manual.
- Depois da conclusão, o aluno deixa de aparecer na TV.
- A atualização da TV observa o polling da aplicação.

## Validação do polling

Com Monitor e TV abertos, a entrada na fila e a saída após a conclusão aparecem pelo intervalo da aplicação, de cerca de 5 segundos. Refresh manual não substitui essa observação.

## Validação de seleção explícita do gate

- O controle do aluno abre em “Selecione”.
- **Chamar** permanece indisponível até haver um portão escolhido.
- O portão usado na chamada é `Portão`, escolhido nessa ação.
- O `gate_id` gravado é o desse portão.

Não aceitar seleção automática do primeiro portão.

## Restauração

Ordem obrigatória:

1. Se existir chamada `called` desse fixture, concluir a saída antes de qualquer outra restauração.
2. Confirmar que a fila ativa do Monitor e da TV não mostra o aluno.
3. Inativar `QA Pickup Smoke`.
4. Confirmar `students.status = inactive`.

Preservar:

- o aluno `QA Pickup Smoke`;
- a matrícula `QA-PICKUP-001`;
- o vínculo com a turma `6ma`;
- o portão `Portão`;
- todo `pickup_events` `completed` desse fixture.

## Abortamento

Se o smoke parar no meio:

- chamada já criada: concluir a saída e, em seguida, inativar o fixture;
- aluno apenas ativado, sem chamada: inativar o fixture;
- criação do aluno já concluída e procedimento interrompido antes do registro completo dos IDs: não excluir o aluno, a matrícula, o vínculo nem eventos; se o aluno estiver ativo, restaurá-lo para `inactive`; registrar o estado alcançado e interromper o procedimento.

Continuação depois desse abortamento exige nova autorização humana e uma execução controlada. Não há cleanup por exclusão.

Não excluir aluno, matrícula, turma, portão nem `pickup_events` para encerrar um teste interrompido.

## Verificação pós-teste

- `QA Pickup Smoke` está `inactive`.
- A matrícula continua `QA-PICKUP-001` e a turma continua `6ma`.
- Nenhum `pickup_events` desse fixture está `called`.
- O evento do teste, quando a chamada chegou a ocorrer, está `completed`, com `completed_at` preenchido e a mesma identidade da criação.
- Monitor e TV não listam o aluno na fila ativa.
- A sessão do Monitor não usa `@SmartExit:called:` como fila.
- `TEST-001` e os outros alunos já existentes permanecem como estavam.

## Regras de segurança

- Nunca excluir o fixture.
- Nunca excluir `pickup_events`.
- Nunca usar `TEST-001` nem os outros alunos já existentes.
- Nunca criar uma turma para este smoke.
- Nunca usar SQL, `service_role` ou migration para executar o fluxo.
- Qualquer chamada pendente deve ser concluída antes da restauração.
- Ao final, o fixture deve estar `inactive`.
- Nenhum evento do fixture deve permanecer em `called`.
- Não registrar senha, token, cookie ou chave de serviço neste procedimento nem no relatório do teste.
- Novos fixtures de Production exigem autorização explícita. Este documento autoriza somente `QA Pickup Smoke`.

## Evidências esperadas

O relatório do smoke registra, sem segredos:

| Evidência | Conteúdo |
|---|---|
| Sessão | Instituição Colégio Adventista de Esteio |
| Fixture | Nome `QA Pickup Smoke`, matrícula `QA-PICKUP-001`, turma `6ma` |
| Gate | Portão `Portão` escolhido na tela, sem seleção automática |
| Chamada | `called` e, depois, `completed` no mesmo evento |
| Filas | Monitor e TV mostram o aluno somente enquanto `called` |
| Polling | Atualização sem refresh manual |
| Repouso | Status `inactive` e nenhum `called` restante |
| Preservação | Aluno e eventos `completed` ainda existentes |

## Checklist de aprovação

Todos os itens abaixo ficam atendidos antes de criar o fixture e antes de cada smoke:

- Fixture identificado como `QA Pickup Smoke` / `QA-PICKUP-001`.
- Instituição: Colégio Adventista de Esteio.
- Turma existente: `6ma`. Portão existente: `Portão`.
- Estado de repouso definido como `inactive`.
- Responsável humano definido para a execução.
- Preparação, restauração e abortamento lidos neste documento.
- IDs reais previstos para o inventário depois da criação; nenhum UUID inventado antes disso.
- Confirmado que o fixture permanente não será excluído.
- Confirmado que `pickup_events` concluídos serão preservados.
- Confirmado que `TEST-001` e os demais alunos existentes ficam intocados.
- Confirmado que nenhuma turma nova será criada.
- Confirmado que o fluxo usa a aplicação, sem SQL, `service_role` ou migration.
