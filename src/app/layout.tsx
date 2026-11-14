import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LabLogix - Material Monitoring & Testing System',
  description: 'Intertek QC Material Monitoring & Testing System with PostgreSQL, RustFS S3, and Adminer',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-100 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
