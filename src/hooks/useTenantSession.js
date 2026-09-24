import { useContext } from 'react';
import { TenantSessionContext } from '../contexts/tenantSessionContext';

export function useTenantSession() {
  return useContext(TenantSessionContext);
}
