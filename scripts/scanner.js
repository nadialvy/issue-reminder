import { google } from 'googleapis';
import { Resend } from 'resend';

const resend = new Resend(process.env.NADIA_RESEND_API_KEY);
const GITHUB_TOKEN = process.env.MY_PERSONAL_CLASSIC_TOKEN;

const jsonString = process.env.NADIA_GOOGLE_SERVICE_ACCOUNT_JSON;
if (!jsonString) throw new Error("Secret NADIA_GOOGLE_SERVICE_ACCOUNT_JSON not found!");

const credentials = JSON.parse(jsonString);

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: credentials.client_email,
    private_key: credentials.private_key.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

async function scanIssues() {
  try {
    const authClient = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: authClient });

    console.log('Fetching all assigned issues...');
    const response = await fetch('https://api.github.com/issues?filter=assigned&state=open', {
      headers: { 
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json'
      }
    });

    if (!response.ok) throw new Error(`GitHub API Error: ${response.statusText}`);
    const issues = await response.json();

    for (const issue of issues) {
      const assignedAt = new Date(issue.updated_at); 
      const now = new Date();
      const diffHours = (now - assignedAt) / (1000 * 60 * 0);

      console.log(`Checking Issue #${issue.number} di ${issue.repository.name}...`);

      if (diffHours >= 4) {
        const hasBranch = await checkBranchExists(issue.repository.full_name, issue.number);

        if (!hasBranch) {
          console.log(`🚨 Memberikan reminder untuk #${issue.number} (Sudah ${diffHours.toFixed(1)} jam)`);
          await createGCalEvent(calendar, issue);
          await sendEmail(issue);
        } else {
          console.log(`Branch exists for #${issue.number} issue, skip.`);
        }
      } else {
        console.log(`⏳ Still on time range(${diffHours.toFixed(1)}).`);
      }
    }
  } catch (error) {
    console.error('❌ Scanner Error:', error.message);
    process.exit(1);
  }
}

async function checkBranchExists(repoFullName, issueNumber) {
  try {
    const response = await fetch(`https://api.github.com/repos/${repoFullName}/branches`, {
      headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
    });
    if (!response.ok) return false;
    const branches = await response.json();
    return branches.some(b => b.name.includes(issueNumber.toString()));
  } catch (error) {
    console.error('Error checking branch existence:', error.message);
    return false;
  }
}

async function createGCalEvent(calendar, issue) {
  const deadlineTime = new Date(new Date().getTime() + 30 * 60 * 1000); 
  await calendar.events.insert({
    calendarId: process.env.NADIA_GOOGLE_CALENDAR_ID,
    requestBody: {
      summary: `🚨 DEADLINE: Issue #${issue.number} - ${issue.title}`,
      description: `There is no branch created for: ${issue.html_url}`,
      start: { dateTime: new Date().toISOString() },
      end: { dateTime: deadlineTime.toISOString() },
    },
  });
  console.log(`✅ Calendar event created for #${issue.number}`);
}

async function sendEmail(issue) {
  await resend.emails.send({
    from: 'Reminder AI <onboarding@resend.dev>',
    to: [process.env.NADIA_EMAIL],
    subject: `[LATE RESPONSE] Issue #${issue.number} - ${issue.repository.name}`,
    html: `<p>Hi Nads, <strong>${issue.title}</strong> issue is assigned but no branch has been created yet.</p>
           <a href="${issue.html_url}">Click here to view the issue</a>`
  });
  console.log(`✅ Email sent for #${issue.number}`);
}

scanIssues();