import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ExpenseSyncProvider } from './context/ExpenseSyncContext.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import GuestOnly from './components/GuestOnly.jsx';
import AuthPage from './pages/AuthPage.jsx';
import HomePage from './pages/HomePage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import CreateSetPage from './pages/CreateSetPage.jsx';
import ExpenseTypePage from './pages/ExpenseTypePage.jsx';
import CategoriesPage from './pages/CategoriesPage.jsx';
import CreateCategoryPage from './pages/CreateCategoryPage.jsx';
import CreateExpensePage from './pages/CreateExpensePage.jsx';
import ViewExpensesPage from './pages/ViewExpensesPage.jsx';

function App() {
  return (
    <AuthProvider>
      <ExpenseSyncProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route
              path="/auth"
              element={(
                <GuestOnly>
                  <AuthPage />
                </GuestOnly>
              )}
            />
            <Route
              path="/"
              element={(
                <RequireAuth>
                  <HomePage />
                </RequireAuth>
              )}
            />
            <Route
              path="/groups"
              element={(
                <RequireAuth>
                  <HomePage />
                </RequireAuth>
              )}
            />
            <Route
              path="/profile"
              element={(
                <RequireAuth>
                  <ProfilePage />
                </RequireAuth>
              )}
            />
            <Route
              path="/sets/new"
              element={(
                <RequireAuth>
                  <CreateSetPage />
                </RequireAuth>
              )}
            />
            <Route
              path="/sets/:setId/types"
              element={(
                <RequireAuth>
                  <ExpenseTypePage />
                </RequireAuth>
              )}
            />
            <Route
              path="/sets/:setId/categories/:typeKey"
              element={(
                <RequireAuth>
                  <CategoriesPage />
                </RequireAuth>
              )}
            />
            <Route
              path="/sets/:setId/categories/:typeKey/new"
              element={(
                <RequireAuth>
                  <CreateCategoryPage />
                </RequireAuth>
              )}
            />
            <Route
              path="/sets/:setId/categories/:typeKey/:categoryId/expense/new"
              element={(
                <RequireAuth>
                  <CreateExpensePage />
                </RequireAuth>
              )}
            />
            <Route
              path="/sets/:setId/view"
              element={(
                <RequireAuth>
                  <ViewExpensesPage />
                </RequireAuth>
              )}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ExpenseSyncProvider>
    </AuthProvider>
  );
}

export default App;
