import AuthGate from '@/components/AuthGate'
import AdminPanel from '@/components/AdminPanel'

// CLAW_WEB_PASSWORD is a server-only env var (no NEXT_PUBLIC_ prefix)
const webPassword = process.env.CLAW_WEB_PASSWORD ?? null

export default function AdminPage() {
  return (
    <div className="h-full">
      <AuthGate password={webPassword}>
        <AdminPanel />
      </AuthGate>
    </div>
  )
}
