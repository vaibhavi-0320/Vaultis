import { Bitcoin, FileText, Filter, KeyRound, Package, Plus, Search, Shield, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ConfirmationModal, Modal } from '../components/Modal'
import { CardSkeleton, EmptyState, ErrorState } from '../components/Loading'
import { useToast } from '../contexts/ToastContext'
import { useAssets, useCreateAssetMutation, useDeleteAssetMutation } from '../lib/api'

const iconMap = {
  password: KeyRound,
  crypto_wallet: Bitcoin,
  document: FileText,
  note: FileText,
  other: Package
}

const initialAsset = {
  title: '',
  assetType: 'document',
  data: '',
  beneficiaryName: '',
  beneficiaryEmail: '',
  releaseStage: 1,
  priority: 'medium',
  uploadToIpfs: false,
  description: ''
}

function sanitizeText(value) {
  return String(value).replace(/[<>]/g, '').trim()
}

export function AssetsPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [deleteId, setDeleteId] = useState('')
  const [query, setQuery] = useState('')
  const [risk, setRisk] = useState('')
  const [form, setForm] = useState(initialAsset)
  const { pushToast } = useToast()
  const createAsset = useCreateAssetMutation()
  const deleteAsset = useDeleteAssetMutation()

  const searchParams = useMemo(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (risk) params.set('risk', risk)
    return params.toString()
  }, [query, risk])

  const assetsQuery = useAssets(searchParams)
  const assets = assetsQuery.data?.assets || []

  const submitAsset = async (event) => {
    event.preventDefault()
    const payload = {
      ...form,
      title: sanitizeText(form.title),
      description: sanitizeText(form.description),
      beneficiaryName: sanitizeText(form.beneficiaryName)
    }

    try {
      await createAsset.mutateAsync(payload)
      pushToast({
        type: 'success',
        title: 'Asset encrypted and stored',
        message: `${payload.title} is encrypted and ready for staged release.`
      })
      setForm(initialAsset)
      setIsOpen(false)
    } catch {
      // Surfaced via the shared mutation error toast in lib/api.js
    }
  }

  const confirmDelete = async () => {
    try {
      await deleteAsset.mutateAsync(deleteId)
      pushToast({ type: 'warning', title: 'Asset archived', message: 'The asset was removed from active monitoring.' })
      setDeleteId('')
    } catch {
      // Surfaced via the shared mutation error toast in lib/api.js
    }
  }

  return (
    <div className="page-stack">
      <div className="panel-head filter-bar">
        <div className="search-field inline-search">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search assets, instructions, tags..." />
        </div>
        <div className="filter-controls">
          <div className="select-inline">
            <Filter size={16} />
            <select value={risk} onChange={(event) => setRisk(event.target.value)}>
              <option value="">All risk levels</option>
              <option value="low">Low risk</option>
              <option value="moderate">Moderate risk</option>
              <option value="high">High risk</option>
            </select>
          </div>
          <button className="button primary" onClick={() => setIsOpen(true)}>
            <Plus size={18} />
            Add Asset
          </button>
        </div>
      </div>

      {assetsQuery.isLoading ? (
        <div className="cards-grid three">
          <CardSkeleton tall />
          <CardSkeleton tall />
          <CardSkeleton tall />
        </div>
      ) : assetsQuery.isError ? (
        <ErrorState
          title="Couldn't load your assets"
          message="There was a problem reaching the VAULTIS API. Check your connection and try again."
          onRetry={() => assetsQuery.refetch()}
        />
      ) : assets.length === 0 ? (
        <EmptyState
          icon={<Package size={40} />}
          title="No protected assets yet"
          subtitle="Add a document, password, wallet note, or secure message to begin your inheritance map."
          action={<button className="button primary" onClick={() => setIsOpen(true)}>Create First Asset</button>}
        />
      ) : (
        <div className="cards-grid three">
          {assets.map((asset) => {
            const Icon = iconMap[asset.assetType] || Package
            return (
              <article className="glass-panel asset-card" key={asset._id}>
                <div className="asset-head">
                  <div className="asset-icon blue">
                    <Icon size={20} />
                  </div>
                  <div className="asset-copy">
                    <h3>{sanitizeText(asset.title)}</h3>
                    <span>{asset.assetType.replaceAll('_', ' ')}</span>
                  </div>
                  <button className="icon-button subtle" onClick={() => setDeleteId(asset._id)}>
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="beneficiary-box">
                  <span>Beneficiary</span>
                  <strong>{sanitizeText(asset.beneficiaryName)}</strong>
                </div>

                <div className="release-row">
                  <span className="status-chip success">AES-256 Encrypted</span>
                  <span className="status-chip subtle">Stage {asset.releaseStage}</span>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <div className="glass-panel assurance-card">
        <Shield size={24} />
        <div>
          <h3>Trust score engine</h3>
          <p>Each vault item is scored in real time for encryption strength, proof state, beneficiary coverage, and operational risk.</p>
        </div>
      </div>

      <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Add Encrypted Asset">
        <form className="modal-form" onSubmit={submitAsset}>
          <label>
            <span>Asset Title</span>
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          </label>
          <div className="two-col">
            <label>
              <span>Asset Type</span>
              <select value={form.assetType} onChange={(event) => setForm({ ...form, assetType: event.target.value })}>
                <option value="password">Password</option>
                <option value="crypto_wallet">Crypto Wallet</option>
                <option value="document">Document</option>
                <option value="note">Note</option>
              </select>
            </label>
            <label>
              <span>Priority</span>
              <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
          <label>
            <span>Secret Data</span>
            <textarea value={form.data} onChange={(event) => setForm({ ...form, data: event.target.value })} required />
          </label>
          <div className="two-col">
            <label>
              <span>Beneficiary Name</span>
              <input value={form.beneficiaryName} onChange={(event) => setForm({ ...form, beneficiaryName: event.target.value })} required />
            </label>
            <label>
              <span>Beneficiary Email</span>
              <input type="email" value={form.beneficiaryEmail} onChange={(event) => setForm({ ...form, beneficiaryEmail: event.target.value })} required />
            </label>
          </div>
          <label>
            <span>Release Stage</span>
            <div className="radio-cards">
              {[1, 2, 3].map((stage) => (
                <button
                  key={stage}
                  type="button"
                  className={Number(form.releaseStage) === stage ? 'active' : ''}
                  onClick={() => setForm({ ...form, releaseStage: stage })}
                >
                  Stage {stage}
                </button>
              ))}
            </div>
          </label>
          <button className="button primary large wide" type="submit" disabled={createAsset.isPending}>
            Save Asset
          </button>
        </form>
      </Modal>

      <ConfirmationModal
        open={Boolean(deleteId)}
        onCancel={() => setDeleteId('')}
        onConfirm={confirmDelete}
        message="This asset will be securely archived and removed from active release monitoring."
      />
    </div>
  )
}
