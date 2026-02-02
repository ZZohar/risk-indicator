export const metadata = {
  title: 'מדד סיכון',
  description: 'אינדיקציה כללית למצב',
};

export default function RootLayout({ children }) {
  return (
    <html lang="he">
      <body>{children}</body>
    </html>
  );
}
