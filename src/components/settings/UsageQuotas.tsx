// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/hooks/useAuth'
import { getRateLimitStatus } from '@/lib/rateLimit'
import { Upload, Brain } from 'lucide-react'

interface QuotaDisplay {
    used: number
    limit: number
    resetAt: Date
}

export function UsageQuotas() {
    const { user } = useAuth()
    const [uploadQuota, setUploadQuota] = useState<QuotaDisplay | null>(null)
    const [aiQuota, setAiQuota] = useState<QuotaDisplay | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchQuotas() {
            if (!user) return

            try {
                const [uploadStatus, aiStatus] = await Promise.all([
                    getRateLimitStatus(user.id, 'upload'),
                    getRateLimitStatus(user.id, 'ai_query'),
                ])

                setUploadQuota({
                    used: uploadStatus.current,
                    limit: uploadStatus.limit,
                    resetAt: uploadStatus.resetAt,
                })

                setAiQuota({
                    used: aiStatus.current,
                    limit: aiStatus.limit,
                    resetAt: aiStatus.resetAt,
                })
            } catch (error) {
                console.error('Failed to fetch quotas:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchQuotas()

        // Refresh every minute
        const interval = setInterval(fetchQuotas, 60000)
        return () => clearInterval(interval)
    }, [user])

    if (!user) return null

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Usage & Quotas</CardTitle>
                    <CardDescription>Loading...</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    const uploadPercentage = uploadQuota ? (uploadQuota.used / uploadQuota.limit) * 100 : 0
    const aiPercentage = aiQuota ? (aiQuota.used / aiQuota.limit) * 100 : 0

    return (
        <Card>
            <CardHeader>
                <CardTitle>Usage & Quotas</CardTitle>
                <CardDescription>Your current usage and daily limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Upload Quota */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Upload className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Daily Uploads</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {uploadQuota?.used || 0} / {uploadQuota?.limit || 10}
                        </span>
                    </div>
                    <Progress value={uploadPercentage} className="h-2" />
                    {uploadQuota && (
                        <p className="text-xs text-muted-foreground">
                            Resets at {uploadQuota.resetAt.toLocaleTimeString()} on{' '}
                            {uploadQuota.resetAt.toLocaleDateString()}
                        </p>
                    )}
                </div>

                {/* AI Query Quota */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">AI Queries</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {aiQuota?.used || 0} / {aiQuota?.limit || 1000}
                        </span>
                    </div>
                    <Progress value={aiPercentage} className="h-2" />
                    {aiQuota && (
                        <p className="text-xs text-muted-foreground">
                            Resets at {aiQuota.resetAt.toLocaleTimeString()} on{' '}
                            {aiQuota.resetAt.toLocaleDateString()}
                        </p>
                    )}
                </div>

                {/* Warning if approaching limits */}
                {(uploadPercentage > 80 || aiPercentage > 80) && (
                    <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                        ⚠️ You're approaching your daily limits. They will reset at midnight.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
