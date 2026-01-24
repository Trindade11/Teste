"use client"

import { useEffect, useState } from "react"
import { ChangePassword } from "./ChangePassword"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Lock } from "lucide-react"

interface PasswordChangeGuardProps {
  children: React.ReactNode
  user?: {
    forcePasswordChange?: boolean
    email?: string
    name?: string
  }
}

export function PasswordChangeGuard({ children, user }: PasswordChangeGuardProps) {
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user needs to change password
    if (user?.forcePasswordChange) {
      setNeedsPasswordChange(true)
    }
    setIsLoading(false)
  }, [user])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (needsPasswordChange) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md">
          {/* Warning Alert */}
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <Shield className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Atenção:</strong> Você está usando a senha padrão do sistema. 
              Por segurança, é necessário alterar sua senha antes de continuar.
            </AlertDescription>
          </Alert>

          {/* Change Password Component */}
          <ChangePassword 
            onSuccess={() => {
              // After successful password change, the page will reload automatically
              // or the parent component will handle the state update
              window.location.reload()
            }}
          />

          {/* Help Information */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>Senha padrão:</strong> EKB123
            </p>
            <p>
              Se você tiver problemas, entre em contato com o administrador do sistema.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
