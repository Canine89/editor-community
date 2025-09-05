import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { JobPosting } from '@/lib/supabase/jobs'
import { MapPin, DollarSign, Calendar, Users, Monitor } from 'lucide-react'
import Link from 'next/link'

interface JobCardProps {
  job: JobPosting
}

export function JobCard({ job }: JobCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatEmploymentType = (type: string) => {
    const types = {
      'full-time': '정규직',
      'part-time': '파트타임',
      'freelance': '프리랜서',
      'contract': '계약직'
    }
    return types[type as keyof typeof types] || type
  }

  const getEmploymentTypeColor = (type: string) => {
    const colors = {
      'full-time': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'part-time': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'freelance': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'contract': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg hover:text-blue-600 transition-colors mb-2">
              <Link href={`/jobs/${job.id}`}>
                {job.role}
              </Link>
            </CardTitle>
            <div className="flex items-center gap-2 mb-3">
              <Badge className={getEmploymentTypeColor(job.employment_type)}>
                {formatEmploymentType(job.employment_type)}
              </Badge>
              {job.is_remote && (
                <Badge variant="outline">
                  <Monitor className="w-3 h-3 mr-1" />
                  원격근무
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* 급여 정보 */}
          {job.pay_range && (
            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <DollarSign className="w-4 h-4" />
              <span>{job.pay_range}</span>
            </div>
          )}

          {/* 위치 정보 */}
          {job.location && (
            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <MapPin className="w-4 h-4" />
              <span>{job.location}</span>
            </div>
          )}

          {/* 기술 스택 */}
          {job.skills && job.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {job.skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {job.skills.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{job.skills.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* 공고 설명 요약 */}
          <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2">
            {job.description}
          </p>

          {/* 메타 정보 */}
          <div className="flex items-center justify-between text-sm text-slate-500 pt-2 border-t">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{job.profiles?.nickname || '회사'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(job.created_at)}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/jobs/${job.id}`}>
                자세히 보기
              </Link>
            </Button>
          </div>

          {/* 마감일 표시 */}
          {job.due_date && (
            <div className="text-xs text-red-600 dark:text-red-400">
              마감일: {new Date(job.due_date).toLocaleDateString('ko-KR')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
