"use client"

import { io, type Socket } from "socket.io-client"

class SocketManager {
  private socket: Socket | null = null
  private static instance: SocketManager

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager()
    }
    return SocketManager.instance
  }

  connect(): Socket {
    if (!this.socket) {
      // Connect to the backend server
      this.socket = io("http://localhost:3001", {
        autoConnect: true,
        transports: ['websocket', 'polling'],
        timeout: 5000,
      })

      // Handle connection events
      this.socket.on('connect', () => {
        console.log('[Socket.IO] Connected to server')
        // Auto-join hospital updates room
        this.socket?.emit('join-room', 'hospital-updates')
      })

      this.socket.on('disconnect', (reason) => {
        console.log('[Socket.IO] Disconnected:', reason)
      })

      this.socket.on('connect_error', (error) => {
        console.error('[Socket.IO] Connection error:', error)
      })

      this.socket.on('connected', (data) => {
        console.log('[Socket.IO] Server message:', data.message)
      })

      // Listen to real-time events
      this.setupEventListeners()
    }

    return this.socket
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return

    // Patient events
    this.socket.on('patientAdmitted', (data) => {
      console.log('[Socket.IO] Patient admitted:', data)
    })

    this.socket.on('patientUpdated', (data) => {
      console.log('[Socket.IO] Patient updated:', data)
    })

    this.socket.on('patientDischarged', (data) => {
      console.log('[Socket.IO] Patient discharged:', data)
    })

    // Room events
    this.socket.on('roomAssigned', (data) => {
      console.log('[Socket.IO] Room assigned:', data)
    })

    this.socket.on('roomReleased', (data) => {
      console.log('[Socket.IO] Room released:', data)
    })

    this.socket.on('roomStatusChanged', (data) => {
      console.log('[Socket.IO] Room status changed:', data)
    })

    this.socket.on('roomCreated', (data) => {
      console.log('[Socket.IO] Room created:', data)
    })

    this.socket.on('roomUpdated', (data) => {
      console.log('[Socket.IO] Room updated:', data)
    })

    this.socket.on('roomDeleted', (data) => {
      console.log('[Socket.IO] Room deleted:', data)
    })

    // Auto-allocation events
    this.socket.on('autoAllocationComplete', (data) => {
      console.log('[Socket.IO] Auto allocation complete:', data)
    })
  }

  getSocket(): Socket | null {
    return this.socket
  }

  // Utility method to emit events
  emit(event: string, data?: any): void {
    if (this.socket) {
      this.socket.emit(event, data)
    }
  }

  // Utility method to listen to events
  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  // Utility method to remove event listeners
  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }
}

// Export singleton instance
export const socketManager = SocketManager.getInstance()
