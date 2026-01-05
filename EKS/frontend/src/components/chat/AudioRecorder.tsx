"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface AudioRecorderProps {
  onAudioRecorded: (audioBlob: Blob) => void
  className?: string
}

export function AudioRecorder({ onAudioRecorded, className }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [hasRecording, setHasRecording] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<Blob | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
    }
  }, [isRecording])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        audioRef.current = audioBlob
        setHasRecording(true)
        
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Erro ao acessar microfone:', error)
      alert('Não foi possível acessar o microfone. Verifique as permissões.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const sendRecording = () => {
    if (audioRef.current) {
      onAudioRecorded(audioRef.current)
      setHasRecording(false)
      setRecordingTime(0)
      audioRef.current = null
    }
  }

  const cancelRecording = () => {
    setHasRecording(false)
    setRecordingTime(0)
    audioRef.current = null
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (hasRecording) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-lg flex-1">
          <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">{formatTime(recordingTime)}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={cancelRecording}
          className="h-9 w-9 p-0 text-destructive hover:text-destructive"
          title="Cancelar gravação"
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={sendRecording}
          className="h-9 w-9 p-0 text-green-600 hover:text-green-700 dark:text-green-400"
          title="Confirmar e enviar"
        >
          <Check className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  if (isRecording) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 rounded-lg flex-1">
          <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm font-medium text-destructive">{formatTime(recordingTime)}</span>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={stopRecording}
          className="h-9 w-9 p-0"
        >
          <Square className="h-4 w-4 fill-current" />
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={startRecording}
      className={cn("h-9 w-9 p-0", className)}
      title="Gravar áudio"
    >
      <Mic className="h-4 w-4" />
    </Button>
  )
}

