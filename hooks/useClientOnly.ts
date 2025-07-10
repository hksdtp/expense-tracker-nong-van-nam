import { useEffect, useState } from 'react'

/**
 * Hook để tránh hydration mismatch
 * Chỉ render content sau khi component đã mount trên client
 */
export function useClientOnly() {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  return hasMounted
}
