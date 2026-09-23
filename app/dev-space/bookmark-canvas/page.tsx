import type { Metadata } from 'next';
import { BookmarkCanvas } from '@/components/bookmark-canvas/BookmarkCanvas';

export const metadata: Metadata = {
  title: 'Bookmark Canvas — Prism AI Browser Dev Space',
  description:
    'A visual sticky-note bookmark manager for Prism AI Browser. Drag, resize, and organize your bookmarks on an infinite canvas.',
};

export default function BookmarkCanvasPage() {
  return (
    <main className="w-screen h-screen overflow-hidden" style={{ background: '#00df81' }}>
      <BookmarkCanvas />
    </main>
  );
}
