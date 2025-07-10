import { useClientOnly } from "@/hooks/useClientOnly"

/**
 * Component wrapper để tránh hydration mismatch
 */
export function ClientOnly({ children, fallback = null }: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  const hasMounted = useClientOnly()
  
  if (!hasMounted) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}
