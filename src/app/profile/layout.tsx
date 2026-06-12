import type { Metadata } from 'next'
import DashboardLayout from '../dashboard/layout'

export const metadata: Metadata = { title: 'Your Profile' }

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
