import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { useAuth } from './auth/context';
import { Layout } from './components/Layout';
import { PrefsProvider } from './components/PrefsProvider';
import { ToastProvider } from './components/ToastProvider';
import { Spinner } from './components/ui';
import { Dashboard } from './pages/Dashboard';
import { Enquiries } from './pages/Enquiries';
import { Landlords } from './pages/Landlords';
import { Listings } from './pages/Listings';
import { Login } from './pages/Login';

function Routing() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="boot">
        <Spinner label="Checking your session" />
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="listings" element={<Listings />} />
        <Route path="landlords" element={<Landlords />} />
        <Route path="enquiries" element={<Enquiries />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <PrefsProvider>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routing />
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </PrefsProvider>
  );
}
