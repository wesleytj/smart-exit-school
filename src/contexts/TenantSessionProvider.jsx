import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { tenantSessionService } from '../services/tenantSessionService';
import { resolveTenantAccess } from '../services/tenantAccess';
import { TenantSessionContext } from './tenantSessionContext';

export function TenantSessionProvider({ children }) {
  const [status, setStatus] = useState('loading');
  const [school, setSchool] = useState(null);
  const [schools, setSchools] = useState([]);
  const [accountEmail, setAccountEmail] = useState('');
  const selectedSchoolIdRef = useRef(null);
  const userIdRef = useRef(null);

  async function resolveFromSession(session) {
    const userId = session?.user?.id ?? null;

    if (userId !== userIdRef.current) {
      userIdRef.current = userId;
      selectedSchoolIdRef.current = null;
    }

    if (!userId) {
      setStatus('anonymous');
      setSchool(null);
      setSchools([]);
      setAccountEmail('');
      return { status: 'anonymous', school: null, schools: [] };
    }

    setAccountEmail(session.user.email || '');

    try {
      const loaded = await tenantSessionService.loadActiveSchools();

      if (loaded.error) {
        console.error(loaded.error);
        setStatus('error');
        setSchool(null);
        setSchools([]);
        return { status: 'error', school: null, schools: [] };
      }

      const decision = resolveTenantAccess({
        memberships: loaded.memberships,
        schools: loaded.schools,
        selectedSchoolId: selectedSchoolIdRef.current
      });

      if (decision.status !== 'ready') {
        selectedSchoolIdRef.current = null;
      }

      setStatus(decision.status);
      setSchool(decision.school);
      setSchools(decision.schools);
      return decision;
    } catch (error) {
      console.error(error);
      setStatus('error');
      setSchool(null);
      setSchools([]);
      return { status: 'error', school: null, schools: [] };
    }
  }

  async function refresh() {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error(error);
      setStatus('error');
      setSchool(null);
      setSchools([]);
      return { status: 'error', school: null, schools: [] };
    }

    return await resolveFromSession(session);
  }

  async function selectSchool(schoolId) {
    selectedSchoolIdRef.current = schoolId;
    return await refresh();
  }

  useEffect(() => {
    let isMounted = true;

    void supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) {
        return;
      }

      if (error) {
        console.error(error);
        setStatus('error');
        setSchool(null);
        setSchools([]);
        return;
      }

      void resolveFromSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void resolveFromSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <TenantSessionContext.Provider
      value={{
        status,
        isLoading: status === 'loading',
        school,
        schools,
        accountEmail,
        selectSchool,
        refresh
      }}
    >
      {children}
    </TenantSessionContext.Provider>
  );
}
