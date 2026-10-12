/**
 * pickupCallFilter.js
 *
 * Módulo de lógica pura para ordenação e filtros da fila de chamadas de saída.
 * Implementa filtragem, ordenação e persistência local (localStorage) isolada.
 *
 * Regras:
 * - Funções de ordenação e filtros são estritamente puras (sem I/O, sem Date.now(), sem Math.random()).
 * - Imutabilidade garantida: nunca mutam arrays de entrada.
 * - Side-effects restritos a loadFilters/saveFilters/clearFilters com injeção de storage para testes.
 */

export const SORT_OPTIONS = [
  { value: 'fifo', label: 'Mais antiga primeiro' },
  { value: 'lifo', label: 'Mais recente primeiro' },
  { value: 'name_asc', label: 'Nome do aluno (A-Z)' },
  { value: 'class_asc', label: 'Turma (A-Z)' }
];

export const VALID_SORT_KEYS = ['fifo', 'lifo', 'name_asc', 'class_asc'];

export const STORAGE_KEY_PREFIX = 'ses:pickup:filters:';

function getDefaultStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return null;
}

export function getFilterStorageKey(schoolId) {
  return `${STORAGE_KEY_PREFIX}${schoolId}`;
}

/**
 * Retorna o estado padrão inicial dos filtros e ordenação.
 */
export function defaultFilters() {
  return {
    search: '',
    gate: '',
    classGroup: '',
    sortBy: 'fifo'
  };
}

/**
 * Verifica se há filtros ativos que diferem do padrão.
 */
export function hasActiveFilters(filters) {
  if (!filters) return false;
  const hasSearch = Boolean(filters.search && filters.search.trim().length > 0);
  const hasGate = Boolean(filters.gate && filters.gate.trim().length > 0);
  const hasClass = Boolean(filters.classGroup && filters.classGroup.trim().length > 0);
  const hasNonDefaultSort = Boolean(filters.sortBy && filters.sortBy !== 'fifo');

  return hasSearch || hasGate || hasClass || hasNonDefaultSort;
}

/**
 * Aplica filtros em memória sobre a lista de chamadas ativas.
 * Retorna um novo array sem mutar o original.
 *
 * @param {Array} calls Lista de chamadas
 * @param {Object} filters Configuração de filtros { search, gate, classGroup }
 * @returns {Array} Chamadas filtradas
 */
export function applyFilters(calls, filters) {
  if (!Array.isArray(calls)) {
    return [];
  }

  if (!filters) {
    return [...calls];
  }

  const search = (filters.search || '').trim().toLowerCase();
  const gate = (filters.gate || '').trim();
  const classGroup = (filters.classGroup || '').trim();

  if (!search && !gate && !classGroup) {
    return [...calls];
  }

  return calls.filter((call) => {
    if (search) {
      const name = (call?.name || '').toLowerCase();
      if (!name.includes(search)) {
        return false;
      }
    }

    if (gate) {
      const gateName = (call?.gateName || '').trim();
      if (gateName !== gate) {
        return false;
      }
    }

    if (classGroup) {
      const groupName = (call?.grade || '').trim();
      if (groupName !== classGroup) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Ordena chamadas ativas com base no critério selecionado.
 * Retorna um novo array ordenado sem mutar o original.
 *
 * @param {Array} calls Lista de chamadas
 * @param {string} sortBy Critério: 'fifo' | 'lifo' | 'name_asc' | 'class_asc'
 * @returns {Array} Chamadas ordenadas
 */
export function applySort(calls, sortBy = 'fifo') {
  if (!Array.isArray(calls)) {
    return [];
  }

  const copy = [...calls];
  const validSort = VALID_SORT_KEYS.includes(sortBy) ? sortBy : 'fifo';

  switch (validSort) {
    case 'lifo':
      return copy.sort((a, b) => {
        const timeA = new Date(a?.calledAt || 0).getTime();
        const timeB = new Date(b?.calledAt || 0).getTime();
        return timeB - timeA;
      });

    case 'name_asc':
      return copy.sort((a, b) => {
        const nameA = a?.name || '';
        const nameB = b?.name || '';
        return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
      });

    case 'class_asc':
      return copy.sort((a, b) => {
        const gradeA = a?.grade || '';
        const gradeB = b?.grade || '';
        return gradeA.localeCompare(gradeB, 'pt-BR', { sensitivity: 'base' });
      });

    case 'fifo':
    default:
      return copy.sort((a, b) => {
        const timeA = new Date(a?.calledAt || 0).getTime();
        const timeB = new Date(b?.calledAt || 0).getTime();
        return timeA - timeB;
      });
  }
}

/**
 * Extrai lista única e ordenada de portões com chamadas ativas.
 *
 * @param {Array} calls Lista de chamadas
 * @returns {Array<string>} Lista de nomes de portão
 */
export function getAvailableGates(calls) {
  if (!Array.isArray(calls)) {
    return [];
  }

  const unique = new Set();
  for (const call of calls) {
    if (call?.gateName && typeof call.gateName === 'string') {
      const trimmed = call.gateName.trim();
      if (trimmed) {
        unique.add(trimmed);
      }
    }
  }

  return Array.from(unique).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
}

/**
 * Extrai lista única e ordenada de turmas com chamadas ativas.
 *
 * @param {Array} calls Lista de chamadas
 * @returns {Array<string>} Lista de nomes de turma
 */
export function getAvailableClasses(calls) {
  if (!Array.isArray(calls)) {
    return [];
  }

  const unique = new Set();
  for (const call of calls) {
    if (call?.grade && typeof call.grade === 'string') {
      const trimmed = call.grade.trim();
      if (trimmed) {
        unique.add(trimmed);
      }
    }
  }

  return Array.from(unique).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
}

/**
 * Carrega filtros persistidos no localStorage para uma escola.
 * Resiliente contra ausência de storage, chaves faltantes ou JSON inválido.
 *
 * @param {string} schoolId
 * @param {Storage} [storage] Opcional para mocks
 * @returns {Object} Filtros normalizados
 */
export function loadFilters(schoolId, storage = getDefaultStorage()) {
  const fallback = defaultFilters();
  if (!schoolId || !storage) {
    return fallback;
  }

  try {
    const raw = storage.getItem(getFilterStorageKey(schoolId));
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return fallback;
    }

    return {
      search: typeof parsed.search === 'string' ? parsed.search : '',
      gate: typeof parsed.gate === 'string' ? parsed.gate : '',
      classGroup: typeof parsed.classGroup === 'string' ? parsed.classGroup : '',
      sortBy: VALID_SORT_KEYS.includes(parsed.sortBy) ? parsed.sortBy : 'fifo'
    };
  } catch {
    return fallback;
  }
}

/**
 * Salva filtros no localStorage para uma escola.
 *
 * @param {string} schoolId
 * @param {Object} filters
 * @param {Storage} [storage] Opcional para mocks
 * @returns {boolean} True se persistido com sucesso
 */
export function saveFilters(schoolId, filters, storage = getDefaultStorage()) {
  if (!schoolId || !storage) {
    return false;
  }

  try {
    const payload = {
      search: typeof filters?.search === 'string' ? filters.search : '',
      gate: typeof filters?.gate === 'string' ? filters.gate : '',
      classGroup: typeof filters?.classGroup === 'string' ? filters.classGroup : '',
      sortBy: VALID_SORT_KEYS.includes(filters?.sortBy) ? filters.sortBy : 'fifo'
    };

    storage.setItem(getFilterStorageKey(schoolId), JSON.stringify(payload));
    return true;
  } catch (error) {
    console.warn('[pickupCallFilter] Falha ao persistir filtros no localStorage:', error);
    return false;
  }
}

/**
 * Remove filtros persistidos no localStorage para uma escola.
 *
 * @param {string} schoolId
 * @param {Storage} [storage] Opcional para mocks
 * @returns {Object} Retorna defaultFilters
 */
export function clearFilters(schoolId, storage = getDefaultStorage()) {
  if (schoolId && storage?.removeItem) {
    try {
      storage.removeItem(getFilterStorageKey(schoolId));
    } catch {
      // Ignora erro de remoção e retorna default
    }
  }
  return defaultFilters();
}
