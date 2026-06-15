import { ExternalLink, FileSignature, LoaderCircle, Save, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useToast } from '../contexts/ToastContext'
import { useSaveWillMutation, useWill } from '../lib/api'

async function buildSha256Hex(value) {
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value)
  )
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function WillPage() {
  const { pushToast } = useToast()
  const willQuery = useWill()
  const saveWill = useSaveWillMutation()
  const [content, setContent] = useState('')
  const [summary, setSummary] = useState('')
  const [proof, setProof] = useState(null)

  useEffect(() => {
    if (willQuery.data?.will) {
      setContent(willQuery.data.will.content || '')
      setSummary(willQuery.data.will.summary || '')
      setProof({
        hash: willQuery.data.will.sha256Hash,
        txHash: willQuery.data.will.blockchainTxHash,
        status: willQuery.data.will.proofStatus,
        registeredAt: willQuery.data.will.proofRegisteredAt
      })
    }
  }, [willQuery.data])

  const saveDraft = async (registerOnChain) => {
    const localHash = await buildSha256Hex(content)
    const result = await saveWill.mutateAsync({ content, summary, registerOnChain })
    setProof({
      hash: localHash || result.will.sha256Hash,
      txHash: result.will.blockchainTxHash,
      status: result.will.proofStatus,
      registeredAt: result.will.proofRegisteredAt || null
    })
    pushToast({
      type: registerOnChain ? 'success' : 'info',
      title: registerOnChain ? 'Will secured on chain' : 'Draft encrypted and saved to MongoDB',
      message: registerOnChain
        ? `Hash registered: ${localHash.slice(0, 10)}...${localHash.slice(-6)}`
        : 'Draft encrypted and saved to MongoDB'
    })
  }

  const copyProofHash = async () => {
    if (!proof?.hash) {
      return
    }

    await navigator.clipboard.writeText(`0x${proof.hash}`)
    pushToast({
      type: 'info',
      title: 'Hash copied',
      message: 'The full SHA-256 proof hash was copied to your clipboard.'
    })
  }

  return (
    <div className="page-stack">
      <div className="split-grid wide-narrow">
        <article className="glass-panel will-editor">
          <div className="panel-head">
            <h3>Legacy directive editor</h3>
            <span className="mode-badge">AES-256-GCM encrypted</span>
          </div>
          <label>
            <span>Summary</span>
            <input value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Short description of this directive" />
          </label>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write your wishes, legal instructions, beneficiaries, and release conditions here..."
          />
          <div className="button-row">
            <button className="button ghost" onClick={() => saveDraft(false)} disabled={saveWill.isPending || !content.trim()}>
              {saveWill.isPending ? <LoaderCircle className="spin" size={18} /> : <Save size={18} />}
              Save Encrypted Draft
            </button>
            <button className="button primary" onClick={() => saveDraft(true)} disabled={saveWill.isPending || !content.trim()}>
              {saveWill.isPending ? <LoaderCircle className="spin" size={18} /> : <FileSignature size={18} />}
              Register Proof
            </button>
          </div>
        </article>

        <article className="glass-panel proof-card">
          <div className="panel-head">
            <h3>Blockchain proof</h3>
            <ShieldCheck size={18} />
          </div>
          {proof ? (
            <>
              <div className={`status-chip ${proof.status === 'registered' ? 'success' : 'warning'}`}>{proof.status}</div>
              <p>{proof.hash ? `SHA-256: 0x${proof.hash.slice(0, 20)}...` : 'Draft saved. Register on chain when ready.'}</p>
              <div className="hash-box">{proof.hash ? `0x${proof.hash}` : 'Waiting for secure digest...'}</div>
              {proof.hash ? <button className="button ghost wide" onClick={copyProofHash}>Copy Full Hash</button> : null}
              {proof.registeredAt ? <p>Proof registered on: {new Date(proof.registeredAt).toLocaleString('en-IN')}</p> : null}
              {proof.txHash ? (
                <a href={`https://sepolia.etherscan.io/tx/${proof.txHash}`} target="_blank" rel="noreferrer" className="button ghost wide">
                  <ExternalLink size={16} />
                  View Transaction
                </a>
              ) : null}
            </>
          ) : (
            <>
              <p>No will proof exists yet. Save a draft or register a proof to begin your audit trail.</p>
              <div className="hash-box muted">Waiting for secure digest...</div>
            </>
          )}
        </article>
      </div>
    </div>
  )
}
