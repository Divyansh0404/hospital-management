"use client"

import { useSocket } from "./socket-provider"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff } from "lucide-react"

export function RealTimeIndicator() {
  const { isConnected } = useSocket()

  return (
    <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
      {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
      {isConnected ? "Live" : "Offline"}
    </Badge>
  )
}
