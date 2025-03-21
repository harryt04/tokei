import { FC } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

export interface NoResultsProps {
  icon: JSX.Element
  title: string
  body: string[]
  className?: string
}

export const NoResultsComponent: FC<NoResultsProps> = ({
  icon,
  title,
  body,
  className,
}) => {
  return (
    <Card className={`${className} p-6 text-center`}>
      <CardHeader className="flex flex-col items-center justify-center self-center justify-self-center">
        <div className="mb-4 text-4xl">{icon}</div>
        <CardTitle className="mb-2 text-xl font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center text-sm">
        {body.map((line, index) => (
          <p className="pb-2" key={index}>
            {line}
          </p>
        ))}
      </CardContent>
    </Card>
  )
}
