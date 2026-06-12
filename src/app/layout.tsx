import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'CareerSphere AI – Career Intelligence Platform',
    template: '%s | CareerSphere AI',
  },
  description:
    'Discover scholarships, internships, hackathons, and fellowships powered by AI. Get personalized career recommendations based on your skills and resume.',
  keywords: [
    'internship finder',
    'scholarship search',
    'hackathon',
    'fellowship',
    'career AI',
    'job search',
    'resume analysis',
  ],
  openGraph: {
    type: 'website',
    siteName: 'CareerSphere AI',
    title: 'CareerSphere AI – Career Intelligence Platform',
    description: 'AI-powered career opportunity discovery and matching platform.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
