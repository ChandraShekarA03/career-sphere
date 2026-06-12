import type { Metadata } from 'next'
import DashboardLayout from '../dashboard/layout'

export const metadata: Metadata = { title: 'Resume Analysis' }

export default function ResumeLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
