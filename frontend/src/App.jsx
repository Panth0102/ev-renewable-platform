import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import ProtectedRoute from './components/common/ProtectedRoute.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import AuthLayout from './layouts/AuthLayout.jsx'

// Auth pages
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'

// App pages
import Dashboard from './pages/dashboard/Dashboard.jsx'
import Stations from './pages/stations/Stations.jsx'
import Analytics from './pages/analytics/Analytics.jsx'
import Settings from './pages/settings/Settings.jsx'
import ChargingRequest from './pages/charging/ChargingRequest.jsx'
import Fleet from './pages/fleet/Fleet.jsx'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/stations" element={<Stations />} />
                <Route path="/charging" element={<ChargingRequest />} />
                <Route path="/fleet" element={<Fleet />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
