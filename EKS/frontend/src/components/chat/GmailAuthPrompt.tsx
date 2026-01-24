"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, X, Loader2 } from "lucide-react"
import { skipGmailAuth, initiateGmailAuth } from "@/services/api"

interface GmailAuthPromptProps {
  onComplete: () => void
  onSkip: () => void
}

export function GmailAuthPrompt({ onComplete, onSkip }: GmailAuthPromptProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken')
    }
    return null
  }

  const handleConnect = async () => {
    const token = getToken()
    if (!token) return
    setIsLoading(true)

    try {
      const { authUrl } = await initiateGmailAuth(token)
      // Open Gmail OAuth in new window
      const authWindow = window.open(authUrl, '_blank', 'width=500,height=600')
      
      // Poll for completion (simplified - in production use proper OAuth callback)
      const checkInterval = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkInterval)
          onComplete()
        }
      }, 1000)
    } catch (error) {
      console.error('Error initiating Gmail auth:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = async () => {
    const token = getToken()
    if (!token) return
    setIsSkipping(true)

    try {
      await skipGmailAuth(token)
      onSkip()
    } catch (error) {
      console.error('Error skipping Gmail:', error)
    } finally {
      setIsSkipping(false)
    }
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h4 className="font-medium text-sm">Conectar Gmail</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Para te conhecer melhor, posso analisar padrões do seu Gmail 
                (reuniões, projetos, contatos frequentes).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={isLoading || isSkipping}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Conectar Gmail
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleSkip}
                disabled={isLoading || isSkipping}
                className="gap-2"
              >
                {isSkipping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Depois
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
