import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/common/Header';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { TerritoryBattle } from './pages/TerritoryBattle';
import { Squads } from './pages/Squads';
import { SquadDetail } from './pages/SquadDetail';
import { SquadCreate } from './pages/SquadCreate';
import { MissionDetail } from './pages/MissionDetail';
import { Admin } from './pages/Admin';
import { useAuthStore } from './store/authStore';

function App() {
  const { checkAuth } = useAuthStore();

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/tb/:slug" element={<TerritoryBattle />} />
          <Route path="/squads" element={<Squads />} />
          <Route path="/squads/create" element={<SquadCreate />} />
          <Route path="/squads/:id" element={<SquadDetail />} />
          <Route path="/squads/:id/edit" element={<SquadCreate />} />
          <Route path="/mission/:tbSlug/:phaseId/:planetId/:missionId" element={<MissionDetail />} />
          <Route path="/mission/:tbSlug/:phaseId/:planetId/:missionId/squads" element={<MissionDetail />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;