import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Se não tem usuário, redireciona para login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Busca a role do usuário
  const { data: member } = await supabase
    .from('tenant_members')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  // Se não encontrou membro ou é worker, bloqueia acesso
  if (!member) {
    return NextResponse.redirect(new URL('/access-denied', request.url))
  }

  // Workers NÃO podem acessar o painel Owner - BLOQUEIO EXPLÍCITO
  if (member.role === 'worker') {
    return NextResponse.redirect(new URL('/access-denied', request.url))
  }

  // Apenas owner, solo e superadmin podem acessar
  const allowedRoles = ['owner', 'solo', 'superadmin']
  if (!allowedRoles.includes(member.role)) {
    return NextResponse.redirect(new URL('/access-denied', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|access-denied|unauthorized|api|.*\\.png$|.*\\.svg$|.*\\.ico$).*)',
  ],
}
