"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { Socket } from "socket.io-client"
import { socketManager } from "@/lib/socket"
import { toast } from "@/hooks/use-toast"

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  emit: (event: string, data?: any) => void
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  emit: () => {},
})

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}

interface SocketProviderProps {
  children: React.ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socketInstance = socketManager.connect()
    setSocket(socketInstance)

    // Mock connection status for demo
    setIsConnected(true)

    // Set up event listeners for real-time updates
    const handlePatientAdmitted = (data: any) => {
      toast({
        title: "New Patient Admitted",
        description: `${data.name} has been admitted with ${data.condition}`,
      })
    }

    const handlePatientDischarged = (data: any) => {
      toast({
        title: "Patient Discharged",
        description: `Patient has been discharged from ${data.roomId}`,
      })
    }

    const handleRoomStatusChanged = (data: any) => {
      toast({
        title: "Room Status Updated",
        description: `${data.roomId} is now ${data.status}`,
      })
    }

    // Mock event listeners for demo
    ;(socketInstance as any)._listeners = {
      patient_admitted: [handlePatientAdmitted],
      patient_discharged: [handlePatientDischarged],
      room_status_changed: [handleRoomStatusChanged],
    }

    return () => {
      socketManager.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }, [])

  const emit = (event: string, data?: any) => {
    if (socket) {
      socket.emit(event, data)
    }
  }

  return <SocketContext.Provider value={{ socket, isConnected, emit }}>{children}</SocketContext.Provider>
}
