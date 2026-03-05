# 🏛️ gemini.md — Project Constitution
> **This file is law.** Only update when a schema changes, a rule is added, or architecture is modified.

---

## 📋 Project Identity

| Field | Value |
|---|---|
| **Project Name** | Admissions Management System |
| **Initialized** | 2026-03-04 |
| **Status** | � Phase 1: Blueprint — Schema Defined, Ready to Build |
| **Pilot** | System Pilot (B.L.A.S.T. Protocol) |

---

## 🎯 North Star Objective

> Build a complete, end-to-end **Admissions Management System** where applicants can create accounts and submit applications, and admissions managers can review those applications, update their status (triggering automatic email notifications), and launch a video interview portal with a single click.

---

## 🔗 Integrations

| Service | Status | Notes |
|---|---|---|
| **Supabase** | 🟡 Pending Setup | Database (PostgreSQL) + Auth + Row Level Security |
| **Email (SMTP/Resend)** | 🟡 Pending Keys | Sends status update emails to applicants |
| **Video Interview Portal** | ✅ URL Known | https://www.restlessdreamers.in/vid-int |

---

## 🗄️ Data Schema

### Supabase Tables

#### `profiles`
Extends `auth.users`. Created automatically on signup via a Supabase trigger.
```json
{
  "id": "uuid (FK → auth.users.id)",
  "full_name": "text",
  "email": "text",
  "role": "text (enum: 'applicant' | 'admin')",
  "created_at": "timestamptz"
}
```

#### `applications`
Core application record submitted by an applicant.
```json
{
  "id": "uuid (PK, default: gen_random_uuid())",
  "applicant_id": "uuid (FK → profiles.id)",
  "full_name": "text",
  "email": "text",
  "phone": "text",
  "program": "text",
  "date_of_birth": "date",
  "statement_of_purpose": "text",
  "resume_url": "text (nullable)",
  "status": "text (enum: 'pending' | 'under_review' | 'interview_scheduled' | 'accepted' | 'rejected') default: 'pending'",
  "submitted_at": "timestamptz (default: now())",
  "updated_at": "timestamptz"
}
```

### `status_updates`
Audit trail of all status changes made by admissions managers.
```json
{
  "id": "uuid (PK)",
  "application_id": "uuid (FK → applications.id)",
  "old_status": "text",
  "new_status": "text",
  "message": "text (custom message sent to applicant)",
  "sent_by": "uuid (FK → profiles.id)",
  "sent_at": "timestamptz (default: now())"
}
```

#### `interview_templates`
Stores reusable sets of video interview questions.
```json
{
  "id": "uuid (PK)",
  "title": "text",
  "created_by": "uuid (FK → profiles.id)",
  "created_at": "timestamptz"
}
```

#### `interview_questions`
Specific questions grouped under a template.
```json
{
  "id": "uuid (PK)",
  "template_id": "uuid (FK → interview_templates.id)",
  "question_text": "text",
  "time_limit_seconds": "integer",
  "order": "integer"
}
```

#### `interview_invitations`
Invitations sent to applicants for specific applications and templates.
```json
{
  "id": "uuid (PK, unique link identifier)",
  "application_id": "uuid (FK → applications.id)",
  "template_id": "uuid (FK → interview_templates.id)",
  "status": "text (enum: 'pending' | 'completed' | 'expired') default: 'pending'",
  "invited_by": "uuid (FK → profiles.id)",
  "invited_at": "timestamptz (default: now())"
}
```

#### `video_submissions`
Individual videos submitted by an applicant per question.
```json
{
  "id": "uuid (PK)",
  "invitation_id": "uuid (FK → interview_invitations.id)",
  "question_id": "uuid (FK → interview_questions.id)",
  "drive_file_id": "text",
  "drive_file_url": "text",
  "submitted_at": "timestamptz"
}
```

#### `interview_feedback`
Reviewer feedback and rating on a video submission.
```json
{
  "id": "uuid (PK)",
  "submission_id": "uuid (FK → video_submissions.id)",
  "reviewer_id": "uuid (FK → profiles.id)",
  "feedback_text": "text",
  "rating": "integer",
  "created_at": "timestamptz"
}
```

### Input Schema (Application Form)
```json
{
  "full_name": "string (required)",
  "email": "string (required)",
  "phone": "string (required)",
  "program": "string (required)",
  "date_of_birth": "date (required)",
  "statement_of_purpose": "string (required, min 100 chars)"
}
```

### Output / Payload Schema (Email Notification)
```json
{
  "to": "applicant@email.com",
  "subject": "Update on Your Application — [Program Name]",
  "body": "Dear [Name], your application status has been updated to [Status]. [Custom Message from Admin]"
}
```

---

## 📐 Architectural Invariants

These rules NEVER change without explicit user approval:

1. **Data-First:** No Tool in `tools/` is built before the Schema above is approved.
2. **Atomicity:** Every script in `tools/` does exactly one thing.
3. **Determinism:** Tools contain zero LLM calls. All probabilistic logic lives in the Navigation layer.
4. **Intermediates:** All temporary data lives in `.tmp/` — never committed.
5. **Secrets:** All API keys live in `.env` — never hardcoded.
6. **Self-Annealing:** When a tool fails, the stack trace is analyzed, the patch is applied, and the SOP in `architecture/` is updated before the task is marked complete.
7. **Role Separation:** Applicant and Admin views are strictly separated via Supabase RLS policies and Next.js middleware.
8. **Email First:** Status updates ALWAYS trigger an email — it cannot be sent without one.

---

## 📜 Behavioral Rules

1. Applicants can only view their own applications (RLS enforced).
2. Admins can view all applications.
3. A "Send Status Update" button always triggers an email to the applicant.
4. The "Launch Video Interview" button always opens `https://www.restlessdreamers.in/vid-int` in a new tab.
5. Status options: `Pending` → `Under Review` → `Interview Scheduled` → `Accepted` / `Rejected`.
6. Deleted applications are soft-deleted (not hard-deleted).

---

## 🛠️ Maintenance Log

| Date | Change | Author |
|---|---|---|
| 2026-03-04 | Project Constitution initialized. Schemas pending Discovery. | System Pilot |
| 2026-03-04 | Discovery answered. Schema defined. North Star set. Ready to build. | System Pilot |
