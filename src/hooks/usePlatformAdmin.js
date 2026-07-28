import { useContext } from 'react';
import { PlatformAdminContext } from '../contexts/platformAdminContext';

/**
 * Global Platform Admin status (ADR-028).
 * Reflects whether the current Supabase Auth session maps to public.platform_admins.
 */
export function usePlatformAdmin() {
  const { isPlatformAdmin, isLoading, refresh } = useContext(PlatformAdminContext);

  return {
    isPlatformAdmin,
    isLoading,
    refresh
  };
}
