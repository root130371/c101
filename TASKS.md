# c101 Tasks

Last updated: 2026-09-03

## Redeploy Rule

- Frontend/docs change: commit and push to GitHub.
- Edge Function change: redeploy Supabase function.
- Database/schema change: run SQL in Supabase SQL Editor.
- Secret change: usually no deploy, but redeploy function if behavior looks stale.

## Merged Plan

1. Deploy and test `analyze-evidence`.
2. Finish evidence lifecycle controls.
3. Convert contract upload into real contract evidence analysis.
4. Build AI assistant backend.
5. Improve dashboard into a guided tenant workflow.
6. Strengthen market proof workflow.
7. Harden auth, account, and security behavior.
8. Run full mobile QA and polish.
9. Prepare production launch checklist.

## Current Work

- Step 2 in progress: evidence timeline now supports open, edit note, and delete.
- Step 3 in progress: contract upload now saves through the evidence upload/storage/AI pipeline and updates contract status from contract evidence.
