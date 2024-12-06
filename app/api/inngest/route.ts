import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { handleRaceStart, handleModeSelection } from '@/inngest/functions'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [handleRaceStart, handleModeSelection],
})
