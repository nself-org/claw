'use client'

// T-1204: Proactive settings page — job cards, thresholds, quiet hours.

import { useState, useEffect, useCallback } from 'react'
import { fetchProactiveJobs, toggleProactiveJob, type ProactiveJob } from '@/lib/api'

const JOB_META: Record<string, { label: string; description: string; icon: string }> = {
  digest: {
    label: 'Daily Digest',
    description: 'Summarizes your recent conversations and surfaces insights every morning.',
    icon: '📋',
  },
  ssl_check: {
    label: 'SSL Certificate Check',
    description: 'Monitors SSL certificate expiry and alerts before they expire.',
    icon: '🔒',
  },
  disk_check: {
    label: 'Disk Usage Alert',
    description: 'Alerts when disk usage exceeds the configured threshold.',
    icon: '💾',
  },
  memory_check: {
    label: 'Memory Usage Alert',
    description: 'Alerts when system memory usage is consistently high.',
    icon: '🖥️',
  },
  backup_reminder: {
    label: 'Backup Reminder',
    description: 'Periodic reminder to back up your nSelf data.',
    icon: '☁️',
  },
}

function jobLabel(jobType: string) {
  return JOB_META[jobType]?.label ?? jobType.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function formatTime(hour: number) {
  const h = hour % 12 === 0 ? 12 : hour % 12
  return `${h}:00 ${hour < 12 ? 'AM' : 'PM'}`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function ProactiveSettingsPage() {
  const [jobs, setJobs] = useState<ProactiveJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchProactiveJobs()
      setJobs(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleToggle(jobType: string, enabled: boolean) {
    // Optimistic
    setJobs((prev) => prev.map((j) => j.job_type === jobType ? { ...j, enabled } : j))
    try {
      await toggleProactiveJob(jobType, enabled)
    } catch (e) {
      setError(String(e))
      await load() // revert
    }
  }

  const quietJob = jobs.find((j) => j.quiet_hours_start !== 0 || j.quiet_hours_end !== 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg, #0F0F1A)', color: 'var(--text, #E4E4F0)' }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Proactive Settings</h1>
            <p className="text-sm mt-1" style={{ color: '#8888A8' }}>
              Configure what ɳClaw monitors and when it alerts you.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-[#2A2A40]"
            style={{ color: '#8888A8', border: '1px solid #2A2A40' }}
          >
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#2d1a1a', color: '#f87171' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16" style={{ color: '#8888A8' }}>
            <p className="text-4xl mb-3">⏰</p>
            <p className="text-sm">No proactive jobs configured on this server.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6366F1' }}>
              Scheduled Jobs
            </p>

            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onToggle={handleToggle} />
            ))}

            {/* Quiet hours summary */}
            {quietJob && (
              <div
                className="mt-6 px-4 py-3 rounded-lg flex items-center gap-3"
                style={{ background: '#12121F', border: '1px solid #1E1E35' }}
              >
                <span className="text-lg">🌙</span>
                <div>
                  <p className="text-sm font-medium">Quiet Hours</p>
                  <p className="text-xs mt-0.5" style={{ color: '#8888A8' }}>
                    No notifications between{' '}
                    <span className="text-white font-medium">{formatTime(quietJob.quiet_hours_start)}</span>
                    {' '}and{' '}
                    <span className="text-white font-medium">{formatTime(quietJob.quiet_hours_end)}</span>.
                    Configure via <code className="text-xs px-1 py-0.5 rounded" style={{ background: '#1A1A2E' }}>nself claw proactive</code> CLI.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function JobCard({ job, onToggle }: { job: ProactiveJob; onToggle: (type: string, enabled: boolean) => void }) {
  const meta = JOB_META[job.job_type]
  return (
    <div
      className="px-4 py-4 rounded-lg"
      style={{ background: '#12121F', border: '1px solid #1E1E35', opacity: job.enabled ? 1 : 0.6 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-xl mt-0.5">{meta?.icon ?? '⚡'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{jobLabel(job.job_type)}</p>
            {meta?.description && (
              <p className="text-xs mt-0.5" style={{ color: '#8888A8' }}>{meta.description}</p>
            )}
            <div className="flex gap-4 mt-2 flex-wrap">
              <span className="text-xs font-mono" style={{ color: '#8888A8' }}>{job.cron_expression}</span>
              {job.next_run_at && (
                <span className="text-xs" style={{ color: '#8888A8' }}>
                  next: <span style={{ color: '#E4E4F0' }}>{formatDate(job.next_run_at)}</span>
                </span>
              )}
              {job.last_run_at && (
                <span className="text-xs" style={{ color: '#8888A8' }}>
                  last: <span style={{ color: '#E4E4F0' }}>{formatDate(job.last_run_at)}</span>
                </span>
              )}
              {job.failure_count > 0 && (
                <span className="text-xs" style={{ color: '#f87171' }}>
                  ⚠ {job.failure_count} failure{job.failure_count !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={job.enabled}
          onClick={() => onToggle(job.job_type, !job.enabled)}
          className="shrink-0 relative inline-flex h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2"
          style={{
            background: job.enabled ? '#6366F1' : '#2A2A40',
          }}
        >
          <span
            className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5"
            style={{ transform: job.enabled ? 'translateX(22px)' : 'translateX(2px)' }}
          />
        </button>
      </div>
    </div>
  )
}
