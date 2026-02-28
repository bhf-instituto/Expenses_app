import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from './services/api';
import { storage } from './services/storage';
import { useConnectivity } from './hooks/useConnectivity';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ExpenseTypePage from './pages/ExpenseTypePage';
import CategoriesPage from './pages/CategoriesPage';
import ExpenseFormPage from './pages/ExpenseFormPage';
import CreateSetPage from './pages/CreateSetPage';
import CreateCategoryPage from './pages/CreateCategoryPage';
import ViewExpensesPage from './pages/ViewExpensesPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  const [auth, setAuth] = useState(storage.getAuth());
  const [syncing, setSyncing] = useState(false);
  const isOnline = useConnectivity();

  useEffect(() => {
    storage.setAuth(auth);
  }, [auth]);

  useEffect(() => {
    if (!isOnline) return;
    const pending = storage.getOfflineQueue();
    if (!pending.length) return;

    const sync = async () => {
      setSyncing(true);
      const stillPending = [];
      for (const item of pending) {
        try {
          await api.createExpense(item.setId, item.payload);
        } catch {
          stillPending.push(item);
        }
      }
      storage.setOfflineQueue(stillPending);
      setSyncing(false);
    };

    sync();
  }, [isOnline]);

  const shared = { auth, setAuth, isOnline, syncing };

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage {...shared} />} />
      <Route path="/" element={auth ? <HomePage {...shared} /> : <Navigate to="/auth" replace />} />
      <Route path="/profile" element={<ProfilePage {...shared} />} />
      <Route path="/sets/new" element={<CreateSetPage {...shared} />} />
      <Route path="/sets/:setId/types" element={<ExpenseTypePage {...shared} />} />
      <Route path="/sets/:setId/categories/:expenseType" element={<CategoriesPage {...shared} />} />
      <Route path="/sets/:setId/categories/new/:expenseType" element={<CreateCategoryPage {...shared} />} />
      <Route path="/sets/:setId/new-expense/:categoryId/:expenseType" element={<ExpenseFormPage {...shared} />} />
      <Route path="/sets/:setId/view" element={<ViewExpensesPage {...shared} />} />
      <Route path="*" element={<Navigate to={auth ? '/' : '/auth'} replace />} />
    </Routes>
  );
}
