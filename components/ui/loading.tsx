"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

interface LoadingBarProps {
  isLoading: boolean
  message?: string
}

export function LoadingBar({ isLoading, message = "Loading..." }: LoadingBarProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 200)

      return () => clearInterval(interval)
    } else {
      setProgress(100)
      const timeout = setTimeout(() => setProgress(0), 500)
      return () => clearTimeout(timeout)
    }
  }, [isLoading])

  if (!isLoading && progress === 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div 
        className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
      {isLoading && (
        <div className="absolute top-4 right-4 flex items-center space-x-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {message}
          </span>
        </div>
      )}
    </div>
  )
}

interface SkeletonLoaderProps {
  className?: string
  children?: React.ReactNode
}

export function SkeletonLoader({ className = "", children }: SkeletonLoaderProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      {children || (
        <div className="space-y-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      )}
    </div>
  )
}

interface AsyncButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  children: React.ReactNode
  className?: string
}

export function AsyncButton({ 
  loading = false, 
  loadingText = "Loading...", 
  children, 
  className = "",
  disabled,
  ...props 
}: AsyncButtonProps) {
  return (
    <button 
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center ${className} ${
        loading || disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {loading ? loadingText : children}
    </button>
  )
}