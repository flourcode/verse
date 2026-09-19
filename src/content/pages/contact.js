import site from '../../../site.config.js';

export default {
  path: '/contact/',
  title: 'Contact',
  description: 'Contact Better Verses to report a wrong verse, suggest a missing topic, or ask a question about the site.',
  html: `
<p>The quickest way to reach me is email. I read everything, though I can’t always reply.</p>
<p class="verse__text" style="font-size:1.25rem"><a href="mailto:${site.contactEmail}">${site.contactEmail}</a></p>

<h2>Useful things to write in</h2>
<ul>
  <li><strong>A verse looks wrong.</strong> Tell me the page and the reference. If the text differs from the World English Bible or the note misreads the passage, I’ll fix it.</li>
  <li><strong>A topic is missing.</strong> Say what you were facing when you looked and didn’t find it. Real situations, described plainly, are how I decide what to add next.</li>
  <li><strong>A page didn’t work.</strong> Your phone and browser, and what happened, are enough for me to find the problem.</li>
</ul>

<h2>Things I can’t help with</h2>
<p>I’m not a counselor, a pastor, or a doctor, and I can’t give personal advice by email. If you’re in immediate danger or thinking about harming yourself, please contact local emergency services or a crisis line in your country right now. If you’re looking for someone to talk to about faith, a local congregation is a better place than an inbox.</p>

<h2>Privacy</h2>
<p>Emails you send are used only to reply to you and to fix the site. You won’t be added to a list. See the <a href="/privacy/">privacy page</a> for the rest.</p>
`,
};
