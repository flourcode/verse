// Central site configuration. Everything that is deployment-specific lives here.
export default {
  name: 'Better Verses',
  domain: 'betterverses.com',
  url: 'https://betterverses.com',               // canonical origin, no trailing slash
  tagline: 'The right verse to comfort someone you care about.',
  defaultDescription: "Find the right Bible verse to comfort someone you care about. Sometimes that someone is you. Search the whole Bible in plain English, or start from the moment: grief, surgery, job loss, a night you can't sleep. Every verse comes with its context.",
  translation: { name: 'World English Bible', abbr: 'WEB', note: 'Public Domain' },
  // The WEB renders the divine name as "Yahweh". Set to 'the LORD' to use the traditional rendering
  // (as in the WEB British Edition) everywhere the text is displayed. Either is public domain.
  // Print the words of Jesus in red, as many printed Bibles do. Marked per verse in verses.json (`jesus`).
  // Newsletter (Kit). Paste your Kit landing-page or form URL to show the signup block on the home page and in the footer.
  newsletter: { name: 'Better Verses', url: '' },
  redLetter: true,
  divineName: 'Yahweh',                          // 'Yahweh' | 'the LORD'
  contactEmail: 'hello@betterverses.com',        // make sure this mailbox exists
  ogImage: '/og-default.png',
  // Analytics: paste your GA4 id into public/analytics.js (not here). That file is copied to /analytics.js as-is.
  // Ads: keep false until real AdSense code exists. When true, <ins> ad slots render.
  ads: { enabled: false, client: '' },           // e.g. client: 'ca-pub-XXXXXXXXXXXXXXXX'
  // Pages excluded from the sitemap (still crawlable, just not promoted).
  sitemapExclude: ['privacy', 'terms', 'affiliate-disclosure', 'random', 'search', '404'],
};
