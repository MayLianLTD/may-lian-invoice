import "./globals.css";

export const metadata = {
  title: "MAY LIAN LTD — Invoicing",
  description: "Invoicing app for MAY LIAN LTD",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
