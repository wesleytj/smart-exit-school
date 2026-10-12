import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  defaultFilters,
  hasActiveFilters,
  applyFilters,
  applySort,
  getAvailableGates,
  getAvailableClasses,
  loadFilters,
  saveFilters,
  clearFilters,
  getFilterStorageKey
} from './pickupCallFilter.js';

const mockCalls = [
  {
    id: 'call-1',
    name: 'Bernardo Lima',
    grade: '3º Ano B',
    gateName: 'Portão Principal',
    calledAt: '2026-10-12T14:10:00.000Z'
  },
  {
    id: 'call-2',
    name: 'Alice Santos',
    grade: '5º Ano A',
    gateName: 'Portão Infantil',
    calledAt: '2026-10-12T14:05:00.000Z'
  },
  {
    id: 'call-3',
    name: 'Carlos Alberto',
    grade: '3º Ano B',
    gateName: 'Portão Principal',
    calledAt: '2026-10-12T14:20:00.000Z'
  },
  {
    id: 'call-4',
    name: 'alicia mendes',
    grade: '1º Ano C',
    gateName: 'Portão Lateral',
    calledAt: '2026-10-12T14:15:00.000Z'
  }
];

function createMockStorage() {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    get size() {
      return store.size;
    }
  };
}

describe('pickupCallFilter — defaultFilters e hasActiveFilters', () => {
  it('defaultFilters retorna estado inicial consistente', () => {
    const filters = defaultFilters();
    assert.deepEqual(filters, {
      search: '',
      gate: '',
      classGroup: '',
      sortBy: 'fifo'
    });
  });

  it('hasActiveFilters detecta ausência ou presença de filtros ativos', () => {
    assert.equal(hasActiveFilters(defaultFilters()), false);
    assert.equal(hasActiveFilters(null), false);
    assert.equal(hasActiveFilters({ search: '  ' }), false);

    assert.equal(hasActiveFilters({ search: 'Ana' }), true);
    assert.equal(hasActiveFilters({ gate: 'Portão 1' }), true);
    assert.equal(hasActiveFilters({ classGroup: '5A' }), true);
    assert.equal(hasActiveFilters({ sortBy: 'lifo' }), true);
    assert.equal(hasActiveFilters({ sortBy: 'name_asc' }), true);
  });
});

describe('pickupCallFilter — applyFilters', () => {
  it('busca por nome (case-insensitive, partial match)', () => {
    const result1 = applyFilters(mockCalls, { search: 'ali' });
    assert.equal(result1.length, 2);
    assert.deepEqual(result1.map((c) => c.id), ['call-2', 'call-4']);

    const result2 = applyFilters(mockCalls, { search: 'BERNARDO' });
    assert.equal(result2.length, 1);
    assert.equal(result2[0].id, 'call-1');
  });

  it('filtro por portão (exato)', () => {
    const result = applyFilters(mockCalls, { gate: 'Portão Principal' });
    assert.equal(result.length, 2);
    assert.deepEqual(result.map((c) => c.id), ['call-1', 'call-3']);
  });

  it('filtro por turma (exato)', () => {
    const result = applyFilters(mockCalls, { classGroup: '3º Ano B' });
    assert.equal(result.length, 2);
    assert.deepEqual(result.map((c) => c.id), ['call-1', 'call-3']);
  });

  it('combinação de múltiplos filtros (AND)', () => {
    const result = applyFilters(mockCalls, {
      search: 'Carlos',
      gate: 'Portão Principal',
      classGroup: '3º Ano B'
    });
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'call-3');

    const mismatch = applyFilters(mockCalls, {
      search: 'Carlos',
      gate: 'Portão Infantil'
    });
    assert.equal(mismatch.length, 0);
  });

  it('filtros vazios retornam todas as chamadas', () => {
    const result = applyFilters(mockCalls, defaultFilters());
    assert.equal(result.length, mockCalls.length);
    assert.deepEqual(result, mockCalls);

    const withNull = applyFilters(mockCalls, null);
    assert.equal(withNull.length, mockCalls.length);

    const withUndefinedCalls = applyFilters(undefined, null);
    assert.deepEqual(withUndefinedCalls, []);
  });

  it('imutabilidade: não muta o array de entrada', () => {
    const original = [...mockCalls];
    const filtered = applyFilters(original, { search: 'Alice' });

    assert.notStrictEqual(filtered, original);
    assert.equal(original.length, 4);
    assert.equal(original[0].id, 'call-1');
  });
});

describe('pickupCallFilter — applySort', () => {
  it('FIFO (called_at ascendente — mais antiga primeiro)', () => {
    const sorted = applySort(mockCalls, 'fifo');
    assert.deepEqual(sorted.map((c) => c.id), ['call-2', 'call-1', 'call-4', 'call-3']);
  });

  it('LIFO (called_at descendente — mais recente primeiro)', () => {
    const sorted = applySort(mockCalls, 'lifo');
    assert.deepEqual(sorted.map((c) => c.id), ['call-3', 'call-4', 'call-1', 'call-2']);
  });

  it('nome A-Z (alfabético com suporte a pt-BR)', () => {
    const sorted = applySort(mockCalls, 'name_asc');
    assert.deepEqual(sorted.map((c) => c.id), ['call-2', 'call-4', 'call-1', 'call-3']);
  });

  it('turma A-Z', () => {
    const sorted = applySort(mockCalls, 'class_asc');
    // '1º Ano C', '3º Ano B', '3º Ano B', '5º Ano A'
    assert.equal(sorted[0].id, 'call-4');
    assert.equal(sorted[3].id, 'call-2');
  });

  it('fallback para FIFO com critério desconhecido', () => {
    const sorted = applySort(mockCalls, 'invalid_sort');
    assert.deepEqual(sorted.map((c) => c.id), ['call-2', 'call-1', 'call-4', 'call-3']);
  });

  it('imutabilidade: não muta o array de entrada', () => {
    const original = [...mockCalls];
    const sorted = applySort(original, 'lifo');

    assert.notStrictEqual(sorted, original);
    assert.equal(original[0].id, 'call-1');
  });

  it('estabilidade de ordenação: chamadas empatadas mantêm ordem relativa', () => {
    const ties = [
      { id: 'tie-1', name: 'Zeca', calledAt: '2026-10-12T14:00:00.000Z' },
      { id: 'tie-2', name: 'Zeca', calledAt: '2026-10-12T14:00:00.000Z' },
      { id: 'tie-3', name: 'Zeca', calledAt: '2026-10-12T14:00:00.000Z' }
    ];

    const sortedName = applySort(ties, 'name_asc');
    assert.deepEqual(sortedName.map((c) => c.id), ['tie-1', 'tie-2', 'tie-3']);

    const sortedFifo = applySort(ties, 'fifo');
    assert.deepEqual(sortedFifo.map((c) => c.id), ['tie-1', 'tie-2', 'tie-3']);
  });
});

describe('pickupCallFilter — getAvailableGates e getAvailableClasses', () => {
  it('getAvailableGates retorna lista única e ordenada', () => {
    const gates = getAvailableGates(mockCalls);
    assert.deepEqual(gates, ['Portão Infantil', 'Portão Lateral', 'Portão Principal']);

    assert.deepEqual(getAvailableGates([]), []);
    assert.deepEqual(getAvailableGates(null), []);
  });

  it('getAvailableClasses retorna lista única e ordenada', () => {
    const classes = getAvailableClasses(mockCalls);
    assert.deepEqual(classes, ['1º Ano C', '3º Ano B', '5º Ano A']);

    assert.deepEqual(getAvailableClasses([]), []);
    assert.deepEqual(getAvailableClasses(null), []);
  });
});

describe('pickupCallFilter — loadFilters, saveFilters e clearFilters', () => {
  const schoolId = 'school-xyz-123';

  it('loadFilters/saveFilters round-trip com storage mockado preserva dados', () => {
    const storage = createMockStorage();
    const custom = {
      search: 'Lucas',
      gate: 'Portão Lateral',
      classGroup: '2º B',
      sortBy: 'name_asc'
    };

    const saved = saveFilters(schoolId, custom, storage);
    assert.equal(saved, true);

    const loaded = loadFilters(schoolId, storage);
    assert.deepEqual(loaded, custom);
  });

  it('loadFilters retorna defaultFilters quando chave é inexistente', () => {
    const storage = createMockStorage();
    const loaded = loadFilters(schoolId, storage);
    assert.deepEqual(loaded, defaultFilters());
  });

  it('loadFilters é resiliente a JSON inválido ou corrompido', () => {
    const storage = createMockStorage();
    storage.setItem(getFilterStorageKey(schoolId), '{invalid-json');

    const loaded = loadFilters(schoolId, storage);
    assert.deepEqual(loaded, defaultFilters());
  });

  it('loadFilters sanitiza valores desconhecidos e campos faltando', () => {
    const storage = createMockStorage();
    storage.setItem(getFilterStorageKey(schoolId), JSON.stringify({
      sortBy: 'unsupported_mode',
      search: 12345
    }));

    const loaded = loadFilters(schoolId, storage);
    assert.equal(loaded.sortBy, 'fifo');
    assert.equal(loaded.search, '');
  });

  it('clearFilters remove chave e retorna defaultFilters', () => {
    const storage = createMockStorage();
    saveFilters(schoolId, { search: 'Test', sortBy: 'lifo' }, storage);
    assert.equal(storage.size, 1);

    const cleared = clearFilters(schoolId, storage);
    assert.deepEqual(cleared, defaultFilters());
    assert.equal(storage.size, 0);
  });

  it('retorna defaultFilters se schoolId ou storage forem nulos', () => {
    assert.deepEqual(loadFilters(null, null), defaultFilters());
    assert.equal(saveFilters(null, {}, null), false);
  });
});
