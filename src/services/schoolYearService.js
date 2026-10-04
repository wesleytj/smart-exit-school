import { schoolYearRepository } from '../repositories/schoolYearRepository.js';

function requireSchoolId(schoolId) {
  if (!schoolId) {
    return new Error('Escola autorizada ausente.');
  }
  return null;
}

function parseYear(year) {
  const parsed = Number.parseInt(year, 10);
  if (Number.isNaN(parsed) || parsed < 2000 || parsed > 2100) {
    return { year: null, error: new Error('Ano letivo inválido (deve ser entre 2000 e 2100).') };
  }
  return { year: parsed, error: null };
}

function normalizeDates(year, startsAt, endsAt) {
  const start = startsAt ? String(startsAt).slice(0, 10) : `${year}-01-01`;
  const end = endsAt ? String(endsAt).slice(0, 10) : `${year}-12-31`;

  if (start > end) {
    return { startsAt: start, endsAt: end, error: new Error('A data de início deve ser anterior ou igual à data de término.') };
  }

  return { startsAt: start, endsAt: end, error: null };
}

export function mapSchoolYearError(error) {
  if (!error) {
    return null;
  }

  const code = String(error.code || '');
  const message = String(error.message || '');
  const details = String(error.details || '');
  const combined = `${message} ${details}`;

  if (code === '23505' && combined.includes('school_years_one_active_per_school')) {
    return new Error('Já existe um ano letivo ativo para esta escola.');
  }

  if (code === '23505' && (combined.includes('school_years_school_year_unique') || combined.includes('school_years_pkey'))) {
    return new Error('Já existe um ano letivo cadastrado com este ano.');
  }

  if (code === '23514' && combined.includes('school_years_year_range_check')) {
    return new Error('A data de início deve ser anterior ou igual à data de término.');
  }

  return error;
}

export const schoolYearService = {
  async listYears(schoolId) {
    const schoolError = requireSchoolId(schoolId);
    if (schoolError) {
      return { data: [], error: schoolError };
    }

    const { data, error } = await schoolYearRepository.listBySchool(schoolId);
    if (error) {
      return { data: [], error: mapSchoolYearError(error) };
    }

    return { data: data || [], error: null };
  },

  async getActiveYear(schoolId) {
    const schoolError = requireSchoolId(schoolId);
    if (schoolError) {
      return { data: null, error: schoolError };
    }

    const { data, error } = await schoolYearRepository.getActive(schoolId);
    if (error) {
      return { data: null, error: mapSchoolYearError(error) };
    }

    return { data: data ?? null, error: null };
  },

  async createYear(schoolId, { year, startsAt, endsAt, isActive = false }) {
    const schoolError = requireSchoolId(schoolId);
    if (schoolError) {
      return { data: null, error: schoolError };
    }

    const parsed = parseYear(year);
    if (parsed.error) {
      return { data: null, error: parsed.error };
    }

    const dates = normalizeDates(parsed.year, startsAt, endsAt);
    if (dates.error) {
      return { data: null, error: dates.error };
    }

    const shouldActivate = Boolean(isActive);

    const { data, error } = await schoolYearRepository.create({
      school_id: schoolId,
      year: parsed.year,
      starts_at: dates.startsAt,
      ends_at: dates.endsAt,
      is_active: false
    });

    if (error || !data) {
      return { data: null, error: mapSchoolYearError(error) };
    }

    if (shouldActivate) {
      const activated = await schoolYearRepository.activate(data.id, schoolId);
      if (activated.error) {
        return { data, error: mapSchoolYearError(activated.error) };
      }
      return { data: activated.data, error: null };
    }

    return { data, error: null };
  },

  async activateYear(schoolId, id) {
    const schoolError = requireSchoolId(schoolId);
    if (schoolError) {
      return { data: null, error: schoolError };
    }

    if (!id) {
      return { data: null, error: new Error('Ano letivo inválido.') };
    }

    const { data, error } = await schoolYearRepository.activate(id, schoolId);
    if (error) {
      return { data: null, error: mapSchoolYearError(error) };
    }

    return { data: data ?? null, error: null };
  }
};
