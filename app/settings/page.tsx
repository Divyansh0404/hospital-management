"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings as SettingsIcon,
  User,
  Bell,
  Smartphone
} from "lucide-react"
import { authAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { LoadingBar, AsyncButton } from "@/components/ui/loading"

interface PasswordStrength {
  score: number
  label: string
  color: string
  requirements: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    number: boolean
    special: boolean
  }
}

export default function SettingsPage() {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)
    }

    const metRequirements = Object.values(requirements).filter(Boolean).length
    
    let score = 0
    let label = ''
    let color = ''

    if (password.length === 0) {
      score = 0
      label = 'Enter a password'
      color = 'text-muted-foreground'
    } else if (metRequirements < 2) {
      score = 1
      label = 'Very weak'
      color = 'text-red-500'
    } else if (metRequirements < 3) {
      score = 2
      label = 'Weak'
      color = 'text-orange-500'
    } else if (metRequirements < 4) {
      score = 3
      label = 'Good'
      color = 'text-yellow-500'
    } else if (metRequirements < 5) {
      score = 4
      label = 'Strong'
      color = 'text-blue-500'
    } else {
      score = 5
      label = 'Very strong'
      color = 'text-green-500'
    }

    return { score, label, color, requirements }
  }

  const passwordStrength = calculatePasswordStrength(passwords.newPassword)

  const handlePasswordChange = (field: keyof typeof passwords, value: string) => {
    setPasswords(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const validatePasswords = (): boolean => {
    if (!passwords.currentPassword) {
      setError('Current password is required')
      return false
    }

    if (!passwords.newPassword) {
      setError('New password is required')
      return false
    }

    if (passwords.newPassword.length < 8) {
      setError('New password must be at least 8 characters long')
      return false
    }

    if (passwords.newPassword === passwords.currentPassword) {
      setError('New password must be different from current password')
      return false
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New password and confirmation do not match')
      return false
    }

    if (passwordStrength.score < 3) {
      setError('Password is too weak. Please choose a stronger password.')
      return false
    }

    return true
  }

  const handleChangePassword = async () => {
    if (!validatePasswords()) {
      return
    }

    try {
      setIsChangingPassword(true)
      setError('')

      const response = await authAPI.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      })

      if (response.success) {
        toast({
          title: "Success",
          description: "Password changed successfully",
        })
        
        // Reset form
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setShowPasswords({
          current: false,
          new: false,
          confirm: false
        })
      } else {
        setError(response.message || 'Failed to change password')
      }
    } catch (error: any) {
      console.error('Failed to change password:', error)
      setError('Failed to change password. Please try again.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const getPasswordStrengthBar = () => {
    const width = (passwordStrength.score / 5) * 100
    return (
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            passwordStrength.score === 1 ? 'bg-red-500' :
            passwordStrength.score === 2 ? 'bg-orange-500' :
            passwordStrength.score === 3 ? 'bg-yellow-500' :
            passwordStrength.score === 4 ? 'bg-blue-500' :
            passwordStrength.score === 5 ? 'bg-green-500' : 'bg-gray-300'
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
    )
  }

  const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center space-x-2 text-sm ${met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
      {met ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      <span>{text}</span>
    </div>
  )

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="settings">
        <div className="max-w-4xl mx-auto space-y-8">
          {isChangingPassword && <LoadingBar isLoading={true} />}
          
          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold text-foreground">Account Settings</h2>
            <p className="text-muted-foreground mt-1">
              Manage your account security and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Password Change Section */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lock className="h-5 w-5" />
                    <span>Change Password</span>
                  </CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        value={passwords.currentPassword}
                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                        placeholder="Enter your current password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility('current')}
                      >
                        {showPasswords.current ? 
                          <EyeOff className="h-4 w-4 text-gray-400" /> : 
                          <Eye className="h-4 w-4 text-gray-400" />
                        }
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        value={passwords.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        placeholder="Enter your new password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility('new')}
                      >
                        {showPasswords.new ? 
                          <EyeOff className="h-4 w-4 text-gray-400" /> : 
                          <Eye className="h-4 w-4 text-gray-400" />
                        }
                      </Button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {passwords.newPassword && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Password strength:</span>
                          <span className={`text-sm font-medium ${passwordStrength.color}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        {getPasswordStrengthBar()}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwords.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        placeholder="Confirm your new password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        {showPasswords.confirm ? 
                          <EyeOff className="h-4 w-4 text-gray-400" /> : 
                          <Eye className="h-4 w-4 text-gray-400" />
                        }
                      </Button>
                    </div>
                    
                    {/* Password Match Indicator */}
                    {passwords.confirmPassword && (
                      <div className="flex items-center space-x-2">
                        {passwords.newPassword === passwords.confirmPassword ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">Passwords match</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-red-600">Passwords don't match</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end">
                    <AsyncButton
                      onClick={handleChangePassword}
                      loading={isChangingPassword}
                      loadingText="Changing Password..."
                      disabled={!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Change Password
                    </AsyncButton>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Security Guidelines Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Password Requirements</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <RequirementItem 
                    met={passwordStrength.requirements.length} 
                    text="At least 8 characters" 
                  />
                  <RequirementItem 
                    met={passwordStrength.requirements.uppercase} 
                    text="One uppercase letter" 
                  />
                  <RequirementItem 
                    met={passwordStrength.requirements.lowercase} 
                    text="One lowercase letter" 
                  />
                  <RequirementItem 
                    met={passwordStrength.requirements.number} 
                    text="One number" 
                  />
                  <RequirementItem 
                    met={passwordStrength.requirements.special} 
                    text="One special character" 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <span>Security Tips</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="space-y-2">
                    <p>• Use a unique password for this account</p>
                    <p>• Avoid using personal information</p>
                    <p>• Consider using a password manager</p>
                    <p>• Change your password regularly</p>
                    <p>• Never share your password with others</p>
                  </div>
                </CardContent>
              </Card>

              {/* Coming Soon Features */}
              <Card className="opacity-75">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-muted-foreground">
                    <SettingsIcon className="h-5 w-5" />
                    <span>More Settings</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Coming soon
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                    <Bell className="h-4 w-4" />
                    <span>Notification Preferences</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                    <Smartphone className="h-4 w-4" />
                    <span>Two-Factor Authentication</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Privacy Settings</span>
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