import { useContext } from 'react';
import { PlatformAdminContext } from '../contexts/platformAdminContext';

/**
 * Estado global de Administrador da Plataforma (ADR-028).
 * Indica se a sessão atual do Supabase Auth corresponde a um
 * registro em public.platform_admins.
 */
export function usePlatformAdmin() {
  const { isPlatformAdmin, isLoading, refresh } = useContext(PlatformAdminContext);

  return {
    isPlatformAdmin,
    isLoading,
    refresh
  };
}
