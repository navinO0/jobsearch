import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'JobPulse — Job Search & Application Platform',
  description: 'Production job discovery, ATS tailoring, and application tracking platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground min-h-screen flex flex-col antialiased selection:bg-muted selection:text-foreground">
        <Navbar />
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-4 lg:px-6 py-4">
          {children}
        </main>
      </body>
    </html>
  );
}
