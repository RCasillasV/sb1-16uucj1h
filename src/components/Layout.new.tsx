import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Users, Calendar, LayoutDashboard, FileText, Activity, Settings as SettingsIcon, LogOut } from 'lucide-react'
import { useSelectedPatient } from '../contexts/SelectedPatientContext'
import { useTheme } from '../contexts/ThemeContext'
import clsx from 'clsx'

// Memoized navigation items
const navigation = {
  main: [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Agenda2', href: '/agenda2', icon: Calendar },
    { name: 'Full', href: '/agenda/full', icon: Calendar },
    { name: 'Pacientes', href: '/patients', icon: Users },
    { name: 'Historia Clínica', href: '/clinical-history', icon: FileText },
    { name: 'Evolución Clínica', href: '/clinical-evolution', icon: Activity },
  ],
  bottom: [
    { name: 'Configuración', href: '/settings', icon: SettingsIcon },
    { name: 'Cerrar Sesión', href: '/login', icon: LogOut },
  ],
} as const

const NavLink = React.memo(({ item, isActive }: { item: typeof navigation.main[number] | typeof navigation.bottom[number], isActive: boolean }) => (
  <Link
    to={item.href}
    className={clsx(
      'flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
      isActive
        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
    )}
  >
    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
    <span className="truncate">{item.name}</span>
  </Link>
))

NavLink.displayName = 'NavLink'

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { selectedPatient } = useSelectedPatient()
  const { currentTheme } = useTheme()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const renderNavLinks = useCallback((items: typeof navigation.main | typeof navigation.bottom) => (
    items.map(item => (
      <NavLink
        key={item.name}
        item={item}
        isActive={location.pathname === item.href}
      />
    ))
  ), [location.pathname])

  const mainNavLinks = useMemo(() => renderNavLinks(navigation.main), [renderNavLinks])
  const bottomNavLinks = useMemo(() => renderNavLinks(navigation.bottom), [renderNavLinks])

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <aside className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transition-transform duration-200 ease-in-out',
          isMobile && '-translate-x-full'
        )}>
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto py-4 px-3">
              <nav className="space-y-1">
                {mainNavLinks}
              </nav>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 py-4 px-3">
              <nav className="space-y-1">
                {bottomNavLinks}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className={clsx(
          'flex-1 transition-all duration-200',
          !isMobile && 'ml-64'
        )}>
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
