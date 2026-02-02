import { XMLParser } from "fast-xml-parser";

export const runtime = "nodejs"; // ל-Vercel

const parser = new XMLParser({ ignoreAttributes: false });

// === הגדרות ===
// כאן שמים מקורות פומביים. ישראל: CERT-IL RSS (או מקור רשמי אחר שיש לך)
// איראן: מקורות OSINT פומביים (דיווחי ניתוקים/תקלות/סייבר), למשל NetBlocks RSS/מקורות חדשותיים.
const FEEDS = {
  israel: [
    // דוגמה: החלף למקור האמיתי שאתה משתמש בו בפועל
    // "https://www.gov.il/he/feeds/cyber/rss"  (דוגמה בלבד)
  ],
  iran: [
    // דוגמה: החלף למקור OSINT אמיתי שמתאים לך
    // "https://netblocks.org/rss" (דוגמה נפוצה)
  ],
};

// מילון “עוצמה” לפי מילות מפתח בסיסיות (היוריסטיקה)
const KEYWORDS = [
  { re: /outage|shutdown|blackout|disruption|DDoS/i, w: 0.35 },
  { re: /bank|payment|fuel|gas|electric|power|telecom/i, w: 0.30 },
  { re: /airport|port|rail|transport/i, w: 0.25 },
  { re: /cyberattack|attack|breach|malware|ransom/i, w: 0.35 },
];

// כמה “טרי” נחשב רלוונטי (שעות)
const WINDOW_HOURS = 36;

// 0..1 cap כדי שלא נקבל “ודאות” מלאכותית
const MAX_SCORE = 1;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function hoursAgo(dateStr) {
  const t = new Date(dateStr).getTime();
  if (!Number.isFinite(t)) return Infinity;
  return (Date.now() - t) / (1000 * 60 * 60);
}

function scoreItem(title = "", desc = "") {
  const text = `${title} ${desc}`.slice(0, 5000);
  let s = 0;
  for (const k of KEYWORDS) {
    if (k.re.test(text)) s += k.w;
  }
  return clamp(s, 0, 1);
}

async function fetchFeed(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "risk-indicator/1.0" },
    // Cache קצרה כדי לא להעמיס
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`feed fetch failed: ${url} (${res.status})`);
  const xml = await res.text();
  const data = parser.parse(xml);

  // RSS variants: rss.channel.item OR feed.entry (Atom)
  const items =
    data?.rss?.channel?.item ||
    data?.feed?.entry ||
    [];

  return Array.isArray(items) ? items : [items];
}

async function computeRegionScore(feedUrls) {
  if (!feedUrls?.length) return { score: 0, evidence: [] };

  const all = [];
  for (const url of feedUrls) {
    try {
      const items = await fetchFeed(url);
      for (const it of items) {
        const title = it?.title?.["#text"] ?? it?.title ?? "";
        const desc =
          it?.description?.["#text"] ??
          it?.summary?.["#text"] ??
          it?.description ??
          it?.summary ??
          "";
        const pubDate =
          it?.pubDate ??
          it?.published ??
          it?.updated ??
          it?.["dc:date"] ??
          "";

        const h = hoursAgo(pubDate);
        if (h <= WINDOW_HOURS) {
          const itemScore = scoreItem(title, desc);
          all.push({
            title: String(title).slice(0, 140),
            pubDate: pubDate ? new Date(pubDate).toISOString() : null,
            itemScore,
          });
        }
      }
    } catch (e) {
      // אם מקור אחד נופל — לא מפילים את הכל
    }
  }

  // ציון: סכימה רכה של 3 האירועים הבולטים
  all.sort((a, b) => b.itemScore - a.itemScore);
  const top = all.slice(0, 3);

  const score = clamp(
    top.reduce((sum, x) => sum + x.itemScore, 0) / 1.2, // נרמול
    0,
    MAX_SCORE
  );

  return { score, evidence: top };
}

export async function GET() {
  // חישוב ציוני משנה
  const [israel, iran] = await Promise.all([
    computeRegionScore(FEEDS.israel),
    computeRegionScore(FEEDS.iran),
  ]);

  // משקל פנימי: 40% ישראל, 60% איראן
  const combined = clamp(0.4 * israel.score + 0.6 * iran.score, 0, 1);

  return Response.json({
    ok: true,
    windowHours: WINDOW_HOURS,
    israel,
    iran,
    combined,
    // גרסה כדי שתדע איזה לוגיקה רצה
    version: "cyber-v1-isr40-iran60",
  });
}
