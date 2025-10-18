import type React from "react"
import type { Metadata } from "next"
import { SocketProvider } from "@/components/socket-provider"
import { AuthProvider } from "@/components/auth-provider"
import { ConsoleErrorFilter } from "@/components/console-error-filter"
import { ErrorBoundary } from "@/components/error-boundary"
import { Toaster } from "@/components/ui/toaster"
import "@/lib/error-suppression"
import "./globals.css"

export const metadata: Metadata = {
  title: "Hospital Room Management System",
  description: "Professional hospital room and patient management system",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&family=Open+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ConsoleErrorFilter />
        <ErrorBoundary>
          <AuthProvider>
            <SocketProvider>
              {children}
              <Toaster />
            </SocketProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
