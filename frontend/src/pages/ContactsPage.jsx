import { Trash2, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { CardSkeleton, EmptyState } from '../components/Loading'
import { ConfirmationModal, Modal } from '../components/Modal'
import { useToast } from '../contexts/ToastContext'
import { useAddContactMutation, useContacts, useDeleteContactMutation } from '../lib/api'

const initialContact = { name: '', email: '', phone: '', relationship: 'family', trustWeight: 'medium' }

export function ContactsPage() {
  const { pushToast } = useToast()
  const contactsQuery = useContacts()
  const addContact = useAddContactMutation()
  const removeContact = useDeleteContactMutation()
  const [form, setForm] = useState(initialContact)
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState('')

  const contacts = contactsQuery.data?.contacts || []

  const submit = async (event) => {
    event.preventDefault()
    await addContact.mutateAsync(form)
    pushToast({ type: 'success', title: 'Trusted contact added', message: `${form.name} was added to your verification circle.` })
    setForm(initialContact)
    setOpen(false)
  }

  const confirmDelete = async () => {
    await removeContact.mutateAsync(deleteId)
    setDeleteId('')
    pushToast({ type: 'warning', title: 'Contact removed', message: 'The trust relationship has been cleared.' })
  }

  return (
    <div className="page-stack">
      <div className="page-hero">
        <div>
          <p>Assign weighted trust contacts who can confirm your status and unlock staged inheritance release when needed.</p>
        </div>
        <button className="button primary rounded" onClick={() => setOpen(true)}>
          <UserPlus size={18} />
          Add Contact
        </button>
      </div>

      {contactsQuery.isLoading ? (
        <div className="cards-grid three">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title="No contacts assigned"
          subtitle="Add your first trusted contact to make the release protocol resilient."
          action={<button className="button primary rounded" onClick={() => setOpen(true)}>Add Contact</button>}
        />
      ) : (
        <div className="cards-grid three">
          {contacts.map((contact) => (
            <article className="glass-panel contact-detail-card" key={contact._id}>
              <div className="asset-head">
                <div className="avatar large">{contact.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>
                <div className="contact-head-copy">
                  <h3>{contact.name}</h3>
                  <span>{contact.relationship}</span>
                </div>
                <button className="icon-button subtle" onClick={() => setDeleteId(contact._id)}>
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="contact-stats">
                <div className="contact-stat">
                  <span>Email</span>
                  <strong className="contact-email">{contact.email}</strong>
                </div>
                <div className="contact-stat">
                  <span>Trust Weight</span>
                  <strong><span className={`status-chip ${contact.trustWeight === 'high' ? 'success' : 'subtle'}`}>{contact.trustWeight}</span></strong>
                </div>
                <div className="contact-stat">
                  <span>Trust Score</span>
                  <strong>{contact.trustScore}</strong>
                </div>
                <div className="contact-stat">
                  <span>Vote Status</span>
                  <strong className="caps">{contact.voteStatus}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Trusted Contact" width="520px">
        <form className="modal-form" onSubmit={submit}>
          <label>
            <span>Name</span>
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label>
            <span>Email</span>
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </label>
          <label>
            <span>Phone</span>
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </label>
          <label>
            <span>Relationship</span>
            <select value={form.relationship} onChange={(event) => setForm({ ...form, relationship: event.target.value })}>
              <option value="family">Family</option>
              <option value="friend">Friend</option>
              <option value="colleague">Colleague</option>
              <option value="lawyer">Lawyer</option>
            </select>
          </label>
          <label>
            <span>Trust Weight</span>
            <div className="radio-cards">
              {['high', 'medium', 'low'].map((weight) => (
                <button
                  key={weight}
                  type="button"
                  className={form.trustWeight === weight ? 'active' : ''}
                  onClick={() => setForm({ ...form, trustWeight: weight })}
                >
                  {weight.charAt(0).toUpperCase() + weight.slice(1)}
                </button>
              ))}
            </div>
          </label>
          <button className="button primary large wide" type="submit">Add Contact</button>
        </form>
      </Modal>

      <ConfirmationModal
        open={Boolean(deleteId)}
        onCancel={() => setDeleteId('')}
        onConfirm={confirmDelete}
        message="Removing this contact will revoke their confirmation authority."
      />
    </div>
  )
}
