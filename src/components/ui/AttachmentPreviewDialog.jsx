import { useEffect, useState } from 'react'
import { Download, Eye, FileText } from 'lucide-react'
import { Modal } from './Modal.jsx'

export function AttachmentPreviewDialog({ attachment, onClose }) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (!attachment?.file) {
      setUrl('')
      return undefined
    }
    const objectUrl = URL.createObjectURL(attachment.file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [attachment])

  if (!attachment) return null

  const type = attachment.type || attachment.file?.type || ''
  const isImage = type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(attachment.name || '')
  const isPdf = type === 'application/pdf' || /\.pdf$/i.test(attachment.name || '')

  return <Modal open title={`Preview · ${attachment.name}`} onClose={onClose} className="modal-attachment-preview">
    {isImage && url ? <img src={url} alt={`Preview of ${attachment.name}`} /> : isPdf && url ? <iframe src={url} title={`Preview of ${attachment.name}`} /> : <div className="attachment-preview-unavailable"><FileText size={25} /><strong>{url ? 'Preview is not available for this file type.' : 'Preparing preview…'}</strong><span>{url ? 'Download the file to review it with its native application.' : 'The attachment is being loaded.'}</span></div>}
    {url && <a className="attachment-preview-download" href={url} download={attachment.name}><Download size={14} /> Download file</a>}
  </Modal>
}
