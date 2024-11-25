'use server'

export const setFirstPlayer = async (playerId: string, matchId: string) => {
  const inertiaUrl = process.env.INERTIA_URL
  const inertiaToken = process.env.INERTIA_TOKEN
  const tournamentSlug = process.env.TOURNAMENT_SLUG
  // const updateReq = await fetch(
  //   `${inertiaUrl}/api/tournaments/${tournamentSlug}/matches/${matchId}/metafields`,
  //   {
  //     method: 'POST',
  //     headers: {
  //       authorization: `Bearer ${inertiaToken}`,
  //     },
  //     body: JSON.stringify({
  //       key: 'player_1',
  //       value: playerId,
  //     }),
  //   },
  // )
  // const update = await updateReq.json()
  // return update
  return true
}
