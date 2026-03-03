# 🚀 Nadia's Personal Issue Scanner

An automated personal assistant designed to monitor assigned issues within your GitHub Organizations. This script scans for issues assigned to you and sends a reminder if no corresponding branch has been created within 4 hours.

## 🛠 Tech Stack
- **Runtime:** Node.js 20
- **Automation:** GitHub Actions (Cron Job)
- **APIs:** GitHub API, Google Calendar API, Resend

## 📋 Features
- **Auto-Polling:** Runs automatically every hour.
- **Smart Logic:** Calculates the time elapsed since `assigned_at` and verifies branch existence to prevent spamming.
- **GCal Integration:** Automatically creates deadline events in your Google Calendar.
- **Email Alert:** Sends reminder emails via Resend.

## ⚙️ Setup Repository Secrets

Ensure the following variables are added to **Settings > Secrets and variables > Actions**:

| Secret Name | Description |
| :--- | :--- |
| `MY_PERSONAL_CLASSIC_TOKEN` | Classic Personal Access Token (PAT) with `repo` & `notifications` scopes. |
| `NADIA_RESEND_API_KEY` | API Key from your Resend Dashboard. |
| `NADIA_EMAIL` | The recipient email address for reminders (matching your Resend account). |
| `NADIA_GOOGLE_CALENDAR_ID` | Your Google Calendar ID (usually your primary email). |
| `NADIA_GOOGLE_SERVICE_ACCOUNT_JSON` | The complete, raw JSON file content from your Google Service Account. |

## 🚀 How to Run

1. **Manual Trigger:** Go to the **Actions** tab, select `Assigned Issue Scanner`, and click **Run workflow**.
2. **Automated:** The script runs independently every hour at minute 0.

## 📝 Important Notes
- The script identifies branches by searching for the **issue number** (e.g., `feature/123` or `issue-123`).
- Ensure the Service Account has been granted **"Make changes to events"** access in your Google Calendar sharing settings.
- The code must include `.replace(/\\n/g, '\n')` when processing the `private_key` to avoid 401 Authentication errors.