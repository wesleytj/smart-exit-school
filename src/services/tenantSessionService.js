import { schoolMemberRepository } from '../repositories/schoolMemberRepository';
import { schoolRepository } from '../repositories/schoolRepository';

const TENANT_SCHOOL_COLUMNS = 'id, name, slug, status, plan, primary_color, secondary_color, logo_url, locale';

export const tenantSessionService = {
  async loadActiveSchools() {
    const { data: memberships, error: membershipError } = await schoolMemberRepository.listActiveForSession();

    if (membershipError) {
      return { memberships: [], schools: [], error: membershipError };
    }

    const schoolIds = [...new Set((memberships || []).map((membership) => membership.school_id).filter(Boolean))];

    if (schoolIds.length === 0) {
      return { memberships: memberships || [], schools: [], error: null };
    }

    const { data: schools, error: schoolError } = await schoolRepository.getByIds(schoolIds, TENANT_SCHOOL_COLUMNS);

    if (schoolError) {
      return { memberships: memberships || [], schools: [], error: schoolError };
    }

    return { memberships: memberships || [], schools: schools || [], error: null };
  }
};
