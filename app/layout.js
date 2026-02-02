import "./globals.css";

export const metadata = {
  title: "מדד סיכון",
  description: "אינדיקציה כללית למצב",
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
