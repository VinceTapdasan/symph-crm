'use client'

import { useRef, useState, useCallback } from 'react'

export type RecorderState = 'idle' | 'recording' | 'paused' | 'uploading'

export type RecordingResult = { blob: Blob; mimeType: string }

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm'
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? 'audio/webm'
}

/**
 * useRecorder, in-browser audio capture via MediaRecorder.
 *
 * Flow:
 *   start()   → 'recording'
 *   pause()   → 'paused'   (stream stays open, Resume/Done buttons appear)
 *   resume()  → 'recording' (continues from where it left off)
 *   finalize() → 'uploading' (collects all chunks, returns blob, closes stream)
 *   cancel()  → 'idle'     (discards everything)
 */
export function useRecorder() {
  const mrRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mimeTypeRef = useRef('audio/webm')

  const [state, setState] = useState<RecorderState>('idle')
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
  }, [])

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = pickMimeType()
      mimeTypeRef.current = mimeType
      const mr = new MediaRecorder(stream, { mimeType })
      mrRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.start(500)
      setState('recording')
      setDuration(0)
      startTimer()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Microphone access denied')
    }
  }, [startTimer])

  /** Pause, keeps the stream open so Resume works. */
  const pause = useCallback(() => {
    const mr = mrRef.current
    if (!mr || mr.state !== 'recording') return
    mr.pause()
    stopTimer()
    setState('paused')
  }, [stopTimer])

  /** Resume from paused state. */
  const resume = useCallback(() => {
    const mr = mrRef.current
    if (!mr || mr.state !== 'paused') return
    mr.resume()
    setState('recording')
    startTimer()
  }, [startTimer])

  /**
   * Finalize, stop the MediaRecorder, collect all chunks, return blob.
   * Pass the current `duration` value from the caller (captured before calling).
   */
  const finalize = useCallback((): Promise<RecordingResult> => {
    return new Promise((resolve, reject) => {
      const mr = mrRef.current
      if (!mr) { reject(new Error('No active recording')); return }

      stopTimer()
      setState('uploading')

      mr.onstop = () => {
        const mimeType = mimeTypeRef.current
        const blob = new Blob(chunksRef.current, { type: mimeType })
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        mrRef.current = null
        chunksRef.current = []
        resolve({ blob, mimeType })
      }

      mr.onerror = () => reject(new Error('MediaRecorder error during finalization'))

      // Stop from either 'recording' or 'paused' state
      if (mr.state !== 'inactive') mr.stop()
      else reject(new Error('MediaRecorder already stopped'))
    })
  }, [stopTimer])

  /** Cancel, discard everything, go back to idle. */
  const cancel = useCallback(() => {
    stopTimer()
    const mr = mrRef.current
    if (mr && mr.state !== 'inactive') {
      mr.ondataavailable = null
      mr.onstop = null
      mr.stop()
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    mrRef.current = null
    chunksRef.current = []
    setState('idle')
    setDuration(0)
    setError(null)
  }, [stopTimer])

  const reset = useCallback(() => setState('idle'), [])
  return { state, duration, error, start, pause, resume, finalize, cancel, reset }
}
