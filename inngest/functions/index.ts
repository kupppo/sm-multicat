import { inngest } from '../client'

export const handleRace = inngest.createFunction(
  { id: 'handle-race' },
  { event: 'race/initiate' },
  async ({ event, step }) => {
    console.log(event, step)
  },
)
