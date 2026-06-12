import type { Metadata } from 'next'
import DashboardLayout from '../dashboard/layout'

export const metadata: Metadata = { title: 'Search Opportunities' }

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
