/* Better Verses — analytics.
   Paste your Google Analytics 4 Measurement ID between the quotes below (it looks like "G-XXXXXXXXXX";
   find it in GA under Admin → Data streams → your web stream). Save, redeploy, done: every page loads
   this file, and the site's buttons already send events through it.

   Leave it empty and nothing is loaded: no request to Google, no cookie. */

var GA_MEASUREMENT_ID = "G-KR7GC1XMW7";

/* ─────────────────────────────── nothing below needs editing ─────────────────────────────── */

(function () {
  if (!GA_MEASUREMENT_ID || location.protocol === 'file:') return;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;                       // the site's copy/share/search events call this

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    anonymize_ip: true,
    allow_google_signals: false,            // no advertising features / cross-device tracking
    allow_ad_personalization_signals: false
  });

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
  document.head.appendChild(s);
})();

/* Events the site sends (see /assets/app.js). Parameters are always a topic slug or a method name,
   never the text someone typed:
     verse_search        { topic, matched }      someone used the search box
     topic_selected      { topic, via }          chip, suggestion, or Surprise me
     another_verse       { topic }               Another verse / Give me another
     copy_verse          { topic }               Copy
     share_verse         { topic, method }       Share (native sheet or copied link)
     related_topic_click { from }                tapped a Related chip on a result
     printable_open      { sheet }               opened a PDF sheet or the Comfort Kit
     bible_search        { results, kind }       used the full-Bible search (never the query text)
   They appear in GA under Reports → Engagement → Events. */
