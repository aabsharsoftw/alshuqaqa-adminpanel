const LAST_UPDATED = 'August 22, 2026';

function PrivacyContent() {
  return (
    <>
      <header className="page-head">
        <div>
          <h1>Privacy Policy</h1>
          <p>
            How this rental-listings marketplace collects, uses and protects
            information. Last updated {LAST_UPDATED}.
          </p>
        </div>
      </header>

      <section className="card">
        <div className="legal">
          <h2>Information We Collect</h2>
          <p>
            We collect information you provide directly when you create an
            account, publish a listing, or contact a landlord or tenant. This
            may include your name, email address, phone number, listing details,
            and the content of enquiries you send or receive.
          </p>
          <p>
            We also collect limited technical information automatically, such as
            device type, browser, and general usage activity, to keep the
            service secure and reliable.
          </p>

          <h2>How We Use It</h2>
          <ul>
            <li>To operate the marketplace and display listings to tenants.</li>
            <li>To connect tenants with landlords through enquiries.</li>
            <li>To review, approve, and moderate listings and accounts.</li>
            <li>To improve the product and troubleshoot technical issues.</li>
            <li>To communicate service updates and respond to support requests.</li>
          </ul>

          <h2>Data Sharing</h2>
          <p>
            We do not sell your personal information. Contact details you submit
            in an enquiry are shared with the relevant landlord so they can
            respond. We may share information with service providers who help us
            operate the platform, or where required by applicable law.
          </p>

          <h2>Data Retention</h2>
          <p>
            We retain your information for as long as your account is active or
            as needed to provide the service, comply with legal obligations,
            resolve disputes, and enforce our agreements. You may request
            deletion of your account and associated data at any time.
          </p>

          <h2>Security</h2>
          <p>
            We use reasonable administrative and technical safeguards to protect
            information against unauthorized access, loss, or misuse. No method
            of transmission or storage is completely secure, so we cannot
            guarantee absolute security.
          </p>

          <h2>Contact</h2>
          <p>
            If you have questions about this policy or a request regarding your
            data, contact our privacy team at{' '}
            <a href="mailto:Haden@alshuqaq.com">Haden@alshuqaq.com</a>. We aim to
            respond to every request within a reasonable timeframe.
          </p>
        </div>
      </section>
    </>
  );
}

export function Privacy() {
  return <PrivacyContent />;
}

export function PublicPrivacy() {
  return (
    <div className="content" style={{ margin: '0 auto', maxWidth: 860 }}>
      <div className="login__brand" style={{ marginBottom: 24 }}>
        <span className="sidebar__mark" aria-hidden="true">
          R
        </span>
        <span>
          Rental <strong>Admin</strong>
        </span>
      </div>
      <PrivacyContent />
    </div>
  );
}
