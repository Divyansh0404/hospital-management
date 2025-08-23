"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useSocket } from "@/components/socket-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Plus, UserMinus, Home, Search, Loader2 } from "lucide-react"
import { patientsAPI, roomsAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Patient {
  _id: string
  name: string
  age: number
  condition: string
  priority: number
  status: "Admitted" | "Discharged" | "Pending"
  assignedRoom: string | null | { _id: string; roomNumber: string; type: string; floor: number }
  admissionDate: string
  contactNumber: string
  medicalHistory?: string
  allergies?: string[]
  currentMedication?: Array<{
    name: string
    dosage: string
    frequency: string
  }>
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
}

interface Room {
  _id: string
  roomNumber: string
  type: string
  floor: number
  capacity: number
  occupied: boolean
  status: "Available" | "Occupied" | "Maintenance"
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    contactNumber: "",
    medicalHistory: "",
    allergies: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
  })

  const { emit } = useSocket()
  const { toast } = useToast()

  // Initialize with auth context
  useEffect(() => {
    fetchPatients()
    fetchRooms()
  }, [])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const response = await patientsAPI.getAll(1, 50) // Get more patients for demo
      if (response.success) {
        setPatients(response.data.patients)
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error)
      toast({
        title: "Error",
        description: "Failed to fetch patients data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRooms = async () => {
    try {
      const response = await roomsAPI.getAll(1, 50)
      if (response.success) {
        setRooms(response.data.rooms)
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    }
  }

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.assignedRoom && 
        (typeof patient.assignedRoom === 'object' 
          ? patient.assignedRoom.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
          : patient.assignedRoom.toLowerCase().includes(searchTerm.toLowerCase()))),
  )

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return "bg-destructive text-destructive-foreground"
      case 2:
        return "bg-orange-500 text-white"
      case 3:
        return "bg-yellow-500 text-white"
      case 4:
        return "bg-blue-500 text-white"
      case 5:
        return "bg-green-500 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1:
        return "Critical"
      case 2:
        return "High"
      case 3:
        return "Medium"
      case 4:
        return "Low"
      case 5:
        return "Normal"
      default:
        return "Unknown"
    }
  }

  const getStatusColor = (status: Patient["status"]) => {
    switch (status) {
      case "Admitted":
        return "bg-chart-1 text-white"
      case "Discharged":
        return "bg-muted text-muted-foreground"
      case "Pending":
        return "bg-orange-500 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const handleAddPatient = async () => {
    if (newPatient.name && newPatient.age && newPatient.contactNumber) {
      try {
        const patientData = {
          name: newPatient.name,
          age: Number.parseInt(newPatient.age),
          contactNumber: newPatient.contactNumber,
          medicalHistory: newPatient.medicalHistory || undefined,
          allergies: newPatient.allergies ? newPatient.allergies.split(',').map(a => a.trim()) : [],
          emergencyContact: {
            name: newPatient.emergencyContactName,
            phone: newPatient.emergencyContactPhone,
            relationship: newPatient.emergencyContactRelationship,
          },
        }
        
        const response = await patientsAPI.create(patientData)
        
        if (response.success) {
          await fetchPatients() // Refresh the list
          emit("patient_admitted", {
            patientId: response.data._id,
            name: response.data.name,
            condition: response.data.condition,
            priority: response.data.priority,
          })
          setNewPatient({
            name: "",
            age: "",
            contactNumber: "",
            medicalHistory: "",
            allergies: "",
            emergencyContactName: "",
            emergencyContactPhone: "",
            emergencyContactRelationship: "",
          })
          setIsAddModalOpen(false)
          toast({
            title: "Success",
            description: "Patient admitted successfully",
          })
        }
      } catch (error) {
        console.error('Failed to add patient:', error)
        toast({
          title: "Error",
          description: "Failed to admit patient",
          variant: "destructive",
        })
      }
    }
  }

  const handleDischarge = async (patientId: string) => {
    try {
      const response = await patientsAPI.discharge(patientId)
      
      if (response.success) {
        await fetchPatients() // Refresh the list
        emit("patient_discharged", {
          patientId,
        })
        toast({
          title: "Success",
          description: "Patient discharged successfully",
        })
      }
    } catch (error) {
      console.error('Failed to discharge patient:', error)
      toast({
        title: "Error",
        description: "Failed to discharge patient",
        variant: "destructive",
      })
    }
  }

  const handleAssignRoom = async (patientId: string, roomId: string) => {
    try {
      const response = await patientsAPI.assignRoom(patientId, roomId)
      
      if (response.success) {
        await fetchPatients() // Refresh the list
        await fetchRooms() // Refresh rooms to update occupancy
        emit("room_assigned", {
          patientId,
          roomId,
        })
        toast({
          title: "Success",
          description: "Room assigned successfully",
        })
      }
    } catch (error) {
      console.error('Failed to assign room:', error)
      toast({
        title: "Error",
        description: "Failed to assign room",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <DashboardLayout currentPage="patients">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading patients...</span>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="patients">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Patient Management</h2>
            <p className="text-muted-foreground">Manage patient admissions, discharges, and room assignments</p>
          </div>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Admit New Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Admit New Patient</DialogTitle>
                <DialogDescription>Enter the patient details to admit them to the hospital.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="age" className="text-right">
                    Age
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="contactNumber" className="text-right">
                    Contact Number
                  </Label>
                  <Input
                    id="contactNumber"
                    value={newPatient.contactNumber}
                    onChange={(e) => setNewPatient({ ...newPatient, contactNumber: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="medicalHistory" className="text-right">
                    Medical History
                  </Label>
                  <Input
                    id="medicalHistory"
                    value={newPatient.medicalHistory}
                    onChange={(e) => setNewPatient({ ...newPatient, medicalHistory: e.target.value })}
                    className="col-span-3"
                    placeholder="Optional"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="allergies" className="text-right">
                    Allergies
                  </Label>
                  <Input
                    id="allergies"
                    value={newPatient.allergies}
                    onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })}
                    className="col-span-3"
                    placeholder="Comma separated, optional"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="emergencyContactName" className="text-right">
                    Emergency Contact
                  </Label>
                  <Input
                    id="emergencyContactName"
                    value={newPatient.emergencyContactName}
                    onChange={(e) => setNewPatient({ ...newPatient, emergencyContactName: e.target.value })}
                    className="col-span-3"
                    placeholder="Contact name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="emergencyContactPhone" className="text-right">
                    Contact Phone
                  </Label>
                  <Input
                    id="emergencyContactPhone"
                    value={newPatient.emergencyContactPhone}
                    onChange={(e) => setNewPatient({ ...newPatient, emergencyContactPhone: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="emergencyContactRelationship" className="text-right">
                    Relationship
                  </Label>
                  <Input
                    id="emergencyContactRelationship"
                    value={newPatient.emergencyContactRelationship}
                    onChange={(e) => setNewPatient({ ...newPatient, emergencyContactRelationship: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddPatient}>
                  Admit Patient
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search Patients</CardTitle>
            <CardDescription>Find patients by name, condition, or room number</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Patients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Current Patients ({filteredPatients.length})</CardTitle>
            <CardDescription>Overview of all patients in the hospital</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Room</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient._id}>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell>{patient.age}</TableCell>
                    <TableCell>{patient.condition}</TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(patient.priority)}>{getPriorityLabel(patient.priority)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(patient.status)}>{patient.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {patient.assignedRoom 
                        ? (typeof patient.assignedRoom === 'object' 
                            ? patient.assignedRoom.roomNumber 
                            : patient.assignedRoom)
                        : "Not assigned"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {patient.status === "Admitted" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDischarge(patient._id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <UserMinus className="w-4 h-4 mr-1" />
                            Discharge
                          </Button>
                        )}
                        {!patient.assignedRoom && patient.status !== "Discharged" && (
                          <Select onValueChange={(roomId) => handleAssignRoom(patient._id, roomId)}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Assign Room" />
                            </SelectTrigger>
                            <SelectContent>
                              {rooms.filter(room => !room.occupied).map((room) => (
                                <SelectItem key={room._id} value={room._id}>
                                  {room.roomNumber}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  )
}
