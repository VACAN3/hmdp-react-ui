import { useRef, useState, useCallback } from 'react'
import { TOKEN_KEY } from '@/utils/auth'

export type SSEStatus = 'idle' | 'running' | 'done' | 'error'

export function useSSE(url: string) {
  const ctrlRef = useRef<AbortController | null>(null)
  const [status, setStatus] = useState<SSEStatus>('idle')
  const [error, setError] = useState<any>(null)

  const stop = useCallback(() => {
    ctrlRef.current?.abort()
    ctrlRef.current = null
  }, [])

  const start = useCallback(
    async (
      body: any,
      onMessage: (text: string) => void,
      onComplete?: () => void,
    ) => {
      stop()
      setError(null)
      setStatus('running')
      const ctrl = new AbortController()
      ctrlRef.current = ctrl

      const token = localStorage.getItem(TOKEN_KEY) || ''
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'clientid': import.meta.env.VITE_APP_CLIENT_ID || '',
      }
      if (token) headers['Authorization'] = `Bearer ${token}`

      try {
        const isDev = import.meta.env.DEV
        const chatEnv = import.meta.env.VITE_APP_CHAT_URL
        const base = isDev ? '/ai' : (chatEnv || '/ai')
        const resp = await fetch(`${base}${url}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: ctrl.signal,
        })
        const ct = String(resp.headers.get('content-type') || '')
        if (!resp.body) throw new Error('No stream')
        const reader = resp.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let buf = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const parts = buf.split('\n\n')
          buf = parts.pop() || ''
          for (const chunk of parts) {
            const lines = chunk.split('\n').filter(Boolean)
            for (const line of lines) {
              if (line.startsWith('data:')) {
                const data = line.slice(5).trim()
                onMessage(data)
              }
            }
          }
        }
        if (!ct.includes('text/event-stream')) {
          const text = buf.trim()
          if (text) onMessage(text)
        }
        setStatus('done')
        if (onComplete) onComplete()
      } catch (e) {
        if ((ctrlRef.current?.signal as any)?.aborted) {
          setStatus('idle')
        } else {
          setError(e)
          setStatus('error')
        }
      } finally {
        ctrlRef.current = null
      }
    },
    [url, stop],
  )

  return { start, stop, status, error }
}
