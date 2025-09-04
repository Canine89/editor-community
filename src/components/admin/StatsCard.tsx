'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    type: 'increase' | 'decrease'
  }
  className?: string
}

export default function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className = ''
}: StatsCardProps) {
  return (
    <Card className={`${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-slate-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {(description || trend) && (
          <div className="flex items-center justify-between mt-1">
            {description && (
              <p className="text-xs text-slate-600">{description}</p>
            )}
            {trend && (
              <p className={`text-xs font-medium ${
                trend.type === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.type === 'increase' ? '+' : '-'}{Math.abs(trend.value)}%
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}