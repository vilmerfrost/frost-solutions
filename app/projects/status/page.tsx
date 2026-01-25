import { redirect } from 'next/navigation'

// This page is deprecated - redirect to main projects page
export default function ProjectStatusPage() {
  redirect('/projects')
}
