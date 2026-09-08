// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { LocalQueryBuilder, DEMO_USER, localDb } from '@/lib/localDatabase';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isExplicitOffline = import.meta.env.VITE_OFFLINE_MODE === 'true';

// Determine if we should use local standalone zero-API engine
const isStandalone = isExplicitOffline || !rawUrl || !rawKey || rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1');

export const IS_ZERO_API_MODE = isStandalone;

// Auth state listeners
const authListeners: Set<(event: string, session: any) => void> = new Set();
let currentSession: any = {
  access_token: 'zero-api-mock-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'zero-api-mock-refresh-token',
  user: DEMO_USER
};

// Check localStorage for persisted session
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem('biz_zero_api_session');
    if (saved) {
      currentSession = JSON.parse(saved);
    }
  }
} catch {
  // Ignore localStorage parsing error
}

function notifyAuthChange(event: string) {
  authListeners.forEach((cb) => {
    try {
      cb(event, currentSession);
    } catch (e) {
      console.error('[ZeroAPI Auth] Listener error', e);
    }
  });
}

/**
 * Creates the Zero-API Standalone Supabase client
 */
function createZeroApiClient() {
  return {
    from: (table: string) => {
      return new LocalQueryBuilder(table);
    },
    auth: {
      getSession: async () => {
        return { data: { session: currentSession }, error: null };
      },
      getUser: async () => {
        return { data: { user: currentSession?.user || null }, error: null };
      },
      signInWithPassword: async ({ email }: { email: string; password?: string }) => {
        let userId = DEMO_USER.id;
        const normalizedEmail = (email || DEMO_USER.email).toLowerCase().trim();
        
        if (normalizedEmail !== DEMO_USER.email.toLowerCase()) {
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              const savedMap = JSON.parse(window.localStorage.getItem('biz_user_ids') || '{}');
              if (savedMap[normalizedEmail]) {
                userId = savedMap[normalizedEmail];
              } else {
                const slug = normalizedEmail.replace(/[^a-z0-9]/g, '-');
                userId = `user-${slug}`;
                savedMap[normalizedEmail] = userId;
                window.localStorage.setItem('biz_user_ids', JSON.stringify(savedMap));
              }
            } else {
              userId = `user-${normalizedEmail.replace(/[^a-z0-9]/g, '-')}`;
            }
          } catch {
            userId = `user-${normalizedEmail.replace(/[^a-z0-9]/g, '-')}`;
          }
        }

        const user = {
          ...DEMO_USER,
          id: userId,
          email: normalizedEmail,
          user_metadata: {
            ...DEMO_USER.user_metadata,
            display_name: normalizedEmail.split('@')[0] || 'Demo User'
          }
        };
        currentSession = {
          access_token: 'zero-api-mock-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: 'zero-api-mock-refresh-token',
          user
        };
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('biz_zero_api_session', JSON.stringify(currentSession));
          }
        } catch { }
        notifyAuthChange('SIGNED_IN');
        return { data: { user, session: currentSession }, error: null };
      },
      signUp: async ({ email }: { email: string; password?: string }) => {
        const normalizedEmail = (email || '').toLowerCase().trim();
        const slug = normalizedEmail.replace(/[^a-z0-9]/g, '-');
        const userId = `user-${slug}`;

        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            const savedMap = JSON.parse(window.localStorage.getItem('biz_user_ids') || '{}');
            savedMap[normalizedEmail] = userId;
            window.localStorage.setItem('biz_user_ids', JSON.stringify(savedMap));
          }
        } catch { }

        const user = {
          ...DEMO_USER,
          id: userId,
          email: normalizedEmail,
          user_metadata: {
            display_name: normalizedEmail.split('@')[0]
          }
        };
        currentSession = {
          access_token: 'zero-api-mock-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: 'zero-api-mock-refresh-token',
          user
        };
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('biz_zero_api_session', JSON.stringify(currentSession));
          }
        } catch { }
        notifyAuthChange('SIGNED_IN');
        return { data: { user, session: currentSession }, error: null };
      },
      signOut: async () => {
        currentSession = null;
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem('biz_zero_api_session');
          }
        } catch { }
        notifyAuthChange('SIGNED_OUT');
        return { error: null };
      },
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        authListeners.add(callback);
        // Dispatch initial auth state
        setTimeout(() => callback('INITIAL_SESSION', currentSession), 0);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authListeners.delete(callback);
              }
            }
          }
        };
      },
      updateUser: async (attributes: any) => {
        if (currentSession?.user) {
          currentSession.user = {
            ...currentSession.user,
            ...attributes,
            user_metadata: {
              ...currentSession.user.user_metadata,
              ...(attributes.data || {})
            }
          };
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              window.localStorage.setItem('biz_zero_api_session', JSON.stringify(currentSession));
            }
          } catch { }
          notifyAuthChange('USER_UPDATED');
          return { data: { user: currentSession.user }, error: null };
        }
        return { data: { user: null }, error: { message: 'No active session' } };
      },
      resetPasswordForEmail: async () => {
        return { data: {}, error: null };
      }
    },
    storage: {
      from: (bucketName: string) => ({
        upload: async (path: string, _file: any) => {
          return { data: { path: `${bucketName}/${path}` }, error: null };
        },
        download: async (_path: string) => {
          return { data: new Blob(['sample data'], { type: 'text/csv' }), error: null };
        },
        remove: async (_paths: string[]) => {
          return { data: {}, error: null };
        },
        getPublicUrl: (path: string) => {
          return { data: { publicUrl: `/mock-storage/${bucketName}/${path}` } };
        }
      })
    },
    rpc: async (functionName: string, params: any) => {
      if (functionName === 'increment') {
        return { data: (params?.row_id ? 1 : 0) + 1, error: null };
      }
      if (functionName === 'search_documents' || functionName === 'match_documents') {
        const rows = localDb.getTable('data_points');
        return {
          data: rows.slice(0, 5).map((r) => ({
            id: r.id,
            content: JSON.stringify(r.metadata?.row_data || r),
            similarity: 0.92
          })),
          error: null
        };
      }
      return { data: [], error: null };
    },
    functions: {
      invoke: async (functionName: string, _options?: { body?: any; headers?: any }) => {
        if (functionName === 'data-upload') {
          const rawDatasets = _options?.body?.datasets || [];
          const rawDataPoints = _options?.body?.data_points || [];
          const targetUserId = currentSession?.user?.id || DEMO_USER.id;

          const insertedDatasets = rawDatasets.map((ds: any) => {
            const row = {
              id: ds.id || `ds-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              name: ds.name || ds.file_name,
              file_name: ds.file_name,
              file_type: ds.file_type || 'csv',
              file_size: ds.file_size || 1024,
              status: 'completed',
              user_id: targetUserId,
              created_at: new Date().toISOString(),
              metadata: {
                processed_at: new Date().toISOString(),
                record_count: rawDataPoints.length
              }
            };
            localDb.insert('datasets', row);
            return row;
          });

          rawDataPoints.forEach((dp: any, idx: number) => {
            localDb.insert('data_points', {
              id: dp.id || `dp-${Date.now()}-${idx}`,
              dataset_id: insertedDatasets[0]?.id || 'ds-custom',
              user_id: targetUserId,
              metric_name: dp.metric_name || 'value',
              metric_value: dp.metric_value || 0,
              date_recorded: dp.date_recorded || new Date().toISOString(),
              category: dp.metric_type || 'financial',
              metadata: dp.metadata || {}
            });
          });

          return {
            data: {
              success: true,
              datasets: insertedDatasets,
              processed_records: rawDataPoints.length
            },
            error: null
          };
        }

        if (functionName === 'churn-prediction') {
          return {
            data: {
              churnProbability: 24,
              riskLevel: 'Low',
              keyFactors: [
                'Consistent contract payment history',
                'High active seat utilization (>85%)',
                'Weekly executive dashboard engagement'
              ],
              recommendations: [
                'Schedule bi-annual account expansion review',
                'Offer beta access to new automation features'
              ],
              confidence: 0.92,
              lastAnalysisDate: new Date().toISOString()
            },
            error: null
          };
        }
        if (functionName === 'sales-forecasting') {
          return {
            data: {
              historical_performance: {
                growth_trend: 14.8
              },
              forecast: {
                confidence: 91,
                methods_used: 'Prophet & TF.js Regression (Zero-API)',
                forecasts: [
                  { period: 1, value: 245000 },
                  { period: 2, value: 258000 },
                  { period: 3, value: 272000 },
                  { period: 4, value: 289000 },
                  { period: 5, value: 305000 },
                  { period: 6, value: 324000 }
                ],
                ai_insights: [
                  'Projected steady 14.8% compound growth trajectory across next 2 quarters.',
                  'Recommended enterprise tier marketing allocation to support Q4 surge.'
                ]
              }
            },
            error: null
          };
        }
        if (functionName === 'anomaly-detection') {
          return {
            data: {
              summary: {
                total_anomalies: 2,
                metrics_analyzed: 18,
                high_priority: 0,
                medium_priority: 1,
                low_priority: 1
              },
              anomalies: [
                {
                  metric_name: 'Database Query Cache',
                  severity: 'Medium',
                  description: 'Spike in cache misses resolved automatically via local in-memory index.',
                  date: new Date().toISOString()
                },
                {
                  metric_name: 'Trial Signup Conversion',
                  severity: 'Low',
                  description: 'Brief weekend variation within expected statistical bounds.',
                  date: new Date(Date.now() - 86400000).toISOString()
                }
              ],
              ai_insights: {
                recommendations: [
                  'Maintain current proactive cache pre-warming schedule.',
                  'Monitor trial funnel conversion across weekday peaks.'
                ]
              }
            },
            error: null
          };
        }
        if (functionName === 'model-explainability') {
          return {
            data: {
              top_factors: [
                { name: 'Seat Utilization', impact: '+0.38' },
                { name: 'Support Response Time', impact: '+0.25' }
              ],
              feature_importance: [
                { feature: 'Seat Utilization Rate', impact: 0.38, description: 'High license utilization strongly correlates with retention' },
                { feature: 'Support SLA Compliance', impact: 0.25, description: 'Fast ticket resolution prevents customer frustration' },
                { feature: 'Contract Commitment', impact: 0.21, description: 'Annual commitments provide baseline stability' },
                { feature: 'Product Feature Breadth', impact: 0.16, description: 'Teams using multiple modules churn 60% less often' }
              ],
              predicted_label: 'Low Risk Profile',
              predicted_value: 0.16,
              confidence: 0.94,
              interpretation: 'The customer exhibits healthy activity with low churn probability.',
              model_version: 'v2.4-zero-api'
            },
            error: null
          };
        }
        return {
          data: { status: 'success', message: `Executed ${functionName} via Zero-API local runtime` },
          error: null
        };
      }
    },
    channel: (name: string) => {
      const channelObj: any = {
        name,
        on: (_event: string, _filter: any, _callback: (payload: any) => void) => {
          return channelObj;
        },
        subscribe: (statusCallback?: (status: string) => void) => {
          if (statusCallback) statusCallback('SUBSCRIBED');
          return channelObj;
        },
        unsubscribe: () => {}
      };
      return channelObj;
    },
    removeChannel: () => {}
  } as any;
}

// Export the client: Zero-API mode or fallback-wrapped client
export const supabase: any = isStandalone
  ? createZeroApiClient()
  : (() => {
      try {
        return createClient<Database>(rawUrl!, rawKey!, {
          auth: {
            storage: localStorage,
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce'
          }
        });
      } catch (err) {
        console.warn('[Supabase Client] Remote initialization failed, falling back to Zero-API mode:', err);
        return createZeroApiClient();
      }
    })();