'use client';

import { useState, useEffect } from 'react';
import { MainContainer } from '@/components/MainContainer';
import { DevSpace } from '@/components/DevSpace';
import { TopLogo } from '@/components/TopLogo';
import { TopQuote } from '@/components/TopQuote';
import { QuickActions } from '@/components/QuickActions';
import { SettingsModal } from '@/components/SettingsModal';
import { PanelManager, usePanelManager } from '@/components/PanelManager';

export default function Home() {
  const [showSettings, setShowSettings] = useState(false);
  const { activePanel, openPanel, closePanel } = usePanelManager();

  // Open Agent Swarm panel from SearchBar custom event
  useEffect(() => {
    const handler = () => openPanel('agent-swarm');
    window.addEventListener('prism:open-agent-swarm', handler);
    return () => window.removeEventListener('prism:open-agent-swarm', handler);
  }, [openPanel]);

  const handleToolAction = (action: string) => {
    // Handle system stats specially
    if (action === 'system-stats') {
      const ramInfo = document.getElementById('ram-usage')?.textContent || 'N/A';
      const screenInfo = document.getElementById('screen-info')?.textContent || 'N/A';
      const stats = `
Browser: PRISM AI Browser
Platform: ${navigator.platform}
Language: ${navigator.language}
Cookies: ${navigator.cookieEnabled ? 'Enabled' : 'Disabled'}
Online: ${navigator.onLine ? 'Yes' : 'No'}
Screen: ${screenInfo}
RAM Usage: ${ramInfo}
Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}
      `.trim();
      
      navigator.clipboard.writeText(stats).then(() => {
        alert('System information copied to clipboard!');
      });
      return;
    }

    // Open panel for other actions
    openPanel(action as any);
  };

  return (
    <>
      <TopLogo />
      <TopQuote />
      <MainContainer />
      <DevSpace onToolAction={handleToolAction} />
      <QuickActions
        onSettingsClick={() => setShowSettings(true)}
        onNotepadClick={() => openPanel('notepad')}
        onTodoClick={() => openPanel('todo')}
      />
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
      <PanelManager activePanel={activePanel} onClose={closePanel} />
    </>
  );
}
