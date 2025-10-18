"use client"

import { useEffect } from 'react'

/**
 * Console Error Filter Component
 * Filters out known browser extension errors that don't affect our application
 */
export function ConsoleErrorFilter() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    const originalError = console.error
    const originalWarn = console.warn

    // Known extension error patterns
    const extensionPatterns = [
      /chrome-extension:\/\//,
      /moz-extension:\/\//,
      /safari-extension:\/\//,
      /ms-browser-extension:\/\//,
      /ERR_FILE_NOT_FOUND.*extension/i,
      /net::ERR_FILE_NOT_FOUND.*extension/i,
      /utils\.js.*extension/i,
      /extensionState\.js/i,
      /heuristicsRedefinitions\.js/i
    ]

    const isExtensionError = (args: any[]): boolean => {
      const message = args.join(' ').toLowerCase()
      return extensionPatterns.some(pattern => pattern.test(message))
    }

    // Filter console.error
    console.error = (...args: any[]) => {
      if (!isExtensionError(args)) {
        originalError.apply(console, args)
      }
    }

    // Filter console.warn
    console.warn = (...args: any[]) => {
      if (!isExtensionError(args)) {
        originalWarn.apply(console, args)
      }
    }

    // Cleanup function
    return () => {
      console.error = originalError
      console.warn = originalWarn
    }
  }, [])

  return null // This component doesn't render anything
}

export default ConsoleErrorFilter