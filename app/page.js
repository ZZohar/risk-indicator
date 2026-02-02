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

  const top
