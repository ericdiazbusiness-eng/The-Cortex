import { useContext } from 'react'
import { CortexContext } from '@/context/CortexContext'

export const useCortex = () => {
  const context = useContext(CortexContext)

  if (!context) {
    throw new Error('useCortex must be used within a CortexProvider')
  }

  return context
}
