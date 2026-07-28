import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import InstitutionsManager from "./pages/InstitutionsManager"
import InstitutionPanel from "./pages/InstitutionPanel"
import TvDisplay from "./pages/TvDisplay"
import { PlatformAdminProvider } from "./contexts/PlatformAdminProvider"

export default function App() {

  return (
    <PlatformAdminProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/institutions" element={<InstitutionsManager />} />

          {/* O InstitutionPanel vai se virar sozinho com as cores agora! */}
          <Route path="/painel" element={<InstitutionPanel />} />

          <Route path="/tv" element={<TvDisplay />} />
        </Routes>
      </BrowserRouter>
    </PlatformAdminProvider>
  );
}