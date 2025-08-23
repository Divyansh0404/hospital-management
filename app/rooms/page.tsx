"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bed, Users, UserPlus, UserMinus, Search, Loader2 } from "lucide-react"
import { roomsAPI, patientsAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Room {
  _id: string
  roomNumber: string
  type: string
  status: "Available" | "Occupied" | "Maintenance"
  floor: number
  capacity: number
  occupied: boolean
  patientId: string | null
  dailyRate: number
  amenities: string[]
  equipment: string[]
  lastCleaned: string
}

interface Patient {
  _id: string
  name: string
  status: "Admitted" | "Discharged" | "Pending"
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [availablePatients, setAvailablePatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState("")

  const { toast } = useToast()

  // Initialize and fetch data
  useEffect(() => {
    fetchRooms()
    fetchAvailablePatients()
  }, [])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const response = await roomsAPI.getAll(1, 50)
      if (response.success) {
        setRooms(response.data.rooms)
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
      toast({
        title: "Error",
        description: "Failed to fetch rooms data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailablePatients = async () => {
    try {
      const response = await patientsAPI.getAll(1, 50)
      if (response.success) {
        // Filter patients who are admitted but don't have assigned rooms
        const unassignedPatients = response.data.patients.filter(
          (patient: any) => patient.status === "Admitted" && !patient.assignedRoom
        )
        setAvailablePatients(unassignedPatients)
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error)
    }
  }

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || room.type === filterType
    const matchesStatus = filterStatus === "all" || room.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusColor = (status: Room["status"]) => {
    switch (status) {
      case "Available":
        return "bg-green-500 text-white"
      case "Occupied":
        return "bg-chart-1 text-white"
      case "Maintenance":
        return "bg-orange-500 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "ICU":
        return "bg-chart-2 text-white"
      case "Private":
        return "bg-chart-4 text-white"
      case "Emergency":
        return "bg-destructive text-destructive-foreground"
      case "General":
        return "bg-chart-3 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const handleFreeRoom = async (roomId: string) => {
    try {
      // First find the room to get the patient ID
      const room = rooms.find(r => r._id === roomId)
      if (room && room.patientId) {
        // Update the patient to remove room assignment
        await patientsAPI.update(room.patientId, { assignedRoom: null })
      }
      
      // Update the room status
      await roomsAPI.update(roomId, { 
        occupied: false, 
        patientId: null,
        status: "Available"
      })
      
      // Refresh the data
      await fetchRooms()
      await fetchAvailablePatients()
      
      toast({
        title: "Success",
        description: "Room freed successfully",
      })
    } catch (error) {
      console.error('Failed to free room:', error)
      toast({
        title: "Error",
        description: "Failed to free room",
        variant: "destructive",
      })
    }
  }

  const handleAssignPatient = async () => {
    if (selectedRoom && selectedPatient) {
      try {
        // Use the patients API to assign room
        await patientsAPI.assignRoom(selectedPatient, selectedRoom._id)
        
        // Refresh the data
        await fetchRooms()
        await fetchAvailablePatients()
        
        setIsAssignModalOpen(false)
        setSelectedRoom(null)
        setSelectedPatient("")
        
        toast({
          title: "Success",
          description: "Patient assigned to room successfully",
        })
      } catch (error) {
        console.error('Failed to assign patient:', error)
        toast({
          title: "Error",
          description: "Failed to assign patient to room",
          variant: "destructive",
        })
      }
    }
  }

  const roomStats = {
    total: rooms.length,
    available: rooms.filter((r) => r.status === "Available").length,
    occupied: rooms.filter((r) => r.status === "Occupied").length,
    maintenance: rooms.filter((r) => r.status === "Maintenance").length,
  }

  if (loading) {
    return (
      <DashboardLayout currentPage="rooms">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading rooms...</span>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="rooms">
      <div className="space-y-6">
        {/* Header Section */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Room Management</h2>
          <p className="text-muted-foreground">Monitor and manage hospital room assignments and availability</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roomStats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <div className="h-4 w-4 bg-green-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{roomStats.available}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupied</CardTitle>
              <div className="h-4 w-4 bg-chart-1 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-1">{roomStats.occupied}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
              <div className="h-4 w-4 bg-orange-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{roomStats.maintenance}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter Rooms</CardTitle>
            <CardDescription>Find rooms by number, patient name, type, or status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rooms or patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Room Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="ICU">ICU</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Private">Private</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Rooms Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRooms.map((room) => (
            <Card key={room._id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{room.roomNumber}</CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getTypeColor(room.type)}>{room.type}</Badge>
                    <Badge className={getStatusColor(room.status)}>{room.status}</Badge>
                  </div>
                </div>
                <CardDescription>
                  Floor {room.floor} • Capacity: {room.capacity} • ${room.dailyRate}/day
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {room.occupied && room.patientId && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Patient Assigned</span>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-1">
                    {room.amenities.map((item) => (
                      <Badge key={item} variant="outline" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  {room.status === "Occupied" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFreeRoom(room._id)}
                      className="flex-1 text-destructive hover:text-destructive"
                    >
                      <UserMinus className="w-4 h-4 mr-1" />
                      Free Room
                    </Button>
                  )}
                  {room.status === "Available" && (
                    <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRoom(room)}
                          className="flex-1 text-primary hover:text-primary"
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Assign Patient
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign Patient to {selectedRoom?.roomNumber}</DialogTitle>
                          <DialogDescription>Select a patient to assign to this room.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="patient" className="text-right">
                              Patient
                            </Label>
                            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a patient" />
                              </SelectTrigger>
                              <SelectContent>
                                {availablePatients.map((patient) => (
                                  <SelectItem key={patient._id} value={patient._id}>
                                    {patient.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleAssignPatient} disabled={!selectedPatient}>
                            Assign Patient
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  )
}
