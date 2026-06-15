import { Bell, ChevronLeft, ChevronRight, FileText, Gift, LayoutDashboard, Lock, Moon, Shield, Sun, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useLVTToken } from '../hooks/useLVTToken'
import { useAssets, useCheckInStatus, useContacts } from '../lib/api'
import { WalletConnectButton } from './WalletConnectButton'
import { VaultisBrand } from './VaultisBrand'
import { useWallet } from '../context/useWallet'

const navigation = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/assets', label: 'Vault', icon: Lock },
  { to: '/contacts', label: 'Contacts', icon: Users },
  { to: '/will', label: 'Will', icon: FileText },
  { to: '/security', label: 'Security', icon: Shield },
  { to: '/beneficiary', label: 'Beneficiary', icon: Gift }
]

export function AppShell({ title, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(true)
  const { toggleTheme, isDark } = useTheme()
  const { user } = useAuth()
  const { walletAddress, connectedWallet } = useWallet()
  const { lvtBalance } = useLVTToken()
  const checkInStatus = useCheckInStatus()
  const contactsQuery = useContacts()
  const assetsQuery = useAssets()
  const notificationRef = useRef(null)

  const lastCheckIn = checkInStatus.data?.lastCheckIn || user?.lastCheckIn || null
  const contactCount = contactsQuery.data?.contacts?.length || 0
  const assetCount = assetsQuery.data?.assets?.length || 0
  const walletConnected = Boolean(connectedWallet && walletAddress)

  const daysRemaining = useMemo(() => {
    const base = lastCheckIn ? new Date(lastCheckIn).getTime() : Date.now()
    const intervalDays = user?.checkInIntervalDays || 45
    const diff = base + intervalDays * 24 * 60 * 60 * 1000 - Date.now()
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)))
  }, [lastCheckIn, user?.checkInIntervalDays])

  const dynamicNotifications = useMemo(() => {
    const nextItems = []

    if (lastCheckIn) {
      nextItems.push({
        icon: 'OK',
        message: `Heartbeat confirmed - ${new Date(lastCheckIn).toLocaleString()}`,
        meta: 'Recent'
      })
    }

    if (contactCount === 0) {
      nextItems.push({
        icon: 'WARN',
        message: 'No trusted contacts assigned. Add contacts to activate release protocol.',
        meta: 'Action'
      })
    }

    if (!walletConnected) {
      nextItems.push({
        icon: 'LINK',
        message: 'Connect your Sepolia wallet to enable blockchain verification.',
        meta: 'Sepolia'
      })
    }

    if (assetCount === 0) {
      nextItems.push({
        icon: 'VAULT',
        message: 'No assets protected yet. Add your first asset to the vault.',
        meta: 'Vault'
      })
    }

    if (lvtBalance > 0) {
      nextItems.push({
        icon: 'LVT',
        message: `${lvtBalance} LVT available in your connected wallet.`,
        meta: 'Balance'
      })
    }

    nextItems.push({
      icon: 'LIVE',
      message: `Vault is actively monitored. Next check-in in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`,
      meta: 'Live'
    })

    return nextItems
  }, [assetCount, contactCount, daysRemaining, lastCheckIn, lvtBalance, walletConnected])

  useEffect(() => {
    if (dynamicNotifications.length > 0) {
      setHasUnread(true)
    }
  }, [dynamicNotifications])

  useEffect(() => {
    if (!isNotificationOpen) {
      return undefined
    }

    const handlePointerDown = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isNotificationOpen])

  return (
    <div className="shell shell-modern">
      <aside className={`sidebar ${isSidebarOpen ? 'expanded' : 'collapsed'}`}>
        <VaultisBrand
          to="/"
          logoSize={32}
          className="sidebar-brand"
          wordmarkClassName="text-xl font-black text-[#4d8eff]"
        />
        <button
          className="sidebar-toggle"
          type="button"
          onClick={() => setIsSidebarOpen((current) => !current)}
          aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
        <nav className="side-nav">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={!isSidebarOpen ? item.label : undefined}
                aria-label={item.label}
                className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span className="side-link-label">{item.label}</span>
                {!isSidebarOpen ? <span className="side-link-tooltip">{item.label}</span> : null}
              </NavLink>
            )
          })}
        </nav>
      </aside>

      <div className="shell-main">
        <main className="page-shell page-shell-modern">
          <div className="container">
            <div className="page-stack">
              <div className="page-title-bar">
                <div className="page-title-copy">
                  <span className="section-kicker">Operational Console</span>
                  <h1 className="shell-title">{title}</h1>
                </div>
                <div className="page-title-actions">
                  <button className="icon-button" onClick={toggleTheme} aria-label="Toggle theme">
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                  <WalletConnectButton />
                  <div className="notification-wrap" ref={notificationRef}>
                    <button
                      className="icon-button notification-button"
                      aria-label="Notifications"
                      onClick={() => setIsNotificationOpen((current) => !current)}
                    >
                      <Bell size={18} />
                      {hasUnread ? <span className="badge-dot" /> : null}
                    </button>
                    {isNotificationOpen ? (
                      <div className="notification-dropdown">
                        <div className="notification-dropdown-head">
                          <strong>Notifications</strong>
                          <button type="button" className="notification-clear" onClick={() => setHasUnread(false)}>
                            Mark all read
                          </button>
                        </div>
                        <div className="notification-list">
                          {dynamicNotifications.map((item) => (
                            <div className="notification-item" key={`${item.icon}-${item.message}`}>
                              <span className="notification-item-icon">{item.icon}</span>
                              <span className="notification-item-copy">{item.message}</span>
                              <span className="notification-item-meta">{item.meta}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="header-user-chip">
                    <span className="avatar">{(user?.name || 'VU').split(' ').map((part) => part[0]).join('').slice(0, 2)}</span>
                    <div className="header-user-copy">
                      <strong>{user?.name || 'Vault User'}</strong>
                      <span>{user?.email || 'secure@vaultis.app'}</span>
                    </div>
                  </div>
                </div>
              </div>
              {children}
            </div>
          </div>
        </main>
      </div>

      <nav className="mobile-nav">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}>
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
