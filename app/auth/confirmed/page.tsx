import { Suspense } from 'react'
import ConfirmedClient from './ConfirmedClient'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ConfirmedClient />
    </Suspense>
  )
}