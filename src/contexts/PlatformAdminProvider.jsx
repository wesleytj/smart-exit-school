import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { platformAdminService } from '../services/platformAdminService';
import { isSameUserRevalidation } from '../services/platformAdminResolution';
import { PlatformAdminContext } from './platformAdminContext';

export function PlatformAdminProvider({ children }) {
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const resolvedUserIdRef = useRef(null);

  async function resolveFromSession(session) {
    const userId = session?.user?.id ?? null;
    const background = isSameUserRevalidation(resolvedUserIdRef.current, userId);

    if (!background) {
      setIsLoading(true);
    }

    try {
      if (!userId) {
        resolvedUserIdRef.current = null;
        setIsPlatformAdmin(false);
        return;
      }

      const result = await platformAdminService.isPlatformAdmin(userId);
      resolvedUserIdRef.current = userId;
      setIsPlatformAdmin(result);
    } catch (error) {
      console.error(error);
      if (!background) {
        resolvedUserIdRef.current = null;
        setIsPlatformAdmin(false);
      }
    } finally {
      if (!background) {
        setIsLoading(false);
      }
    }
  }

  async function refresh() {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    if (error) {
      console.error(error);
      setIsPlatformAdmin(false);
      setIsLoading(false);
      return;
    }

    await resolveFromSession(session);
  }

  useEffect(() => {
    let isMounted = true;

    void supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) {
        return;
      }

      if (error) {
        console.error(error);
        setIsPlatformAdmin(false);
        setIsLoading(false);
        return;
      }

      void resolveFromSession(session);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void resolveFromSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <PlatformAdminContext.Provider
      value={{
        isPlatformAdmin,
        isLoading,
        refresh
      }}
    >
      {children}
    </PlatformAdminContext.Provider>
  );
}
