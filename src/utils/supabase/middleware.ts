import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: DO NOT REMOVE auth.getUser()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Get user role if authenticated
    let userRole: string | null = null
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        userRole = profile?.role || null
    }

    // If user is authenticated and trying to access auth pages, redirect based on role
    // BUT allow access to update-password even if authenticated
    if (
        user &&
        (request.nextUrl.pathname.startsWith('/login') ||
         request.nextUrl.pathname.startsWith('/auth') ||
         request.nextUrl.pathname.startsWith('/signup')) &&
        !request.nextUrl.pathname.startsWith('/update-password') // 👈 Permitir update-password
    ) {
        const url = request.nextUrl.clone()
        // Redirect admins to /admin, others to /workspace
        url.pathname = userRole === 'admin' ? '/admin' : '/workspace'
        return NextResponse.redirect(url)
    }

    // If admin tries to access /workspace, redirect to /admin
    if (user && userRole === 'admin' && request.nextUrl.pathname.startsWith('/workspace')) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin'
        return NextResponse.redirect(url)
    }

    // If non-admin tries to access /admin, redirect to /workspace
    if (user && userRole !== 'admin' && request.nextUrl.pathname.startsWith('/admin')) {
        const url = request.nextUrl.clone()
        url.pathname = '/workspace'
        return NextResponse.redirect(url)
    }

    // If user is not authenticated and trying to access protected pages, redirect to login
    if (
        !user &&
        request.nextUrl.pathname !== '/' && // 👈 dejamos libre la raíz
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/auth') &&
        !request.nextUrl.pathname.startsWith('/signup') &&
        !request.nextUrl.pathname.startsWith('/forgot-password') &&
        !request.nextUrl.pathname.startsWith('/update-password') && // 👈 permitir update-password sin auth también
        request.nextUrl.pathname !== '/confirm' // 👈 permitir confirmación de email
    ) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}