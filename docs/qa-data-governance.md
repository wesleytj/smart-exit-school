# Governança de dados de QA — Smart Exit School

Política operacional para dados de domínio usados em testes do Platform Admin (instituições / `public.schools`) e para o fixture permanente de smoke em Production.

**Princípio:** reutilizar antes de criar.

Esta política **não** autoriza cleanup. Inventário vigente: [qa-inventory.md](./qa-inventory.md).

O ambiente local é onde dados de instituição podem ser descartáveis. Descartável significa que esses dados podem ser recriados ou resetados conforme a necessidade desse ambiente. Isso não autoriza apagar indiscriminadamente evidências ou registros necessários para testes e documentação. As regras de preservação e de limpeza abaixo continuam valendo. Production não entra nessa categoria. O smoke operacional de Production usa somente fixtures permanentes já autorizados, no procedimento [qa-production-smoke.md](./qa-production-smoke.md).

## Onde se aplica

Qualquer ciclo AADS que crie, edite, observe ou exclua instituições no ambiente local de desenvolvimento/QA.

O fixture `QA Pickup Smoke` em Production segue a seção [Fixtures permanentes de Production](#fixtures-permanentes-de-production). As regras de instituição local não autorizam editar aluno, matrícula, turma ou `pickup_events` em Production.

Não se aplica ao seed versionado `smart-exit-dev-school` como dado descartável: esse registro existe para invariantes de `supabase/seed.sql` e do Database Auditor.

## Reutilizar a instituição QA canônica

Antes de criar uma instituição:

1. Ler este documento e o inventário vigente.
2. Localizar a instituição QA canônica permanente (ID + slug na tabela abaixo).
3. Reutilizá-la se o estado atual for compatível com o teste, ou se o teste puder partir do estado observado sem escrita adicional desnecessária.
4. Não criar dado novo só por conveniência.

A existência da canônica **não** dispensa avaliar o estado exigido por cada cenário.

### Designação canônica

Decisão humana de governança (Issue #45, sucessora da #43 / PR #44). **Não altera o registro no banco:** não autoriza mudar nome, slug, plano, timestamps, relações, grupos acadêmicos, alunos ou qualquer outro atributo.

Reclassificar a canônica no futuro exige nova decisão humana documentada (Issue/PR que atualize esta tabela e o inventário).

| Papel | Status | ID | Slug |
|---|---|---|---|
| Instituição QA canônica permanente | **Confirmada** | `76f29d9f-c6fd-4561-89f8-403fef0ccb40` | `qa-cursor-escola-teste` |

## Criação temporária (exceção)

Só é permitido criar instituição temporária quando **pelo menos uma** condição for verdadeira e estiver justificada no Completion Report:

- isolamento necessário (a canônica não pode ser tocada pelo cenário);
- o cenário **é** o de criação;
- o estado inicial da canônica é incompatível e não pode ser assumido sem distorcer o teste;
- existe justificativa técnica concreta (não “ficou mais fácil”).

Todo dado temporário deve ser registrado no Completion Report:

| Campo | Obrigatório |
|---|---|
| ID | sim |
| nome | sim |
| slug | sim |
| motivo | sim |
| ciclo (Issue/PR) | sim |

## Limpeza

Limpeza **só** após o teste, **somente** se for segura **e** houver autorização humana específica para aqueles IDs.

No Validation/Completion Report: confirmar a remoção (IDs removidos) ou declarar que a remoção não ocorreu.

### Exceção (remoção não feita)

Se a remoção não for segura, possível ou autorizada:

- não excluir;
- reportar ID, nome, slug, motivo da preservação e o bloqueio;
- deixar follow-up humano (não “limpar depois” em silêncio).

## Proibições

- Não excluir registros existentes só pelo nome, slug ou aparência de teste.
- Não alterar `plan`, `slug`, `updated_at`, nome ou status para “preparar” QA sem autorização do work item.
- Não usar `supabase db reset` como substituto de cleanup pontual de QA (reset reescreve o banco local inteiro).
- Não tratar o inventário como lista de exclusão.

## Fixtures permanentes de Production

Production possui fixtures permanentes explicitamente autorizados. Esses registros não são descartáveis. A autorização de um fixture não se estende a outro aluno, outra turma ou outra instituição.

Fixture autorizado:

| Campo | Valor |
|---|---|
| Nome | `QA Pickup Smoke` |
| Matrícula | `QA-PICKUP-001` |
| Instituição | Colégio Adventista de Esteio |
| Turma | `6ma`, já existente |
| Portão | `Portão`, já existente e ativo |
| Repouso | `inactive` fora da janela de teste |
| Estado final do smoke | `inactive`, e nenhum `pickup_events` desse fixture em `called` |
| Procedimento | [qa-production-smoke.md](./qa-production-smoke.md) |

Regras normativas deste fixture:

- O agente não cria o fixture de Production por iniciativa própria.
- A criação de `QA Pickup Smoke` exige autorização humana explícita.
- Ativação, inativação e as demais manipulações desse fixture durante o smoke ocorrem somente dentro do procedimento autorizado.
- SQL, `service_role` e migrations não podem ser usados para criar, alterar, ativar, inativar ou limpar esse fixture.
- A criação do fixture e a execução do smoke usam o fluxo normal da aplicação, pela interface.
- Sem autorização humana explícita, o agente para antes de qualquer alteração em Production.
- `QA Pickup Smoke` permanece depois dos testes.
- Fora da janela de teste, e ao final de cada smoke, o fixture está `inactive`.
- Nenhum `pickup_events` desse fixture permanece com `status = called`.
- `pickup_events` concluídos permanecem como evidência histórica. Conclusão de chamada não é limpeza por exclusão.
- Novos fixtures de Production exigem autorização explícita documentada antes de qualquer escrita.
- `TEST-001` e os demais alunos já existentes nessa instituição não fazem parte deste procedimento e permanecem intocados.
- Este procedimento não cria turma, não altera schema e não altera RLS.

## Relatos obrigatórios

Todo Completion Report de ciclo que toque instituições deve declarar:

- se reutilizou a canônica (ID);
- se criou temporário (tabela acima);
- se removeu algo (IDs) ou o que foi preservado e por quê.
