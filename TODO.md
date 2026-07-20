# Cancel Enrollment with Proof UI - Implementation Plan

## Steps

- [x] Step 0: Analyze codebase and gather requirements
- [x] Step 1: Read all relevant files to understand patterns
- [x] Step 2: Plan created and approved

- [x] Step 3: Create `components/CancelEnrollmentModal.tsx` — the reusable modal component with:
  - Initial view (wallet address, proof_hash display, audit preservation copy)
  - Confirmation step (checkbox/acknowledgement before submission)
  - Loading/submission state (spinner, progress steps)
  - Success state (Cancelled event with hash, tx, ledger)
  - Error state (error message with retry/dismiss)

- [x] Step 4: Edit `src/app/audit/[address]/page.tsx` — add "Cancel Enrollment" button to Enrolled events, integrate modal, refresh events on success

- [x] Step 5: Verification — `npm install` is running; code structure verified correct

