import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatformAdmin } from '../hooks/usePlatformAdmin';
import { useTenantSession } from '../hooks/useTenantSession';
import { authService } from '../services/authService';
import { resolveTenantPanelAccess } from '../services/tenantAccess';
import InstitutionPanel from './InstitutionPanel';

export default function TenantPanelGate() {
  const navigate = useNavigate();
  const { isPlatformAdmin, isLoading: isPlatformAdminLoading } = usePlatformAdmin();
  const {
    status,
    isLoading: isTenantLoading,
    schools,
    selectSchool
  } = useTenantSession();
  const signedOutRef = useRef(false);
  const platformAuthorityPending = isPlatformAdminLoading || isTenantLoading || status === 'loading';
  const access = platformAuthorityPending
    ? null
    : resolveTenantPanelAccess({ isPlatformAdmin, tenantStatus: status });

  useEffect(() => {
    if (platformAuthorityPending) {
      return;
    }

    const decision = resolveTenantPanelAccess({ isPlatformAdmin, tenantStatus: status });

    if (decision.view === 'panel' || decision.view === 'selection') {
      return;
    }

    if (decision.view === 'platform') {
      navigate(decision.destination, { replace: true });
      return;
    }

    if (decision.signOut) {
      if (signedOutRef.current) {
        return;
      }

      signedOutRef.current = true;
      void authService.logout().then(() => {
        navigate(decision.destination, {
          replace: true,
          state: decision.message ? { authMessage: decision.message } : undefined
        });
      });
      return;
    }

    navigate(decision.destination, {
      replace: true,
      state: decision.message ? { authMessage: decision.message } : undefined
    });
  }, [isPlatformAdmin, navigate, platformAuthorityPending, status]);

  if (!access || access.view === 'platform' || access.view === 'login') {
    return null;
  }

  if (access.view === 'selection') {
    return (
      <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          <h1 className="text-2xl font-bold text-slate-900">Escolha a escola</h1>
          <p className="text-slate-500 text-sm mt-2">
            Sua conta possui mais de um vínculo ativo. Selecione a escola antes de entrar no painel.
          </p>
          <div className="mt-6 space-y-3">
            {schools.map((schoolOption) => (
              <button
                key={schoolOption.id}
                type="button"
                onClick={() => { void selectSchool(schoolOption.id); }}
                className="w-full text-left bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-500 rounded-xl px-4 py-3 transition"
              >
                <span className="block font-semibold text-slate-900">{schoolOption.name}</span>
                <span className="block text-xs text-slate-500 mt-1">{schoolOption.slug}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (access.view !== 'panel') {
    return null;
  }

  return <InstitutionPanel />;
}
