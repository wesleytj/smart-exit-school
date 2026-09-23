import { createContext } from 'react';

export const TenantSessionContext = createContext({
  status: 'loading',
  isLoading: true,
  school: null,
  schools: [],
  accountEmail: '',
  selectSchool: async () => {},
  refresh: async () => {}
});
