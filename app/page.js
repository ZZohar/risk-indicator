"use client";

import React, { useMemo, useState } from "react";

const MAX_RISK = 95;

// משקלים (סה״כ 1.00)
const WEIGHTS = {
  homeFront: 0.22,
  cyber: 0.16,
  airTraffic: 0.16,
  weather: 0.10,
  diplomacy: 0.12,
  comms: 0.10,
  markets: 0.08,
  transport: 0.06,
};

const LABELS_HE = {
  homeFront: "הגנת העורף (הנחיות/ניסוח/רשויות)",
  cyber: "סייבר ותשתיות (CERT/שיבושים/תקלות)",
  airTraffic: "תעופה (NOTAM/הסטות/תנועה חריגה)",
  weather: "מזג אוויר וראות באזור יעד",
  diplomacy: "איתותים מדיניים",
  comms: "דפוסי תקשורת/שתיקה",
  markets: "שווקים (אנרגיה/ביטוח/FX)",
  transport: "שיבושי תחבורה",
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function pct(n) {
  return `${Math.round(n)}%`;
}

function riskBand(risk) {
  // לא משתמשים בצבעים של ירוק/צהוב/כתום/אדום כמדרג רשמי,
  // רק טקסט סטטוס פנימי לתיאור קצר.
  if (risk < 20) return "שגרה מתוחה";
  if (risk < 40) return "דריכות רכה";
  if (risk < 60) return "עלייה בדריכות";
  if (risk < 80) return "חלון סיכון";
  return "אירוע מתקרב";
}

function buildHebrewExplanation(inputs, risk) {
  const keys = Object.keys(inputs);

  const contributions = keys
    .map((k) => ({
      key: k,
      input: inputs[k],
      weight: WEIGHTS[k],
      contribution: inputs[k] * WEIGHTS[k],
    }))
    .sort((a, b) => b.contribution - a.contribution);

  const top = contributions.filter((c) => c.input > 0.15).slice(0, 3);
  const calming = contributions.filter((c) => c.input < 0.15).slice(0, 3);

  const headline =
    risk < 20
      ? "נכון לעכשיו המדדים משקפים שגרה מתוחה ללא סימנים מתכנסים."
      : risk < 40
      ? "יש דריכות רכה במספר מדדים, אך אין התכנסות שמצביעה על שינוי מצב."
      : risk < 60
      ? "נרשמת עלייה בדריכות בכמה מדדים. עדיין חסרה התכנסות של מדדים כבדים כדי להצדיק הסלמה."
      : risk < 80
      ? "יש התכנסות מדדים שמעלה את רמת הסיכון. מומלץ לעקוב בתדירות גבוהה יותר ובהסתמך על מקורות רשמיים."
      : "יש התכנסות חריגה במדדים. יש להישען על הנחיות רשמיות ולהימנע מהפצת שמועות.";

  const topLine = top.length
    ? `הגורמים הבולטים שמעלים את הסיכון כרגע: ${top
        .map((t) => `${LABELS_HE[t.key]} (${Math.round(t.input * 100)}/100)`)
        .join(" · ")}.`
    : "אין כרגע גורם יחיד שמעלה את הסיכון בצורה משמעותית.";

  const calmLine = calming.length
    ? `גורמים שמרגיעים/לא תומכים בהסלמה: ${calming
        .map((t) => `${LABELS_HE[t.key]} (${Math.round(t.input * 100)}/100)`)
        .join(" · ")}.`
    : "";

  const disclaimer =
    "הערה: זהו מדד אינדיקטיבי המבוסס על נתונים פומביים/OSINT בלבד ואינו תחליף להנחיות רשמיות.";

  return [headline, topLine, calmLine, disclaimer].filter(Boolean).join("\n\n");
}

function CircularGauge({ value }) {
  const size = 220;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = clamp(value / MAX_RISK, 0, 1);
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="gauge">
      <svg width={size} height={size} className="gaugeSvg">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="gaugeTrack"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="gaugeValue"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>

      <div className="gaugeCenter">
        <div className="gaugePct">{pct(value)}</div>
        <div className="gaugeMax">מקסימום {MAX_RISK}%</div>
      </div>
    </div>
  );
}

export default function Page() {
  const [autoMode, setAutoMode] = useState(true);

  // ערכים 0..1 לכל מדד
  const [inputs, setInputs] = useState({
    homeFront: 0.05,
    cyber: 0.05,
    airTraffic: 0.12,
    weather: 0.08,
    diplomacy: 0.06,
    comms: 0.07,
    markets: 0.05,
    transport: 0.04,
  });

  const risk = useMemo(() => {
    const keys = Object.keys(inputs);

    const raw = keys.reduce((sum, k) => sum + inputs[k] * WEIGHTS[k], 0);

    // “בוסט התכנסות” קטן: רק אם יש כמה מדדים גבוהים יחד
    const sorted = keys.map((k) => inputs[k]).sort((a, b) => b - a);
    const top2 = (sorted[0] ?? 0) + (sorted[1] ?? 0);
    const convergenceBoost = clamp((top2 - 0.6) * 0.25, 0, 0.08); // עד +8%

    return clamp((raw + convergenceBoost) * MAX_RISK, 0, MAX_RISK);
  }, [inputs]);

  const statusText = useMemo(() => riskBand(risk), [risk]);
  const explanation = useMemo(
    () => buildHebrewExplanation(inputs, risk),
    [inputs, risk]
  );

  function randomizeLightly() {
    setInputs((prev) => {
      const next = { ...prev };
      Object.keys(prev).forEach((k) => {
        const jitter = (Math.random() - 0.5) * 0.04;
        next[k] = clamp(prev[k] + jitter, 0, 1);
      });
      return next;
    });
  }

  return (
    <main className="wrap">
      <header className="top">
        <div>
          <h1 className="title">מדד סיכון משוקלל</h1>
          <p className="subtitle">אינדיקציה באחוזים לפי מדדים פומביים</p>
        </div>

        <label className="toggle">
          <span>אוטומטי</span>
          <input
            type="checkbox"
            checked={autoMode}
            onChange={(e) => setAutoMode(e.target.checked)}
          />
        </label>
      </header>

      <section className="card">
        <div className="cardHead">
          <div className="cardTitle">סטטוס נוכחי</div>
          <div className="pill">{statusText}</div>
        </div>

        <div className="center">
          <CircularGauge value={risk} />

          <div className="box">
            <div className="boxTitle">פירוש קצר</div>
            <pre className="explain">{explanation}</pre>
          </div>

          <button
            className="btn"
            onClick={() => autoMode && randomizeLightly()}
            disabled={!autoMode}
          >
            רענון סימולציה
          </button>

          <div className="sectionTitle">פירוט מדדים (0–100)</div>

          <div className="list">
            {Object.keys(inputs).map((k) => (
              <div className="item" key={k}>
                <div className="row">
                  <div className="itemTitle">{LABELS_HE[k]}</div>
                  <div className="muted">
                    {Math.round(inputs[k] * 100)} / 100
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  disabled={autoMode}
                  value={Math.round(inputs[k] * 100)}
                  onChange={(e) => {
                    const v = clamp(Number(e.target.value) / 100, 0, 1);
                    setInputs((prev) => ({ ...prev, [k]: v }));
                  }}
                />

                <div className="muted small">
                  משקל במודל: {Math.round(WEIGHTS[k] * 100)}%
                </div>
              </div>
            ))}
          </div>

          <div className="foot">
            טיפ: בהמשך נחבר מדדים למקורות אמת. כרגע זה UI + מנגנון שקלול נקי.
          </div>
        </div>
      </section>

      <footer className="copyright">
        © מדד אינדיקטיבי בלבד · אין להסתמך עליו במקום הנחיות רשמיות
      </footer>
    </main>
  );
}
