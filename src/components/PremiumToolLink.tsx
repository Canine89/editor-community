'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { toast } from 'sonner'

interface PremiumToolLinkProps {
  href: string
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function PremiumToolLink({ href, children, className, onClick }: PremiumToolLinkProps) {
  const { user } = useAuth()
  const { canAccessPremiumFeatures } = useRole()
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick()
    }

    // 로그인하지 않은 경우
    if (!user) {
      e.preventDefault()
      toast.error('로그인이 필요한 서비스입니다', {
        description: '프리미엄 도구를 사용하려면 먼저 로그인해주세요.',
        action: {
          label: '로그인',
          onClick: () => router.push('/auth')
        }
      })
      return
    }

    // 프리미엄 권한이 없는 경우
    if (!canAccessPremiumFeatures) {
      e.preventDefault()
      toast.error('프리미엄 기능입니다', {
        description: '이 도구를 사용하려면 프리미엄 구독이 필요합니다.',
        action: {
          label: '업그레이드',
          onClick: () => {
            // TODO: 실제 결제 페이지로 이동
            toast.info('결제 페이지는 준비 중입니다')
          }
        }
      })
      return
    }

    // 프리미엄 사용자는 정상 접근
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  )
}