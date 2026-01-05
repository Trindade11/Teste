"use client"

import React, { useState, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  children: ReactNode
  content: ReactNode
  delay?: number
  className?: string
}

const Tooltip = ({ children, content, delay = 300, className }: TooltipProps) => {
  const [show, setShow] = useState(false)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setShow(true)
    }, delay)
    setTimeoutId(id)
  }

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    setShow(false)
  }

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>
      {show && (
        <div className={cn(
          "absolute z-[9999] top-full left-1/2 transform -translate-x-1/2 translate-y-1 px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg whitespace-nowrap",
          className
        )}>
          {content}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
        </div>
      )}
    </div>
  )
}

// Componentes simplificados para compatibilidade com o código existente
const TooltipProvider = ({ children }: { children: ReactNode }) => <>{children}</>
const TooltipTrigger = ({ asChild, children }: { asChild?: boolean; children: ReactNode }) => <>{children}</>
const TooltipContent = ({ children }: { children: ReactNode }) => <>{children}</>

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

