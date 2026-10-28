const DATABASE_NAME = 'traveldesk-demo-storage'
const DATABASE_VERSION = 1
const ATTACHMENT_STORE = 'quotation-attachments'

let databasePromise

function openDatabase() {
  if (!window.indexedDB) return Promise.reject(new Error('Persistent file storage is unavailable.'))
  if (databasePromise) return databasePromise

  databasePromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(ATTACHMENT_STORE)) {
        database.createObjectStore(ATTACHMENT_STORE, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Could not open browser file storage.'))
    request.onblocked = () => reject(new Error('Browser file storage is blocked by another tab.'))
  }).catch((error) => {
    databasePromise = null
    throw error
  })

  return databasePromise
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Browser file storage request failed.'))
  })
}

function attachmentKey(requestId, fieldName) {
  return `${requestId}:${fieldName}`
}

export async function saveDemoAttachment(requestId, fieldName, file) {
  const database = await openDatabase()
  const transaction = database.transaction(ATTACHMENT_STORE, 'readwrite')
  const done = new Promise((resolve, reject) => {
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error || new Error('Could not save the attachment.'))
    transaction.onabort = () => reject(transaction.error || new Error('Attachment saving was cancelled.'))
  })
  transaction.objectStore(ATTACHMENT_STORE).put({
    key: attachmentKey(requestId, fieldName),
    requestId,
    fieldName,
    name: file.name,
    type: file.type,
    lastModified: file.lastModified,
    file,
    savedAt: new Date().toISOString(),
  })
  await done
}

export async function getDemoAttachments(requestId) {
  const database = await openDatabase()
  const transaction = database.transaction(ATTACHMENT_STORE, 'readonly')
  const records = await requestResult(transaction.objectStore(ATTACHMENT_STORE).getAll())
  return records.filter((record) => record.requestId === requestId)
}

export async function getDemoAttachment(requestId, fieldName) {
  const database = await openDatabase()
  const transaction = database.transaction(ATTACHMENT_STORE, 'readonly')
  const record = await requestResult(transaction.objectStore(ATTACHMENT_STORE).get(attachmentKey(requestId, fieldName)))
  if (!record?.file) return null
  return { file: record.file, name: record.name, type: record.type || record.file.type || '' }
}

export async function clearDemoAttachments(requestId) {
  const database = await openDatabase()
  const transaction = database.transaction(ATTACHMENT_STORE, 'readwrite')
  const store = transaction.objectStore(ATTACHMENT_STORE)
  const done = new Promise((resolve, reject) => {
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error || new Error('Could not clear saved attachments.'))
    transaction.onabort = () => reject(transaction.error || new Error('Attachment clearing was cancelled.'))
  })
  const records = await requestResult(store.getAll())
  records.filter((record) => record.requestId === requestId).forEach((record) => store.delete(record.key))
  await done
}

export async function deleteDemoAttachment(requestId, fieldName) {
  const database = await openDatabase()
  const transaction = database.transaction(ATTACHMENT_STORE, 'readwrite')
  const done = new Promise((resolve, reject) => {
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error || new Error('Could not delete the attachment.'))
    transaction.onabort = () => reject(transaction.error || new Error('Attachment deletion was cancelled.'))
  })
  transaction.objectStore(ATTACHMENT_STORE).delete(attachmentKey(requestId, fieldName))
  await done
}

export async function downloadDemoAttachment(requestId, fieldName) {
  const database = await openDatabase()
  const transaction = database.transaction(ATTACHMENT_STORE, 'readonly')
  const record = await requestResult(transaction.objectStore(ATTACHMENT_STORE).get(attachmentKey(requestId, fieldName)))
  if (!record?.file) return false

  const url = URL.createObjectURL(record.file)
  const link = document.createElement('a')
  link.href = url
  link.download = record.name || 'travel-quotation'
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  return true
}
