# Buyer and seller drip campaigns

Open Dashboard → Campaigns. Four default plans are available to all agents in the brokerage/company workspace.

- Buyer • Welcome and home search
- Seller • Listing preparation
- Buyer • Two-year nurture
- Seller • Two-year nurture

Open a plan to review and edit its messages. Each step waits the selected number of seconds, minutes, hours, days, weeks, months, or years after the previous step. A zero delay runs when the preceding step becomes due. Calendar months and years use UTC and keep month-end dates valid.

Choose a lead and enroll it in the plan through the existing campaign enrollment control. Defaults require manual enrollment. Library → Use Template creates an editable copy shared within your workspace. Plans and contacts stay within their brokerage workspace.

Email and SMS steps are checked every minute while the CRM server is running. Delivery requires a configured live provider. Calls and general tasks remain open in Tasks for the assigned agent. Failed sends show ERROR and require review before reopening. If a send is left IN_PROGRESS after a restart, verify delivery with the provider before reopening it.

Pausing a plan suspends future automatic sends. Unenrolling removes its pending tasks. Editing a plan affects future enrollments. Existing enrollments retain their scheduled task content and dates.

The templates provide original starter copy. Review contact consent, recipient details, message content, and your configured sender before enrollment.
