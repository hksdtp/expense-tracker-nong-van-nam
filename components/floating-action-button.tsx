"use client"

import { Plus } from "lucide-react"
import { useState } from "react"

interface FloatingActionButtonProps {
  onClick: () => void
  className?: string
}

export function FloatingActionButton({ onClick, className = "" }: FloatingActionButtonProps) {
  const [isPressed, setIsPressed] = useState(false)

  const handleMouseDown = () => setIsPressed(true)
  const handleMouseUp = () => setIsPressed(false)
  const handleMouseLeave = () => setIsPressed(false)

  return (
    <button
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={`
        fixed bottom-6 right-6 z-50
        w-14 h-14 
        bg-red-500 hover:bg-red-600 
        text-white 
        rounded-full 
        shadow-lg hover:shadow-xl
        transition-all duration-300 ease-out
        flex items-center justify-center
        group
        ${isPressed ? "scale-95" : "scale-100 hover:scale-105"}
        ${className}
      `}
    >
      <Plus 
        className={`
          w-6 h-6 
          transition-transform duration-300 ease-out
          ${isPressed ? "rotate-45" : "group-hover:rotate-90"}
        `} 
      />
      
      {/* Ripple effect */}
      <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-active:scale-100 transition-transform duration-200" />
      
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-red-400/30 scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
    </button>
  )
}
