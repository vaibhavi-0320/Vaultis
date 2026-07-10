import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { setNavigate } from './lib/api'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppShell } from './components/AppShell'
import { AuthPage } from './pages/AuthPage'
import { LandingPage } from './pages/LandingPage'
import { DashboardPage } from './pages/DashboardPage'
import { AssetsPage } from './pages/AssetsPage'
import { ContactsPage } from './pages/ContactsPage'
import { WillPage } from './pages/WillPage'
import { TokensPage } from './pages/TokensPage'
import { BeneficiaryPage } from './pages/BeneficiaryPage'
import { ConfirmPage } from './pages/ConfirmPage'
import { SecurityPage } from './pages/SecurityPage'
import NotFound from './pages/NotFound'

const TITLES = {
  '/dashboard': 'Dashboard',
  '/assets': 'Asset Vault',
  '/contacts': 'Trusted Contacts',
  '/will': 'Will Document',
  '/tokens': 'LVT Token Center',
  '/beneficiary': 'Beneficiary Portal',
  '/security': 'Zero-Trust Security'
}

function AppLoadingScreen() {
  return (
    <div className="app-loading-screen">
      <img src="/logo.png" width="64" height="64" alt="VAULTIS" />
      <strong>VAULTIS</strong>
      <span className="loading-pulse-dot" />
    </div>
  )
}

function ProtectedLayout({ children }) {
  const location = useLocation()
  return <AppShell title={TITLES[location.pathname] || 'Vaultis'}>{children}</AppShell>
}

export default function App() {
  const [booting, setBooting] = useState(() => !sessionStorage.getItem('vaultis_boot_complete'))
  const navigate = useNavigate()

  useEffect(() => {
    setNavigate(navigate)
  }, [navigate])

  useEffect(() => {
    if (!booting) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      sessionStorage.setItem('vaultis_boot_complete', 'true')
      setBooting(false)
    }, 1500)

    return () => window.clearTimeout(timeout)
  }, [booting])

  if (booting) {
    return <AppLoadingScreen />
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <DashboardPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/assets"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <AssetsPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contacts"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <ContactsPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/will"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <WillPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tokens"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <TokensPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/security"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <SecurityPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/beneficiary"
        element={
          <ProtectedRoute>
            <BeneficiaryPage />
          </ProtectedRoute>
        }
      />
      <Route path="/confirm/:userId/:contactId/:vote" element={<ConfirmPage />} />
      <Route path="/confirmed" element={<Navigate to="/beneficiary" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
