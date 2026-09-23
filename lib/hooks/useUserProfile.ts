import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, UserProfile } from '../db';

export function useUserProfile() {
  // Seed the default profile once on mount — writes are NOT allowed inside useLiveQuery
  useEffect(() => {
    (async () => {
      const existing = await db.user_profile.get('current');
      if (!existing) {
        const now = new Date();
        const defaultProfile: UserProfile = {
          key: 'current',
          username: 'User',
          avatar: 'modern:cyber',
          createdAt: now,
          updatedAt: now,
        };
        await db.user_profile.put(defaultProfile);
      } else if (existing.avatar === '👤') {
        await db.user_profile.update('current', {
          avatar: 'modern:cyber',
          updatedAt: new Date(),
        });
      }
    })();
  }, []);

  // useLiveQuery is read-only — only reads here
  const profile = useLiveQuery(() => db.user_profile.get('current'));

  const updateUsername = async (username: string) => {
    await db.user_profile.update('current', {
      username,
      updatedAt: new Date(),
    });
  };

  const updateAvatar = async (avatar: string) => {
    await db.user_profile.update('current', {
      avatar,
      updatedAt: new Date(),
    });
  };

  const updateProfile = async (updates: Partial<Omit<UserProfile, 'key' | 'createdAt'>>) => {
    await db.user_profile.update('current', {
      ...updates,
      updatedAt: new Date(),
    });
  };

  return {
    profile,
    updateUsername,
    updateAvatar,
    updateProfile,
  };
}
