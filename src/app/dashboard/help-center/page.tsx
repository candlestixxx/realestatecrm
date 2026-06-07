export default function HelpCenterPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Excel Legacy Help Center</h1>
        <p className="text-muted-foreground">Interactive guides and user references for master CRM operations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calling Guide */}
        <div className="bg-background border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📞</span>
            <h3 className="font-bold text-lg">Calling Leads from CRM</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The CRM implements **Native Protocol Handlers** (`tel:` links) to execute calls dynamically. 
          </p>
          <div className="bg-muted/30 p-3 rounded-lg text-xs space-y-2 text-muted-foreground">
            <p><strong>📱 Mobile Devices:</strong> Clicking <span className="font-semibold text-primary">📞 Call</span> on your phone instantly launches your phone dialer with the client number pre-filled.</p>
            <p><strong>💻 Desktop Computers:</strong> Clicking launches your default communication softphone app. We recommend linking your computer to your phone via:
              <br />• <em>Windows:</em> Link to Windows (Phone Link app).
              <br />• <em>macOS:</em> Apple FaceTime (iPhone Cellular Calls).
              <br />• <em>Softphone Clients:</em> Skype, Zoom, or Teams.
            </p>
          </div>
        </div>

        {/* Email settings setup */}
        <div className="bg-background border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✉️</span>
            <h3 className="font-bold text-lg">Email Settings Setup Guide</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            To prevent spam flags and send live messages, configure SMTP or SES in the <strong>Email Settings</strong> panel.
          </p>
          <div className="bg-muted/30 p-3 rounded-lg text-xs space-y-2 text-muted-foreground">
            <p><strong>Option A: SMTP (Personal Emails)</strong>
              <br />• Host: `smtp.gmail.com` or `smtp.office365.com`
              <br />• Port: `587`
              <br />• App Password: Required instead of normal passwords (enable 2FA to generate).
            </p>
            <p><strong>Option B: AWS SES (Transactional & Mass)</strong>
              <br />• Verify your domain in AWS console.
              <br />• Input the Access Keys, Secret Keys, and Region.
            </p>
          </div>
        </div>

        {/* Smart Campaigns Drip campaigns */}
        <div className="bg-background border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <h3 className="font-bold text-lg">Drip Campaigns & Smart Plans</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Automate your client follow-ups block-by-block using our Campaign builder.
          </p>
          <div className="bg-muted/30 p-3 rounded-lg text-xs space-y-2 text-muted-foreground">
            <p>1. Open **Campaigns** tab and click &ldquo;Create Campaign&rdquo;.</p>
            <p>2. Set sequential action steps (Send Email, Send Text, Log Call) with day delays.</p>
            <p>3. Go to **Leads**, select multiple contacts, and click <span className="font-semibold text-primary">+ Smart Plan</span> to enroll them in a mass group.</p>
          </div>
        </div>

        {/* Landing Pages */}
        <div className="bg-background border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌐</span>
            <h3 className="font-bold text-lg">Landing Page Builder & Lead Capture</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Create single property marketing landing pages that sync to MLS data.
          </p>
          <div className="bg-muted/30 p-3 rounded-lg text-xs space-y-2 text-muted-foreground">
            <p>• Navigate to **Agent Websites** to inspect hosted subdomains for Hank, Harry, and Don.</p>
            <p>• Create a new Landing Page, drag-and-drop video/property/capture forms blocks, and click publish.</p>
            <p>• Share `/portal/site/[slug]` links. All visitor form submissions directly populate your CRM leads lists.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
