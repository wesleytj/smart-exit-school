import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import InstitutionsManager from "./pages/InstitutionsManager"
import TenantPanelGate from "./pages/TenantPanelGate"
import TvDisplay from "./pages/TvDisplay"
import { PlatformAdminProvider } from "./contexts/PlatformAdminProvider"
import { TenantSessionProvider } from "./contexts/TenantSessionProvider"

export default function App() {

  return (
    <PlatformAdminProvider>
      <TenantSessionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/institutions" element={<InstitutionsManager />} />
            <Route path="/painel" element={<TenantPanelGate />} />
            <Route path="/tv" element={<TvDisplay />} />
          </Routes>
        </BrowserRouter>
      </TenantSessionProvider>
    </PlatformAdminProvider>
  );
}