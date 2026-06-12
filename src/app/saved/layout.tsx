import type { Metadata } from 'next'
import DashboardLayout from '../dashboard/layout'

export const metadata: Metadata = { title: 'Saved Opportunities' }

export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
