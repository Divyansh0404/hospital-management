"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  Building, 
  Edit3, 
  Save, 
  X, 
  Shield,
  Briefcase,
  MapPin,
  Activity,
  Users,
  Loader2
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { authAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { LoadingBar, AsyncButton } from "@/components/ui/loading"

interface UserProfile {
  _id: string
  username: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  employeeId: string
  department: string
  position: string
  shift: string
  isActive: boolean
  lastLogin: string | null
  createdAt: string
  updatedAt: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({})
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const response = await authAPI.getProfile()
      
      if (response.success) {
        setProfile(response.data.user)
        setEditedProfile({
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
          phone: response.data.user.phone,
          email: response.data.user.email
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to load profile information",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      toast({
        title: "Error",
        description: "Failed to load profile information",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)

      const response = await authAPI.updateProfile({
        firstName: editedProfile.firstName,
        lastName: editedProfile.lastName,
        phone: editedProfile.phone,
        email: editedProfile.email
      })

      if (response.success) {
        setProfile(response.data.user)
        setIsEditing(false)
        refreshUser()
        toast({
          title: "Success",
          description: "Profile updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update profile",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedProfile({
      firstName: profile?.firstName,
      lastName: profile?.lastName,
      phone: profile?.phone,
      email: profile?.email
    })
  }

  const getUserInitials = (profile: UserProfile | null) => {
    if (!profile) return 'U'
    return `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase()
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
      case 'administrator':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      case 'doctor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'nurse':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'staff':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout currentPage="profile">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading profile...</span>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!profile) {
    return (
      <ProtectedRoute>
        <DashboardLayout currentPage="profile">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Profile Not Found</h3>
              <p className="text-gray-500 dark:text-gray-400">Unable to load profile information.</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="profile">
        <div className="max-w-4xl mx-auto space-y-8">
          {isSaving && <LoadingBar isLoading={true} />}
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground">My Profile</h2>
              <p className="text-muted-foreground mt-1">
                View and manage your personal information
              </p>
            </div>
            
            {!isEditing ? (
              <Button 
                onClick={() => setIsEditing(true)} 
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit Profile</span>
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={handleCancelEdit}
                  variant="outline"
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <AsyncButton
                  onClick={handleSaveProfile}
                  loading={isSaving}
                  loadingText="Saving..."
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </AsyncButton>
              </div>
            )}
          </div>

          {/* Profile Header Card */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-32"></div>
            <CardContent className="relative pt-0 pb-6">
              <div className="flex items-start space-x-6 -mt-16">
                <Avatar className="h-32 w-32 border-4 border-white dark:border-gray-800 shadow-lg">
                  <AvatarImage src="/caring-doctor.png" alt={`${profile.firstName} ${profile.lastName}`} />
                  <AvatarFallback className="text-2xl font-bold bg-white text-gray-800">
                    {getUserInitials(profile)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 pt-20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">
                        {profile.firstName} {profile.lastName}
                      </h3>
                      <p className="text-lg text-muted-foreground">@{profile.username}</p>
                      <div className="flex items-center space-x-3 mt-2">
                        <Badge className={getRoleColor(profile.role)}>
                          <Shield className="h-3 w-3 mr-1" />
                          {profile.role}
                        </Badge>
                        <Badge variant="outline">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {profile.employeeId}
                        </Badge>
                        <Badge variant={profile.isActive ? "default" : "secondary"}>
                          <Activity className="h-3 w-3 mr-1" />
                          {profile.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Personal Information</span>
                </CardTitle>
                <CardDescription>
                  Basic information about your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    {isEditing ? (
                      <Input
                        id="firstName"
                        value={editedProfile.firstName || ''}
                        onChange={(e) => setEditedProfile(prev => ({ ...prev, firstName: e.target.value }))}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">{profile.firstName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    {isEditing ? (
                      <Input
                        id="lastName"
                        value={editedProfile.lastName || ''}
                        onChange={(e) => setEditedProfile(prev => ({ ...prev, lastName: e.target.value }))}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">{profile.lastName}</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Email Address</span>
                    </Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editedProfile.email || ''}
                        onChange={(e) => setEditedProfile(prev => ({ ...prev, email: e.target.value }))}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">{profile.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>Phone Number</span>
                    </Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        type="tel"
                        value={editedProfile.phone || ''}
                        onChange={(e) => setEditedProfile(prev => ({ ...prev, phone: e.target.value }))}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">{profile.phone}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employment Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Briefcase className="h-5 w-5" />
                    <span>Employment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Department</Label>
                    <p className="text-sm font-medium">{profile.department || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Position</Label>
                    <p className="text-sm font-medium">{profile.position || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Shift</Label>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {profile.shift}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Account Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Last Login</Label>
                    <p className="text-sm font-medium">{formatDate(profile.lastLogin)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Account Created</Label>
                    <p className="text-sm font-medium">{formatDate(profile.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Last Updated</Label>
                    <p className="text-sm font-medium">{formatDate(profile.updatedAt)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}