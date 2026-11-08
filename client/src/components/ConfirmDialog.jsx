import { useState } from 'react';
import Modal from './Modal.jsx';
import { AlertIcon, TrashIcon } from './Icons.jsx';

/* Replaces window.confirm() for destructive actions. `onConfirm` may be async. */
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try { await onConfirm(); } finally { setBusy(false); }
  };
  return (
    <Modal
      isOpen={open}
      onClose={busy ? () => {} : onClose}
      title={title}
      maxWidth={440}
      footer={(
        <>
          <button type="button" className="btn ghost sm" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className="btn sm danger-solid" onClick={run} disabled={busy}>
            <TrashIcon size={15} /> {busy ? 'Deleting…' : confirmLabel}
          </button>
        </>
      )}
    >
      <div className="confirm-body">
        <span className="confirm-ico"><AlertIcon size={20} /></span>
        <p>{message}</p>
      </div>
    </Modal>
  );
}
