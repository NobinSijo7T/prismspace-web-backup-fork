'use client';

import { QRCodeGenerator } from '@/components/tools';

export default function QRGeneratorPage() {
  return (
    <div style={{ width: '100%', height: '100vh', background: '#0a0a0f', overflow: 'hidden' }}>
      <QRCodeGenerator />
    </div>
  );
}
