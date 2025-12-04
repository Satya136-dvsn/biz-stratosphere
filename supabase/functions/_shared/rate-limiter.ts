import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
}

export async function checkRateLimit(
  req: Request,
  endpoint: string,
  userId?: string
): Promise<RateLimitResult> {
  try {
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const xForwardedFor = req.headers.get('x-forwarded-for');
    const xRealIp = req.headers.get('x-real-ip');
    const ipAddress = xForwardedFor?.split(',')[0] || xRealIp || 'unknown';

    // Get user's company and rate limits
    let companyId: string | null = null;
    let rateLimits: any = null;

    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', userId)
        .single();

      if (profile?.company_id) {
        companyId = profile.company_id;

        const { data: limits } = await supabase
          .from('rate_limits')
          .select('*')
          .eq('company_id', companyId)
          .eq('endpoint_pattern', endpoint)
          .single();

        rateLimits = limits;
      }
    }

    // Default rate limits if not found
    if (!rateLimits) {
      rateLimits = {
        max_requests: 50,
        time_window_minutes: 60,
        subscription_tier: 'basic'
      };
    }

    const timeWindowMs = rateLimits.time_window_minutes * 60 * 1000;
    const now = new Date();
    const windowStart = new Date(now.getTime() - timeWindowMs);

    // Count recent requests
    const { count } = await supabase
      .from('api_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .gte('created_at', windowStart.toISOString());

    const currentRequests = count || 0;
    const allowed = currentRequests < rateLimits.max_requests;

    // Log this request
    if (userId) {
      const startTime = performance.now();
      
      // We'll update this with response time and status code after the request completes
      await supabase
        .from('api_usage')
        .insert({
          user_id: userId,
          company_id: companyId,
          endpoint,
          method: req.method,
          ip_address: ipAddress,
          user_agent: userAgent,
          status_code: allowed ? null : 429,
          response_time_ms: null
        });
    }

    const resetTime = new Date(windowStart.getTime() + timeWindowMs).getTime();
    const remaining = Math.max(0, rateLimits.max_requests - currentRequests - 1);

    return {
      allowed,
      remaining,
      resetTime,
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    return {
      allowed: true, // Allow requests if rate limiting fails
      remaining: 0,
      resetTime: Date.now() + 60000,
      error: 'Rate limiting service unavailable'
    };
  }
}

export async function updateApiUsage(
  userId: string,
  endpoint: string,
  statusCode: number,
  responseTimeMs: number
) {
  try {
    // Update the most recent API usage record with response details
    await supabase
      .from('api_usage')
      .update({
        status_code: statusCode,
        response_time_ms: responseTimeMs
      })
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .eq('status_code', null)
      .order('created_at', { ascending: false })
      .limit(1);
  } catch (error) {
    console.error('Error updating API usage:', error);
  }
}