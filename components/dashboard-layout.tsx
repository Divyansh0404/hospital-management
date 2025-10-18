"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RealTimeIndicator } from "./real-time-indicator"
import { PageTransition } from "./page-transition"
import { useAuth } from "./auth-provider"
import { Home, Users, Building2, Menu, Bell, Settings, LogOut, User } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  currentPage: "dashboard" | "patients" | "rooms" | "profile" | "settings"
}

export function DashboardLayout({ children, currentPage }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home, current: currentPage === "dashboard" },
    { name: "Patients", href: "/patients", icon: Users, current: currentPage === "patients" },
    { name: "Rooms", href: "/rooms", icon: Building2, current: currentPage === "rooms" },
  ]

  const handleNavigation = (href: string, e: React.MouseEvent) => {
    e.preventDefault()
    setSidebarOpen(false)
    router.push(href)
  }

  const getUserInitials = (user: any) => {
    if (!user) return 'U'
    
    // Try to get initials from name field first
    if (user.name && typeof user.name === 'string') {
      return user.name
        .split(' ')
        .map((word: string) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    
    // Fallback to firstName and lastName
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    
    // Fallback to email
    if (user.email) {
      return user.email[0].toUpperCase()
    }
    
    return 'U'
  }

  const getUserDisplayName = (user: any) => {
    if (!user) return 'Loading...'
    
    if (user.name) return user.name
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
    if (user.username) return user.username
    
    return user.email || 'User'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:inset-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-sidebar-border">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-sidebar-foreground">MedCare Hospital</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.name}
                  onClick={(e) => handleNavigation(item.href, e)}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    item.current
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navbar */}
        <header className="bg-background border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="ml-4 text-xl font-bold text-foreground lg:ml-0">
                {currentPage === "dashboard" && "Dashboard"}
                {currentPage === "patients" && "Patient Management"}
                {currentPage === "rooms" && "Room Management"}
                {currentPage === "profile" && "My Profile"}
                {currentPage === "settings" && "Account Settings"}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <RealTimeIndicator />

              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/caring-doctor.png" alt={getUserDisplayName(user)} />
                      <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{getUserDisplayName(user)}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email || ''}</p>
                      <p className="text-xs leading-none text-muted-foreground font-medium">{user?.role || ''}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => handleNavigation('/profile', e)}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleNavigation('/settings', e)}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  )
}
