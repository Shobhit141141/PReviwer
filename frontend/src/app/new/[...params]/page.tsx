"use client"
import { NextPage } from 'next'
import { useParams } from 'next/navigation'

const ParamsPage: NextPage = () => {
  const params = useParams<{ params?: string[] }>().params

  if (!params || !Array.isArray(params)) return <div>Loading...</div>

  const [x, y, z] = params

  return (
    <div>
      <p>X: {x}</p>
      <p>Y: {y}</p>
      <p>Z: {z}</p>
    </div>
  )
}

export default ParamsPage
