'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export function TopLogo() {
  return (
    <motion.div
      className="fixed top-[30px] left-[40px] flex items-center gap-[12px] z-[100]"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <Image
        src="/images/prism-logo.svg"
        alt="Prism Logo"
        width={36}
        height={36}
        className="transition-transform duration-300 hover:scale-110 hover:rotate-[5deg]"
      />
      <span
        className="font-mono text-[17px] font-[800] tracking-[-0.02em] leading-none text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
      >
        /prismspace
      </span>
    </motion.div>
  );
}
