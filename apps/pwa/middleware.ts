import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Rotas publicas: raiz, login e cadastro
  const isPublicPath = path === '/' || path === '/login' || path === '/signup';

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Validacao REAL da sessao no servidor (nao apenas existencia de cookie)
  const { data: { user } } = await supabase.auth.getUser();

  // Rota protegida sem sessao valida -> login
  if (!isPublicPath && !user) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  // Rota publica com sessao valida -> dashboard
  if (isPublicPath && user) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/dashboard/:path*',
  ],
};
