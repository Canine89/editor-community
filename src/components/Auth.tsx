'use client'

import { useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogIn, UserPlus } from 'lucide-react'

export default function AuthComponent() {
  const [view, setView] = useState<'sign_in' | 'sign_up'>('sign_in')
  const supabase = createClient()

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          시작하기
        </CardTitle>
        <CardDescription className="text-slate-600">
          편집자 커뮤니티에 참여하세요
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={view} onValueChange={(value) => setView(value as 'sign_in' | 'sign_up')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="sign_in" className="flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              로그인
            </TabsTrigger>
            <TabsTrigger value="sign_up" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              회원가입
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sign_in" className="space-y-4">
            <Auth
              supabaseClient={supabase}
              view="sign_in"
              appearance={{
                theme: ThemeSupa,
                style: {
                  button: {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: '8px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease-in-out',
                    border: 'none',
                    boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.2)',
                  },
                  anchor: {
                    color: '#6366f1',
                    textDecoration: 'none',
                    fontWeight: '500',
                  },
                  input: {
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    padding: '12px 16px',
                    fontSize: '14px',
                    transition: 'all 0.2s ease-in-out',
                  },
                  label: {
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '4px',
                  },
                  container: {
                    width: '100%',
                  },
                  divider: {
                    margin: '20px 0',
                    borderColor: '#e5e7eb',
                  },
                },
                className: {
                  button: 'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
                  input: 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400',
                  label: 'text-slate-700',
                },
              }}
              providers={['google']}
              localization={{
                variables: {
                  sign_in: {
                    email_label: '이메일 주소',
                    password_label: '비밀번호',
                    button_label: '로그인',
                    loading_button_label: '로그인 중...',
                    link_text: '계정이 없으신가요?',
                    social_provider_text: '구글로 계속하기',
                  },
                },
              }}
            />
          </TabsContent>

          <TabsContent value="sign_up" className="space-y-4">
            <Auth
              supabaseClient={supabase}
              view="sign_up"
              appearance={{
                theme: ThemeSupa,
                style: {
                  button: {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: '8px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease-in-out',
                    border: 'none',
                    boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.2)',
                  },
                  anchor: {
                    color: '#6366f1',
                    textDecoration: 'none',
                    fontWeight: '500',
                  },
                  input: {
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    padding: '12px 16px',
                    fontSize: '14px',
                    transition: 'all 0.2s ease-in-out',
                  },
                  label: {
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '4px',
                  },
                  container: {
                    width: '100%',
                  },
                  divider: {
                    margin: '20px 0',
                    borderColor: '#e5e7eb',
                  },
                },
                className: {
                  button: 'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
                  input: 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400',
                  label: 'text-slate-700',
                },
              }}
              providers={['google']}
              localization={{
                variables: {
                  sign_up: {
                    email_label: '이메일 주소',
                    password_label: '비밀번호',
                    button_label: '회원가입',
                    loading_button_label: '회원가입 중...',
                    link_text: '이미 계정이 있으신가요?',
                    social_provider_text: '구글로 계속하기',
                  },
                },
              }}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            계속 진행하면 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
