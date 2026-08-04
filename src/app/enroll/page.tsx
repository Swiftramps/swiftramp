'use client'
import Navbar from '../../../components/Navbar'
import EnrollmentForm from '../../../components/EnrollmentForm'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
  .enroll-page { min-height: 100vh; background: #FFFFFF; color: #0A0A0A; font-family: 'IBM Plex Sans', sans-serif; }
  .enroll-container { max-width: 720px; margin: 0 auto; padding: 64px 24px 96px; }
  .enroll-title { font-family: 'Space Grotesk', sans-serif; font-size: 36px; font-weight: 700; margin: 0 0 10px; letter-spacing: -0.01em; }
  .enroll-sub { font-size: 16px; line-height: 1.7; color: #6B6960; margin: 0 0 36px; }
  .enroll-done { background: #DCE8DE; border: 1px solid #17462B; color: #17462B; border-radius: 14px; padding: 24px; text-align: center; }
  .enroll-done h2 { font-family: 'Space Grotesk', sans-serif; margin: 0 0 8px; }
  .enroll-done p { margin: 0 0 18px; font-size: 14px; }
  .enroll-done button { background: #17462B; color: #fff; border: none; border-radius: 100px; padding: 10px 20px; font-weight: 600; cursor: pointer; font-family: 'IBM Plex Sans', sans-serif; }
  .enroll-link { display: inline-block; margin-top: 28px; color: #5B3DF5; font-size: 14px; text-decoration: none; font-family: 'IBM Plex Mono', monospace; }
  .enroll-link:hover { text-decoration: underline; }
  @media (max-width: 600px) {
    .enroll-container { padding: 40px 18px 80px; }
    .enroll-title { font-size: 28px; }
  }
`

export default function EnrollPage() {
  const router = useRouter()
  const [enrollment, setEnrollment] = useState<{ id: number; address: string; proof_hash: string } | null>(null)

  return (
    <div className="enroll-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Navbar />
      <div className="enroll-container">
        {enrollment ? (
          <div className="enroll-done">
            <h2>Enrollment recorded</h2>
            <p>Your enrollment is committed with proof hash <strong>{enrollment.proof_hash}</strong>.</p>
            <button onClick={() => router.push(`/audit/${enrollment.address}`)}>View audit trail</button>
          </div>
        ) : (
          <>
            <h1 className="enroll-title">Enroll identity</h1>
            <p className="enroll-sub">
              Commit your identity to a compliance queue. The expected proof hash is computed
              locally and shown before submission, so you can verify exactly what will be recorded.
            </p>
            <EnrollmentForm onEnrolled={setEnrollment} />
            <a className="enroll-link" href="/docs/audit-model">Learn about the audit proof model →</a>
          </>
        )}
      </div>
    </div>
  )
}
