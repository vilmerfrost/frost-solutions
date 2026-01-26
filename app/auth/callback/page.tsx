'use client';
import { useEffect, Suspense } from 'react';
import { supabase } from '@/utils/supabase/supabaseClient';
import { useSearchParams, useRouter } from 'next/navigation';
import { BASE_PATH } from '@/utils/url';
import { apiFetch } from '@/lib/http/fetcher';

function CallbackContent() {
 const searchParams = useSearchParams();
 const router = useRouter();
 // Ensure redirectTo includes BASE_PATH for window.location.href usage
 const rawRedirect = searchParams?.get('redirect') || '/dashboard';
 let redirectTo = rawRedirect.startsWith(BASE_PATH) ? rawRedirect : `${BASE_PATH}${rawRedirect}`;

 useEffect(() => {
  let mounted = true;

  async function handleCallback() {
   try {
    // Step 1: Check for errors in query parameters first (Supabase/OAuth returns errors in query params)
    const error = searchParams?.get('error');
    const errorCode = searchParams?.get('error_code');
    const errorDescription = searchParams?.get('error_description');
    
    // Also check for Microsoft-specific error format
    const msError = searchParams?.get('error_reason');
    const msErrorDesc = searchParams?.get('error_description'); // Microsoft uses same param
    
    // Log all query params for debugging
    console.log('OAuth callback params:', {
     error: error || '(none)',
     errorCode: errorCode || '(none)', 
     errorDescription: errorDescription || '(none)',
     msError: msError || '(none)',
     allParams: searchParams?.toString() || '(none)',
    });
    
    if (error || errorCode || msError) {
     const actualError = error || msError || 'unknown';
     const actualDescription = errorDescription || msErrorDesc || '';
     
     console.error('OAuth error detected:', { 
      error: actualError, 
      errorCode: errorCode || '(none)', 
      errorDescription: actualDescription,
     });
     
     // Build error message for redirect
     let errorMessage = 'auth_failed';
     if (errorCode === 'flow_state_not_found') {
      errorMessage = 'session_expired';
     } else if (actualError === 'server_error') {
      errorMessage = 'server_error';
     } else if (actualError === 'access_denied') {
      errorMessage = 'access_denied';
     } else if (actualError === 'invalid_request') {
      errorMessage = 'invalid_request';
     } else if (actualError !== 'unknown') {
      errorMessage = actualError;
     }
     
     if (mounted) {
      router.replace(`/login?error=${errorMessage}${actualDescription ? `&message=${encodeURIComponent(actualDescription)}` : ''}`);
     }
     return;
    }
    
    // Step 1.1: Check if we have a valid code (authorization code flow)
    const code = searchParams?.get('code');
    if (!code && !window.location.hash) {
     console.log('No code or hash present, checking for session...');
    }
    
    // Step 1.5: Check if there's a hash in the URL (OAuth redirect)
    const hash = window.location.hash;
    
    // Step 1.6: Check for errors in the hash as well (some OAuth flows use hash)
    if (hash && mounted) {
     try {
      const hashParams = new URLSearchParams(hash.substring(1)); // Remove #
      const hashError = hashParams.get('error');
      const hashErrorCode = hashParams.get('error_code');
      const hashErrorDescription = hashParams.get('error_description');
      
      if (hashError || hashErrorCode) {
       console.error('OAuth error in hash:', { error: hashError, errorCode: hashErrorCode, errorDescription: hashErrorDescription });
       
       // Build error message for redirect
       let errorMessage = 'auth_failed';
       if (hashErrorCode === 'flow_state_not_found') {
        errorMessage = 'session_expired';
       } else if (hashError === 'server_error') {
        errorMessage = 'server_error';
       } else if (hashError) {
        errorMessage = hashError;
       }
       
       if (mounted) {
        router.replace(`/login?error=${errorMessage}${hashErrorDescription ? `&message=${encodeURIComponent(hashErrorDescription)}` : ''}`);
       }
       return;
      }
     } catch (parseError) {
      console.error('Error parsing hash for errors:', parseError);
      // Continue to try getting session anyway
     }
    }
    
    // Step 2: Try to get session - createBrowserClient should handle hash automatically
    // But we need to wait for it to process
    let session = null;
    let attempts = 0;
    const maxAttempts = 15;

    while (!session && attempts < maxAttempts && mounted) {
     const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
     
     if (sessionData?.session) {
      session = sessionData.session;
      break;
     }

     // Log for debugging
     if (attempts === 0) {
      console.log('Waiting for session, hash present:', !!hash, 'Error:', sessionError);
     }

     // If no session yet, wait a bit and try again
     await new Promise(resolve => setTimeout(resolve, 300));
     attempts++;
    }

    // If still no session and we have a hash, try to manually parse it
    if (!session && hash && mounted) {
     console.log('No session from getSession, trying to parse hash manually');
     try {
      // Parse hash manually: #access_token=xxx&refresh_token=yyy&type=recovery
      const hashParams = new URLSearchParams(hash.substring(1)); // Remove #
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
       console.log('Found tokens in hash, setting session');
       // Set session manually using setSession
       const { data: setSessionData, error: setError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
       });

       if (setSessionData?.session) {
        session = setSessionData.session;
       } else {
        console.error('Failed to set session from hash:', setError);
       }
      }
     } catch (parseError) {
      console.error('Error parsing hash:', parseError);
     }
    }

    if (!session || !mounted) {
     console.error('No session found after all attempts. Hash:', hash ? hash.substring(0, 50) + '...' : 'none');
     if (mounted) {
      router.replace('/login?error=no_session');
     }
     return;
    }

    console.log('Session found, setting cookies...');

    // Step 3: Set cookies on server
    try {
     await apiFetch('/api/auth/set-session', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
       access_token: session.access_token,
       refresh_token: session.refresh_token,
      }),
     });
    } catch (setSessionErr) {
     console.error('Failed to set session cookies:', setSessionErr);
     if (mounted) {
      router.replace('/login?error=session_failed');
     }
     return;
    }

    console.log('Cookies set, verifying...');

    // Step 4: Wait for cookies to be set and verify via Supabase auth
    let cookiesSet = false;
    for (let i = 0; i < 5; i++) {
     await new Promise(resolve => setTimeout(resolve, 300));
     if (!mounted) return;
     
     try {
      const { data: { user: verifyUser } } = await supabase.auth.getUser();
      if (verifyUser) {
       cookiesSet = true;
       break;
      }
     } catch (e) {
      // Continue retrying
     }
    }
    
    if (!cookiesSet) {
     console.error('Session not established after multiple retries');
     if (mounted) {
      router.replace('/login?error=cookies_failed');
     }
     return;
    }

    // Step 5: Get user (should work now that session is established)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
     console.error('Failed to get user:', userError);
     if (mounted) {
      router.replace('/login?error=no_user');
     }
     return;
    }

    console.log('User found:', user.id);

    // Step 6: Link employee record to auth_user_id if needed (based on email)
    // This handles the case where employee was created before user logged in
    try {
     const linkData = await apiFetch('/api/auth/link-employee', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
       userId: user.id,
       email: user.email,
      }),
     });
     console.log('Employee linking result:', linkData);
    } catch (linkErr) {
     console.warn('Failed to link employee:', linkErr);
     // Continue anyway
    }

    // Step 7: Try to get tenant
    try {
     const tenantData = await apiFetch<{ tenantId?: string }>('/api/tenant/get-current', {
      credentials: 'include',
      cache: 'no-store',
     });

     if (tenantData?.tenantId) {
      console.log('Found tenant:', tenantData.tenantId);
      // Set tenant in metadata
      try {
       await apiFetch('/api/auth/set-tenant', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
         tenantId: tenantData.tenantId,
         userId: user.id,
        }),
       });
      } catch (setTenantErr) {
       console.warn('Failed to set tenant:', setTenantErr);
      }
      
      // Update redirect to dashboard if tenant found and redirect was onboarding
      if (redirectTo === `${BASE_PATH}/onboarding` || rawRedirect === '/onboarding') {
       redirectTo = `${BASE_PATH}/dashboard`;
      }
     } else {
      console.log('No tenant found for user');
      // If no tenant, redirect to onboarding
      if (mounted) {
       window.location.href = `${BASE_PATH}/onboarding`;
       return;
      }
     }
    } catch (tenantErr) {
     console.warn('Failed to get/set tenant:', tenantErr);
     // If error getting tenant, redirect to onboarding
     if (mounted) {
      window.location.href = `${BASE_PATH}/onboarding`;
      return;
     }
    }

    // Step 8: Clear hash from URL before redirect
    if (hash && mounted) {
     window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    // Step 9: Final redirect
    if (mounted) {
     // Wait one final moment to ensure everything is synced
     await new Promise(resolve => setTimeout(resolve, 300));
     // Use window.location for full page reload to ensure cookies are read by server
     window.location.href = redirectTo;
    }
   } catch (error) {
    console.error('Callback error:', error);
    if (mounted) {
     router.replace('/login?error=callback_failed');
    }
   }
  }

  handleCallback();

  return () => {
   mounted = false;
  };
 }, [redirectTo, router]);

 return (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
   <div className="text-center">
    <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-purple-600 mx-auto mb-6"></div>
    <h2 className="text-xl font-bold text-gray-900 mb-2">Loggar in...</h2>
    <p className="text-gray-500 text-sm">Bearbetar inloggning...</p>
   </div>
  </div>
 );
}

export default function CallbackPage() {
 return (
  <Suspense
   fallback={
    <div className="min-h-screen flex items-center justify-center bg-white">
     <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Laddar...</p>
     </div>
    </div>
   }
  >
   <CallbackContent />
  </Suspense>
 );
}
