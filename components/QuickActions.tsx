'use client';

import { motion } from 'framer-motion';
import ProfileDropdown from '@/components/kokonutui/profile-dropdown';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

interface QuickActionsProps {
  onSettingsClick?: () => void;
  onNotepadClick?: () => void;
}

export function QuickActions({
  onSettingsClick,
  onNotepadClick,
}: QuickActionsProps) {
  const { profile } = useUserProfile();

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <>
      {/* ── Bottom-left: Notepad ── */}
      <motion.div
        className="fixed bottom-[30px] left-[30px] flex gap-3 items-center z-[100]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.button
          onClick={onNotepadClick}
          className="prism-btn flex items-center justify-center w-12 h-12 text-[1.3rem]"
          title="Notepad"
          whileHover={{ scale: 1.08, borderColor: '#00df81' }}
          whileTap={{ scale: 0.95 }}
        >
          📝
        </motion.button>
      </motion.div>

      {/* ── Bottom-right: Profile | Fullscreen ── */}
      <motion.div
        className="fixed bottom-[30px] right-[30px] flex gap-3 items-center z-[100]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <ProfileDropdown
          data={{
            name: profile?.username || 'User',
            avatar: profile?.avatar || '👤',
          }}
          onSettingsClick={onSettingsClick}
        />

        <motion.button
          onClick={toggleFullscreen}
          className="prism-btn flex items-center justify-center w-12 h-12 text-[1.3rem]"
          title="Toggle Fullscreen"
          whileHover={{ scale: 1.08, borderColor: '#00df81' }}
          whileTap={{ scale: 0.95 }}
        >
          ⛶
        </motion.button>
      </motion.div>
    </>
  );
}
