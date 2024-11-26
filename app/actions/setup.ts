'use server'

import InertiaAPI from '@/lib/inertia'

export const confirmParticipation = async (id: string) => {
  const url = `/api/metafields`
  return InertiaAPI(url, {
    method: 'POST',
    payload: {
      model: 'userInTournament',
      modelId: id,
      key: 'participation',
      value: 'confirmed',
    },
  })
}
