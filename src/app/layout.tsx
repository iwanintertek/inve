import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'inve - Laboratory Inventory System',
  description: 'Fullstack Next.js Laboratory Inventory Management System with PostgreSQL, RustFS S3, and Adminer',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
