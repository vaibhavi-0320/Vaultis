import { Eye, EyeOff, LoaderCircle, LockKeyhole, BellRing, Link2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser, registerUser } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useTheme } from '../contexts/ThemeContext'
import { VaultisBrand } from '../components/VaultisBrand'
import { WalletConnectButton } from '../components/WalletConnectButton'
import { useWallet } from '../context/useWallet'

function validate(mode, values) {
  const next = {}
  if (mode === 'register') {
    if (!values.name.trim() || values.name.trim().length < 2) next.name = 'Name must be at least 2 characters.'
  }
  if (!/^\S+@\S+\.\S+$/.test(values.email)) next.email = 'Enter a valid email address.'
  if (mode === 'register') {
    if ((values.password || '').length < 6) next.password = 'Use at least 6 characters.'
  } else if (!values.password) {
    next.password = 'Enter your password.'
  }
  if (mode === 'register' && values.confirmPassword !== values.password) next.confirmPassword = 'Passwords must match.'
  return next
}

export function AuthPage({ mode: initialMode }) {
  const navigate = useNavigate()
  const { completeAuth } = useAuth()
  const { connectedWallet, walletAddress } = useWallet()
  const { pushToast } = useToast()
  const { isDark } = useTheme()
  const [mode, setMode] = useState(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const updateMode = (nextMode) => {
    setMode(nextMode)
    navigate(nextMode === 'login' ? '/login' : '/register')
    setError('')
    setErrors({})
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const values = { name, email, password, confirmPassword }
    const currentErrors = validate(mode, values)
    setErrors(currentErrors)
    if (Object.keys(currentErrors).length > 0) return
    setLoading(true)
    setError('')
    try {
      const response =
        mode === 'login'
          ? await loginUser(email, password)
          : await registerUser(name, email, password)
      completeAuth(response.token, response.user)
      pushToast({
        type: 'success',
        title: mode === 'login' ? 'Vault opened' : 'Vault created',
        message: mode === 'login' && connectedWallet === 'metamask' && walletAddress
          ? `Wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} is already connected. Redirecting to your dashboard.`
          : 'Redirecting to your dashboard.'
      })
    } catch (submitError) {
      // Use the server's specific message if available, otherwise fall back gracefully
      const serverMsg = submitError?.payload?.message || submitError?.payload?.errors?.[0]?.msg
      const displayMsg = serverMsg || submitError.message || 'Something went wrong. Please try again.'
      setError(displayMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <aside className={`auth-showcase ${isDark ? 'dark' : 'light'}`}>
        <div className="auth-showcase-head">
          <VaultisBrand to="/" logoSize={30} className="auth-brand-line" />
          <WalletConnectButton />
        </div>
        <div className="auth-story">
          <img src="/logo.png" width="80" height="80" alt="VAULTIS" className="auth-hero-logo" />
          <h1>
            Your digital life shouldn&apos;t
            <br />
            disappear when you do.
          </h1>
          <div className="feature-list">
            <p>
              <LockKeyhole size={16} /> AES-256 Encrypted Storage
            </p>
            <p>
              <Link2 size={16} /> Ethereum Blockchain Verified
            </p>
            <p>
              <BellRing size={16} /> Automated Dead Man Switch
            </p>
          </div>
        </div>
      </aside>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-card-brand">
            <img src="/logo.png" width="24" height="24" alt="VAULTIS" />
            <Link className="auth-mini-brand" to="/">
              VAULTIS
            </Link>
          </div>
          <div className={`auth-tabs ${mode === 'register' ? 'is-register' : 'is-login'}`} role="tablist" aria-label="Authentication mode">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => updateMode('login')} role="tab" aria-selected={mode === 'login'}>
              Sign In
            </button>
            <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => updateMode('register')} role="tab" aria-selected={mode === 'register'}>
              Create Account
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' ? (
              <label>
                <span>FULL NAME</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                {errors.name ? <small className="field-error">{errors.name}</small> : null}
              </label>
            ) : null}

            <label>
              <span>EMAIL ADDRESS</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              {errors.email ? <small className="field-error">{errors.email}</small> : null}
            </label>

            <label>
              <span>PASSWORD</span>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button type="button" className="icon-button subtle" onClick={() => setShowPassword((current) => !current)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password ? <small className="field-error">{errors.password}</small> : null}
            </label>

            {mode === 'register' ? (
              <label>
                <span>CONFIRM PASSWORD</span>
                <div className="password-field">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                  <button type="button" className="icon-button subtle" onClick={() => setShowConfirm((current) => !current)}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword ? <small className="field-error">{errors.confirmPassword}</small> : null}
              </label>
            ) : (
              <div className="forgot-row">
                <span />
                <button type="button">Forgot password?</button>
              </div>
            )}

            <button className="button primary large wide" type="submit" disabled={loading}>
              {loading ? <LoaderCircle className="spin" size={18} /> : null}
              {loading ? (mode === 'login' ? 'Opening vault...' : 'Creating vault...') : mode === 'login' ? 'Open Vault' : 'Create Vault'}
            </button>

            {error ? <p style={{ color: 'red' }}>{error}</p> : null}
          </form>

          <p className="auth-switch">
            {mode === 'login' ? 'New here?' : 'Already have a vault?'}{' '}
            <button onClick={() => updateMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Create Account' : 'Sign In'}
            </button>
          </p>
        </div>
      </section>
    </div>
  )
}
