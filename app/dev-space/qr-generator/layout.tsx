import type { ReactNode } from 'react';

export const metadata = {
  title: 'QR Code Generator',
};

export default function QRGeneratorLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ margin: 0, padding: 0, background: '#0a0a0f', height: '100vh', overflow: 'hidden' }}>
      {children}
    </div>
  );
}
