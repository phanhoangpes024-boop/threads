import Navbar from '@/components/Navbar/Navbar';
import Header from '@/components/Header';
import { ThreadsProvider } from '@/contexts/ThreadsContext';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThreadsProvider>
          <Navbar />
          <Header />
          <main style={{ marginLeft: '80px', paddingTop: '60px' }} className="main-content">
            {children}
          </main>
        </ThreadsProvider>
      </body>
    </html>
  );
}