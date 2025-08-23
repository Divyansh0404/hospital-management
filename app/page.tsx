"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Users, Building2, UserCheck, AlertTriangle, Loader2 } from "lucide-react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { statsAPI, patientsAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

interface DashboardStats {
  patients: {
    totalPatients: number
    admittedPatients: number
    criticalPatients: number
    unassignedPatients: number
  }
  rooms: {
    totalRooms: number
    occupiedRooms: number
    availableRooms: number
    maintenanceRooms: number
  }
  occupancyRate: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentPatients, setRecentPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    // Only fetch data when user is available
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Check if user is authenticated before making API calls
      if (!user) {
        setLoading(false)
        return
      }
      
      // Fetch overall stats
      const statsResponse = await statsAPI.getOverall()
      if (statsResponse.success) {
        setStats(statsResponse.data)
      }

      // Fetch recent patients
      const patientsResponse = await patientsAPI.getAll(1, 5)
      if (patientsResponse.success) {
        setRecentPatients(patientsResponse.data.patients)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <DashboardLayout currentPage="dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading dashboard...</span>
        </div>
      </DashboardLayout>
    )
  }

  const dashboardStats = [
    {
      title: "Total Patients",
      value: stats.patients.totalPatients.toString(),
      description: `${stats.patients.admittedPatients} currently admitted`,
      icon: Users,
      color: "text-chart-1",
    },
    {
      title: "Total Rooms",
      value: stats.rooms.totalRooms.toString(),
      description: "Across all departments",
      icon: Building2,
      color: "text-chart-3",
    },
    {
      title: "Available Rooms",
      value: stats.rooms.availableRooms.toString(),
      description: `${Math.round(stats.occupancyRate)}% occupancy rate`,
      icon: UserCheck,
      color: "text-chart-4",
    },
    {
      title: "Critical Patients",
      value: stats.patients.criticalPatients.toString(),
      description: "Requiring immediate attention",
      icon: AlertTriangle,
      color: "text-chart-2",
    },
  ]

  const roomOccupancyData = [
    { name: "Occupied", value: stats.rooms.occupiedRooms, fill: "hsl(var(--chart-1))" },
    { name: "Available", value: stats.rooms.availableRooms, fill: "hsl(var(--chart-4))" },
    { name: "Maintenance", value: stats.rooms.maintenanceRooms, fill: "hsl(var(--chart-2))" },
  ]

  const patientDistributionData = [
    { condition: "Critical", count: stats.patients.criticalPatients, fill: "hsl(var(--chart-2))" },
    { condition: "Admitted", count: stats.patients.admittedPatients, fill: "hsl(var(--chart-1))" },
    { condition: "Unassigned", count: stats.patients.unassignedPatients, fill: "hsl(var(--chart-4))" },
  ]

  const chartConfig = {
    occupied: {
      label: "Occupied",
      color: "hsl(var(--chart-1))",
    },
    available: {
      label: "Available",
      color: "hsl(var(--chart-4))",
    },
    critical: {
      label: "Critical",
      color: "hsl(var(--chart-2))",
    },
    stable: {
      label: "Stable",
      color: "hsl(var(--chart-1))",
    },
    normal: {
      label: "Normal",
      color: "hsl(var(--chart-4))",
    },
  }

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="dashboard">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back, {user?.name}</h2>
            <p className="text-muted-foreground">Here's what's happening at MedCare Hospital today.</p>
          </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Room Occupancy</CardTitle>
              <CardDescription>Current room utilization across departments</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roomOccupancyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {roomOccupancyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0]
                          return (
                            <ChartTooltipContent>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
                                <span className="font-medium">{data.name}:</span>
                                <span>{data.value} rooms</span>
                              </div>
                            </ChartTooltipContent>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-chart-1" />
                  <span className="text-sm text-muted-foreground">Occupied ({stats.rooms.occupiedRooms})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-chart-4" />
                  <span className="text-sm text-muted-foreground">Available ({stats.rooms.availableRooms})</span>
                </div>
                {stats.rooms.maintenanceRooms > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-chart-2" />
                    <span className="text-sm text-muted-foreground">Maintenance ({stats.rooms.maintenanceRooms})</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Patient Distribution</CardTitle>
              <CardDescription>Patients by condition severity</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={patientDistributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis
                      dataKey="condition"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="hsl(var(--chart-1))" />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <ChartTooltipContent>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].color }} />
                                <span className="font-medium">{label}:</span>
                                <span>{payload[0].value} patients</span>
                              </div>
                            </ChartTooltipContent>
                          )
                        }
                        return null
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Patients</CardTitle>
              <CardDescription>Latest patients in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPatients.slice(0, 3).map((patient) => (
                  <div key={patient._id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{patient.name}</p>
                      <p className="text-sm text-muted-foreground">{patient.condition}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {patient.assignedRoom 
                          ? (typeof patient.assignedRoom === 'object' 
                              ? patient.assignedRoom.roomNumber 
                              : patient.assignedRoom)
                          : "Room Pending"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(patient.admissionDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {recentPatients.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No patients found</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Critical Alerts</CardTitle>
              <CardDescription>Patients requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPatients
                  .filter(patient => patient.priority === 1)
                  .slice(0, 2)
                  .map((patient) => (
                    <div key={patient._id} className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <div className="flex-1">
                        <p className="font-medium">
                          {patient.name} - {patient.assignedRoom 
                            ? (typeof patient.assignedRoom === 'object' 
                                ? patient.assignedRoom.roomNumber 
                                : patient.assignedRoom)
                            : "Unassigned"}
                        </p>
                        <p className="text-sm text-muted-foreground">{patient.condition}</p>
                      </div>
                    </div>
                  ))}
                {recentPatients.filter(patient => patient.priority === 1).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No critical patients</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  )
}
