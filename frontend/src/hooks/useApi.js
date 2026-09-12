import { useState, useEffect, useCallback } from 'react'
import api from '../services/api.js'

/**
 * Fetches data from the backend on mount (and when deps change).
 *
 * @param {string} url  - API path, e.g. '/v1/dashboard/kpi'
 * @param {*} fallback  - value to use while loading or on error
 * @param {Array} deps  - extra dependencies that trigger a re-fetch
 */
export function useApi(url, fallback = null, deps = []) {
  const [data, setData]       = useState(fallback)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: res } = await api.get(url)
      setData(res)
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
