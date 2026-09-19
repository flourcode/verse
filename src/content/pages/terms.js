import site from '../../../site.config.js';

export default {
  path: '/terms/',
  title: 'Terms of Use',
  crumb: 'Terms',
  description: 'Terms of use for Better Verses: what the site is for, what you can do with the content, and the limits of our responsibility.',
  html: `
<p class="muted">Last updated: September 19, 2026</p>
<p>By using ${site.name} (“the site”) you agree to these terms. They are short and written in plain English on purpose.</p>

<h2>What the site is</h2>
<p>The site offers Bible verses organized by situation, with short editorial notes. It is provided for personal reading, reflection, and sharing. It is not professional advice of any kind.</p>

<h2>Not advice</h2>
<p>Nothing on the site is medical, psychological, legal, or financial advice, and nothing here creates a professional relationship between you and us. If you are facing a health, safety, legal, or money problem, please consult a qualified professional. If you are in danger or thinking about harming yourself, contact local emergency services or a crisis line immediately.</p>

<h2>Bible text</h2>
<p>Verse text is from the World English Bible, which is in the public domain. You may copy, quote, print, and share the verse text freely.</p>

<h2>Our content</h2>
<p>The editorial notes, page structure, topic selections, and site design are ours. You’re welcome to quote short excerpts with a link back to the page. Please don’t copy whole pages, republish our notes as your own, or scrape the site to build another one. All original content is © Better Verses.</p>

<h2>Acceptable use</h2>
<p>Don’t use the site in a way that breaks the law, interferes with its operation, or attempts to circumvent its security. Automated crawling is fine for search engines that respect robots.txt; bulk scraping of content is not.</p>

<h2>Links to other sites</h2>
<p>The site may link to other websites. We don’t control them and aren’t responsible for their content or their privacy practices.</p>

<h2>Advertising</h2>
<p>The site may display ads. Advertisers are responsible for their own claims. An ad appearing on the site is not our endorsement of the product or service.</p>

<h2>No warranty</h2>
<p>The site is provided “as is”. We work to keep the verses accurate and the site available, but we don’t guarantee that it will be error-free, uninterrupted, or suited to any particular purpose.</p>

<h2>Limitation of liability</h2>
<p>To the fullest extent permitted by law, we are not liable for any loss or damage arising from your use of, or inability to use, the site or its content.</p>

<h2>Changes</h2>
<p>We may update these terms from time to time. Continued use of the site after a change means you accept the updated terms. The date at the top shows when they were last changed.</p>

<h2>Governing law</h2>
<p>These terms are governed by the laws of the jurisdiction in which the site’s operator is based, without regard to conflict-of-law rules. Any dispute will be handled in the courts of that jurisdiction.</p>

<h2>Contact</h2>
<p>Questions about these terms: <a href="mailto:${site.contactEmail}">${site.contactEmail}</a>.</p>
`,
};
