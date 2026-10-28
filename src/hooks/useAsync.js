import { useCallback, useState } from 'react'

export function useAsync(action) {
  const [state, setState] = useState({ data: null, error: null, loading: false })
  const run = useCallback(async (...args) => {
    setState({ data: null, error: null, loading: true })
    try {
      const data = await action(...args)
      setState({ data, error: null, loading: false })
      return data
    } catch (error) {
      setState({ data: null, error, loading: false })
      throw error
    }
  }, [action])
  return { ...state, run }
}
