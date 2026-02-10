'use client'

// This page is a redirect to the proper client payment methods page.
// Kept for backwards compatibility with old links.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AddPaymentMethodRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/cliente/payment-methods/add')
  }, [router])

  return (
    <div className="flex justify-center items-center min-h-screen">
      Redirecionando...
    </div>
  )
}
