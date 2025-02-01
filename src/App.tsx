import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Users, Calendar, DollarSign, MessageSquare, Settings, ClipboardList } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import { useState, useEffect } from 'react';

// Import existing components
import BookingForm from './components/BookingForm';
import Auth from './components/Auth';

// Import CRM pages
import CustomersPage from './CRMpages/CustomerPage';
import BookingsPage from './CRMpages/BookingsPage';
import FinancesPage from './CRMpages/FinancesPage';
import CommunicationsPage from './CRMpages/CommunicationsPage';
import SettingsPage from './CRMpages/SettingsPage';


// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};


const Layout = ({ children }: { children: React.ReactNode }) => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <NavLink to="/" className="text-xl font-bold text-blue-600 hover:text-blue-700">
              CleanCRM
            </NavLink>
            <div className="flex items-center space-x-4">
              <NavLink 
                to="/new-booking"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                New Booking
              </NavLink>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>
	  
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <NavLink
              to="/customers"
              className={({ isActive }) =>
                `flex items-center px-3 py-4 text-sm font-medium ${
                  isActive
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <Users className="h-5 w-5 mr-2" />
              Customers
            </NavLink>

            <NavLink
              to="/bookings"
              className={({ isActive }) =>
                `flex items-center px-3 py-4 text-sm font-medium ${
                  isActive
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <Calendar className="h-5 w-5 mr-2" />
              Bookings
            </NavLink>

            <NavLink
              to="/finances"
              className={({ isActive }) =>
                `flex items-center px-3 py-4 text-sm font-medium ${
                  isActive
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <DollarSign className="h-5 w-5 mr-2" />
              Finances
            </NavLink>

            <NavLink
              to="/communications"
              className={({ isActive }) =>
                `flex items-center px-3 py-4 text-sm font-medium ${
                  isActive
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Communications
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center px-3 py-4 text-sm font-medium ${
                  isActive
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <Settings className="h-5 w-5 mr-2" />
              Settings
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        
        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/bookings" element={<BookingsPage />} />
                  <Route path="/finances" element={<FinancesPage />} />
                  <Route path="/communications" element={<CommunicationsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/new-booking" element={<BookingForm />} />
                  <Route path="/" element={<Navigate to="/customers" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
export default App;