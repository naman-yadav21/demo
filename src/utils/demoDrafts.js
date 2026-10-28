export function readDemoDraft(key) {
  try {
    const draft = window.localStorage.getItem(key)
    const parsed = draft ? JSON.parse(draft) : null
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function saveDemoDraft(key, values) {
  try {
    window.localStorage.setItem(key, JSON.stringify(values))
    return true
  } catch {
    return false
  }
}

export function clearDemoDraft(key) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Keep the page usable if browser storage is disabled.
  }
}
