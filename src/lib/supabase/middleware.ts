import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  });

  // Check if environment variables are set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    return { supabaseResponse, user: null };
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              supabaseResponse.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<{ data: { user: null }, error: { message: string } }>((resolve) => {
      setTimeout(() => {
        resolve({ data: { user: null }, error: { message: 'Auth check timeout' } });
      }, 3000); // 3 second timeout
    });

    // Race between getUser and timeout
    const result = await Promise.race([
      supabase.auth.getUser(),
      timeoutPromise
    ]);

    const { data: { user }, error } = result;

    if (error) {
      if (error.message !== 'Auth session missing!') {
        console.error('Error getting user:', error.message);
      }
      return { supabaseResponse, user: null };
    }

    // Don't update last_login in middleware - it slows things down
    // We can update it in the AuthContext instead

    return { supabaseResponse, user };
  } catch (error: unknown) {
    console.error('Middleware error:', error instanceof Error ? error.message : 'Unknown error');
    return { supabaseResponse, user: null };
  }
}

