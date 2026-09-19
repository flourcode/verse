import site from '../../../site.config.js';

export default {
  path: '/privacy/',
  title: 'Privacy Policy',
  crumb: 'Privacy',
  description: 'How Better Verses handles data: what we collect, cookies, analytics, advertising, third-party vendors, your choices, and how to contact us.',
  html: `
<p class="muted">Last updated: September 19, 2026</p>
<p>Better Verses (“we”, “the site”) is a small website that helps people find Bible verses. We collect as little as we can. This page explains what is collected, by whom, and what you can do about it.</p>

<h2>What we collect directly</h2>
<ul>
  <li><strong>Nothing you type in the search box.</strong> Matching happens in your browser. The words you type are not sent to us or stored.</li>
  <li><strong>Email.</strong> If you email us, we keep the message for as long as needed to reply and to fix whatever you reported. We don’t add you to a mailing list.</li>
  <li><strong>Server logs.</strong> Our hosting provider records standard technical information for each request (IP address, browser type, page requested, time). These logs are used for security and for keeping the site running, and are kept for a limited time by the provider. The site is hosted on AWS Amplify; access logs are retained by AWS for a limited period, typically no more than 90 days.</li>
</ul>

<h2>Analytics</h2>
<p>The site uses Google Analytics 4 to understand which pages are useful. Google sets cookies and collects usage information such as pages visited, approximate location derived from a truncated IP address, device type, and how you arrived at the site. We configure analytics to anonymize IP addresses and we do not send it the text you search for; we only record which topic page you ended up on and which buttons you used (for example “copy verse”).</p>
<p>You can opt out of Google Analytics across all websites with the <a href="https://tools.google.com/dlpage/gaoptout" rel="noopener">Google Analytics opt-out browser add-on</a>.</p>

<h2>Cookies</h2>
<p>The site itself sets no cookies and does not use local storage. Cookies may be set by the third-party services described on this page (analytics and advertising). You can block or delete cookies in your browser settings; the site works normally without them.</p>

<h2>Advertising</h2>
<p>We may show ads through Google AdSense to cover the cost of running the site. If ads are shown:</p>
<ul>
  <li>Google and its partners use cookies, including the DoubleClick cookie, to serve ads based on your prior visits to this and other websites.</li>
  <li>Google’s use of advertising cookies enables it and its partners to serve ads based on your visits to this site and other sites on the internet.</li>
  <li>You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" rel="noopener">Google Ads Settings</a>. You can opt out of some third-party vendors’ use of cookies for personalized advertising at <a href="https://www.aboutads.info/choices/" rel="noopener">aboutads.info</a>.</li>
  <li>Third-party vendors, including Google, may use cookies to serve ads based on your prior visits to this website or other websites.</li>
</ul>
<p>If you are visiting from a region that requires consent before advertising cookies are set, you will be asked before any such cookie is placed.</p>

<h2>Third-party services</h2>
<p>Depending on configuration, the following third parties may receive data when you use the site. Each has its own privacy policy:</p>
<ul>
  <li>AWS Amplify Hosting (serves the pages, keeps server logs) — <a href="https://aws.amazon.com/privacy/" rel="noopener">AWS Privacy Notice</a>.</li>
  <li>Google Analytics (usage statistics) — <a href="https://policies.google.com/privacy" rel="noopener">Google Privacy Policy</a>.</li>
  <li>Google AdSense (advertising) — <a href="https://policies.google.com/technologies/ads" rel="noopener">How Google uses information from sites that use its services</a>.</li>
</ul>
<p>We don’t sell personal information, and we don’t share it with anyone except the services above, as needed to run the site.</p>

<h2>Sharing and copying</h2>
<p>When you use the Share button, your device’s own share sheet handles it. Nothing about what you shared, or with whom, is sent to us. The Copy button puts the verse on your clipboard and nowhere else.</p>

<h2>Children</h2>
<p>The site is not directed at children under 13, and we don’t knowingly collect personal information from them. If you believe a child has sent us personal information, contact us and we will delete it.</p>

<h2>Your choices and rights</h2>
<ul>
  <li>Use the site without cookies: it works the same.</li>
  <li>Opt out of analytics and personalized ads using the links above.</li>
  <li>Depending on where you live, you may have the right to access, correct, or delete personal data we hold about you (which, in practice, is limited to email you have sent us). Email us and we’ll help.</li>
</ul>

<h2>Changes</h2>
<p>If this policy changes, we’ll update this page and the date at the top. Significant changes will be noted here for a period after they take effect.</p>

<h2>Contact</h2>
<p>Questions about privacy: <a href="mailto:${site.contactEmail}">${site.contactEmail}</a>.</p>
`,
};
