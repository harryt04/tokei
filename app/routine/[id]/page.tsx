export default async function RoutinePage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const response = await fetch(`/api/routine?id=${id}`)
  console.log('response: ', response)
  console.log('id: ', id)
  return (
    <div>
      <h1>Routine ID: {id}</h1>
    </div>
  )
}
