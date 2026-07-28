import { createContext } from 'react';

export const PlatformAdminContext = createContext({
  isPlatformAdmin: false,
  isLoading: true,
  refresh: async () => {}
});
