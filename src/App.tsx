import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ProductsPage from '@/pages/ProductsPage';
import SuppliersPage from '@/pages/SuppliersPage';
import ForecastsPage from '@/pages/ForecastsPage';
import WarehousesPage from '@/pages/WarehousesPage';
import SalesPage from '@/pages/SalesPage';
import UsersPage from '@/pages/UsersPage'; // Додано
import DashboardLayout from '@/components/layout/DashboardLayout';
import PrivateRoute from '@/components/PrivateRoute';
import ReportsPage from '@/pages/ReportsPage';

// Заглушки для майбутніх сторінок
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
          <Route path="/products"   element={<ProductsPage />} />
          <Route path="/suppliers"  element={<SuppliersPage />} />
          <Route path="/sales"      element={<SalesPage />} />
          <Route path="/warehouses" element={<WarehousesPage />} />
          <Route path="/forecasts"  element={<ForecastsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          
          {/* Додано маршрут для користувачів з перевіркою ролі */}
          <Route 
            path="/users" 
            element={
              <PrivateRoute requiredRole="ROLE_ADMIN">
                <UsersPage />
              </PrivateRoute>
            } 
          />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;