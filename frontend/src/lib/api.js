import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const configuredApiBase = import.meta.env.VITE_API_URL?.trim() || ''
export const API_BASE = configuredApiBase.replace(/\/$/, '')
const TOKEN_KEY = 'vaultis_token'
const COMPAT_TOKEN_KEY = 'token'
const USER_KEY = 'vaultis_user'
const COMPAT_USER_KEY = 'user'

export const queryKeys = {
  user: ['user'],
  checkIn: ['check-in-status'],
  assets: ['assets'],
  contacts: ['contacts'],
  notifications: ['notifications'],
  balance: ['token-balance'],
  overview: ['overview'],
  security: ['security'],
  will: ['will']
}

export function getToken() {
  return (
    localStorage.getItem(COMPAT_TOKEN_KEY) ||
    localStorage.getItem(TOKEN_KEY) ||
    sessionStorage.getItem(COMPAT_TOKEN_KEY) ||
    sessionStorage.getItem(TOKEN_KEY) ||
    ''
  )
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY) || localStorage.getItem(COMPAT_USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(COMPAT_USER_KEY)
    return null
  }
}

export function saveStoredUser(user) {
  if (!user) {
    return
  }

  const serialized = JSON.stringify(user)
  localStorage.setItem(USER_KEY, serialized)
  localStorage.setItem(COMPAT_USER_KEY, serialized)
}

export function saveToken(token, user) {
  localStorage.setItem(COMPAT_TOKEN_KEY, token)
  localStorage.setItem(TOKEN_KEY, token)
  sessionStorage.removeItem(COMPAT_TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)

  if (user) {
    saveStoredUser(user)
  }
}

export function clearAuthStorage() {
  sessionStorage.removeItem(COMPAT_TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(COMPAT_TOKEN_KEY)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(COMPAT_USER_KEY)
}

function notifyApiError({ title = 'Request failed', message, status }) {
  window.dispatchEvent(new CustomEvent('vaultis:api-error', {
    detail: {
      type: status === 503 ? 'warning' : 'error',
      title,
      message
    }
  }))
}

// Errors with status >= 500 (or network-unreachable, status undefined) are already
// surfaced by apiFetch itself. This only covers the gap: ordinary 4xx validation/
// permission errors from a mutation, which otherwise fail with no visible feedback.
function onMutationError(error) {
  if (!error?.status || error.status >= 500) {
    return
  }
  notifyApiError({
    title: 'Action failed',
    message: error.message || 'Something went wrong. Please try again.',
    status: error.status
  })
}

let navigateFn = null
export function setNavigate(fn) {
  navigateFn = fn
}

function redirectToLogin() {
  if (navigateFn) {
    navigateFn('/login', { replace: true })
  } else {
    window.location.href = '/login'
  }
}

function clearToken() {
  clearAuthStorage()
}

export async function loginUser(email, password) {
  const data = await authApi.login({ email, password })
  if (data?.token && data?.user) {
    saveToken(data.token, data.user)
  }

  return data
}

export async function registerUser(name, email, password) {
  const data = await authApi.register({ name, email, password })
  if (data?.token && data?.user) {
    saveToken(data.token, data.user)
  }

  return data
}

async function apiFetch(path, options = {}) {
  let response
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  try {
    response = await fetch(`${API_BASE}${normalizedPath}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...(options.headers || {})
      },
      ...options
    })
  } catch {
    const message = 'Cannot connect to backend. Make sure backend is running and the Vite proxy points to it.'
    notifyApiError({ title: 'Backend unavailable', message, status: 503 })
    throw new Error(message)
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (response.status === 401 && normalizedPath !== '/api/auth/login') {
    clearToken()
    redirectToLogin()
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const error = new Error(data?.message || 'Request failed')
    error.payload = data
    error.status = response.status
    if (response.status >= 500 || response.status === 503) {
      notifyApiError({
        title: response.status === 503 ? 'Service temporarily unavailable' : 'Server error',
        message: error.message,
        status: response.status
      })
    }
    throw error
  }

  return data
}

export const authApi = {
  register: (payload) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
  deleteAccount: (password) => apiFetch('/api/auth/account', { method: 'DELETE', body: JSON.stringify({ password }) }),
  me: () => apiFetch('/api/auth/me'),
  updateWallet: (payload) => apiFetch('/api/auth/wallet', { method: 'PUT', body: JSON.stringify(payload) })
}

export const checkInApi = {
  status: () => apiFetch('/api/checkin/status'),
  submit: () => apiFetch('/api/checkin', { method: 'POST' }),
  history: () => apiFetch('/api/checkin/history'),
  saveTx: (payload) => apiFetch('/api/checkin/save-tx', { method: 'POST', body: JSON.stringify(payload) }),
  demoReset: () => apiFetch('/api/checkin/demo-reset', { method: 'POST' })
}

export const assetsApi = {
  list: (params = '') => apiFetch(`/api/assets${params ? `?${params}` : ''}`),
  create: (payload) => apiFetch('/api/assets', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => apiFetch(`/api/assets/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id) => apiFetch(`/api/assets/${id}`, { method: 'DELETE' })
}

export const contactsApi = {
  list: () => apiFetch('/api/contacts'),
  create: (payload) => apiFetch('/api/contacts', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => apiFetch(`/api/contacts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id) => apiFetch(`/api/contacts/${id}`, { method: 'DELETE' })
}

export const tokensApi = {
  balance: () => apiFetch('/api/tokens/balance'),
  stake: (amount) => apiFetch('/api/tokens/stake', { method: 'POST', body: JSON.stringify({ amount: Number(amount) }) }),
  unstake: (amount) => apiFetch('/api/tokens/unstake', { method: 'POST', body: JSON.stringify({ amount: Number(amount) }) })
}

export const notificationsApi = {
  list: () => apiFetch('/api/notifications')
}

export const blockchainApi = {
  registerWill: (hash) => apiFetch('/api/blockchain/register-will', { method: 'POST', body: JSON.stringify({ hash }) }),
  verifyWill: () => apiFetch('/api/blockchain/verify-will'),
  onChainBalance: () => apiFetch('/api/blockchain/on-chain-balance'),
  assetHashes: () => apiFetch('/api/blockchain/asset-hashes')
}

export const willApi = {
  get: () => apiFetch('/api/will'),
  save: (payload) => apiFetch('/api/will', { method: 'POST', body: JSON.stringify(payload) })
}

export const securityApi = {
  status: () => apiFetch('/api/security/status')
}

export const overviewApi = {
  summary: () => apiFetch('/api/overview/summary')
}

export function useUser(enabled = true) {
  return useQuery({ queryKey: queryKeys.user, queryFn: authApi.me, enabled })
}

export function useCheckInStatus() {
  return useQuery({ queryKey: queryKeys.checkIn, queryFn: checkInApi.status })
}

export function useAssets(params = '') {
  return useQuery({ queryKey: [...queryKeys.assets, params], queryFn: () => assetsApi.list(params) })
}

export function useContacts() {
  return useQuery({ queryKey: queryKeys.contacts, queryFn: contactsApi.list })
}

export function useNotifications() {
  return useQuery({ queryKey: queryKeys.notifications, queryFn: notificationsApi.list })
}

export function useTokenBalance() {
  return useQuery({ queryKey: queryKeys.balance, queryFn: tokensApi.balance })
}

export function useOverview() {
  return useQuery({ queryKey: queryKeys.overview, queryFn: overviewApi.summary })
}

export function useSecurityStatus() {
  return useQuery({ queryKey: queryKeys.security, queryFn: securityApi.status })
}

export function useWill() {
  return useQuery({ queryKey: queryKeys.will, queryFn: willApi.get })
}

export function useWalletMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.updateWallet,
    onError: onMutationError,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.user })
  })
}

export function useCheckInMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: checkInApi.submit,
    onError: onMutationError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.checkIn })
      queryClient.invalidateQueries({ queryKey: queryKeys.balance })
      queryClient.invalidateQueries({ queryKey: queryKeys.user })
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
      queryClient.invalidateQueries({ queryKey: queryKeys.overview })
      queryClient.invalidateQueries({ queryKey: queryKeys.security })
    }
  })
}

export function useCreateAssetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: assetsApi.create,
    onError: onMutationError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets })
      queryClient.invalidateQueries({ queryKey: queryKeys.overview })
      queryClient.invalidateQueries({ queryKey: queryKeys.security })
    }
  })
}

export function useUpdateAssetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => assetsApi.update(id, payload),
    onError: onMutationError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets })
      queryClient.invalidateQueries({ queryKey: queryKeys.overview })
      queryClient.invalidateQueries({ queryKey: queryKeys.security })
    }
  })
}

export function useDeleteAssetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: assetsApi.remove,
    onError: onMutationError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets })
      queryClient.invalidateQueries({ queryKey: queryKeys.overview })
      queryClient.invalidateQueries({ queryKey: queryKeys.security })
    }
  })
}

export function useAddContactMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: contactsApi.create,
    onError: onMutationError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts })
      queryClient.invalidateQueries({ queryKey: queryKeys.overview })
      queryClient.invalidateQueries({ queryKey: queryKeys.security })
    }
  })
}

export function useDeleteContactMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: contactsApi.remove,
    onError: onMutationError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts })
      queryClient.invalidateQueries({ queryKey: queryKeys.overview })
      queryClient.invalidateQueries({ queryKey: queryKeys.security })
    }
  })
}

export function useStakeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: tokensApi.stake,
    onError: onMutationError,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.balance })
  })
}

export function useUnstakeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: tokensApi.unstake,
    onError: onMutationError,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.balance })
  })
}

export function useSaveWillMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: willApi.save,
    onError: onMutationError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.will })
      queryClient.invalidateQueries({ queryKey: queryKeys.overview })
    }
  })
}
