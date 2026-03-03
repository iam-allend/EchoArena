'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'

const HIDDEN_PATHS = ['/admin', '/contributor']

export default function NavbarWrapper() {
  const pathname = usePathname()
  const hidden = HIDDEN_PATHS.some(p => pathname.startsWith(p))
  if (hidden) return null
  return <Navbar />
}