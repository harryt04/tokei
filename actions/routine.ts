'use server'

export const getRoutine = async (routineId: string, user?: { id?: string }) => {
  if (!user?.id) {
    return {
      notFound: true,
      error: new Error('Unauthorized'),
      status: 401,
      message: 'Unauthorized',
    }
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/routine?id=${routineId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    },
  )

  if (!response.ok) {
    return {
      notFound: true,
      error: response,
      status: response.status,
      message: response.statusText,
    }
  }

  return response.json()
}
