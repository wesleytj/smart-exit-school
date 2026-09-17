# Governança de dados de QA — Smart Exit School

Política operacional para dados de domínio usados em testes do Platform Admin (instituições / `public.schools`).

**Princípio:** reutilizar antes de criar.

Esta política **não** autoriza cleanup. Inventário vigente: [qa-inventory.md](./qa-inventory.md).

## Onde se aplica

Qualquer ciclo AADS que crie, edite, observe ou exclua instituições no ambiente local de desenvolvimento/QA.

Não se aplica ao seed versionado `smart-exit-dev-school` como dado descartável: esse registro existe para invariantes de `supabase/seed.sql` e do Database Auditor.

## Reutilizar a instituição QA canônica

Antes de criar uma instituição:

1. Ler este documento e o inventário vigente.
2. Localizar o registro designado como candidato/canônico (ID + slug).
3. Reutilizá-lo se o estado atual for compatível com o teste, ou se o teste puder partir do estado observado sem escrita adicional desnecessária.
4. Não criar dado novo só por conveniência.

### Designação canônica

A designação **não é irreversível**. Alterá-la exige decisão humana registrada (Issue/PR que atualize a tabela abaixo e o inventário).

| Papel | Status nesta versão | ID | Slug |
|---|---|---|---|
| Instituição QA canônica | **Candidato condicionado** (não confirmado de forma permanente) | `76f29d9f-c6fd-4561-89f8-403fef0ccb40` | `qa-cursor-escola-teste` |

Critério de promoção a **candidato confirmado** (decisão humana): registro estável para reuso no Platform Admin, sem dados operacionais acoplados que o teste destrua, e com estado inicial documentado no inventário.

Critério de **inadequado**: o registro passou a ser dado de produto, seed ou dependência de outro fluxo, ou sua mutação habitual quebra testes.

## Criação temporária (exceção)

Só é permitido criar instituição temporária quando **pelo menos uma** condição for verdadeira e estiver justificada no Completion Report:

- isolamento necessário (o canônico não pode ser tocado pelo cenário);
- o cenário **é** o de criação;
- o estado inicial do canônico é incompatível e não pode ser assumido sem distorcer o teste;
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

## Relatos obrigatórios

Todo Completion Report de ciclo que toque instituições deve declarar:

- se reutilizou o canônico/candidato (ID);
- se criou temporário (tabela acima);
- se removeu algo (IDs) ou o que foi preservado e por quê.
