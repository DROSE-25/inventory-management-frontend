import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ForecastsPage from '@/pages/ForecastsPage'; // Додано імпорт
import DashboardLayout from '@/components/layout/DashboardLayout';
import PrivateRoute from '@/components/PrivateRoute';

// Заглушки для майбутніх сторінок (зробимо їх у Day 14+)
const Placeholder = ({ title }: { title: string }) => (
  <div>
    <h1 className="text-2xl font-bold">{title}</h1>
    <p className="text-slate-500 mt-2">Сторінка буде реалізована у наступних днях.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard"  element={<DashboardPage />} />
          <Route path="/products"   element={<Placeholder title="Товари" />} />
          <Route path="/sales"      element={<Placeholder title="Продажі" />} />
          <Route path="/suppliers"  element={<Placeholder title="Постачальники" />} />
          <Route path="/warehouses" element={<Placeholder title="Склади" />} />
          <Route path="/forecasts"  element={<ForecastsPage />} /> {/* Замінено на реальну сторінку */}
          <Route path="/reports"    element={<Placeholder title="Звіти" />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;