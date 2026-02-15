import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { clubsApi, authApi, Club } from '../api';

interface ClubContextType {
  clubs: Club[];
  selectedClub: Club | null;
  setSelectedClub: (club: Club | null) => void;
  loading: boolean;
  refreshClubs: () => Promise<void>;
}

const ClubContext = createContext<ClubContextType | null>(null);

export function ClubProvider({ children }: { children: React.ReactNode }) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClubState] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshClubs = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const [{ data }, userRes] = await Promise.all([
        clubsApi.list(),
        authApi.me().catch(() => ({ data: null })),
      ]);
      const list = data?.clubs || [];
      setClubs(list);
      const managedClubId = (userRes?.data as { managedClubId?: string } | null)?.managedClubId;
      const saved = localStorage.getItem('selectedClubId');
      let chosen: Club | null = null;
      if (saved && list.length) {
        chosen = list.find((x: Club) => x.id === saved) ?? null;
      }
      if (!chosen && managedClubId && list.length) {
        chosen = list.find((x: Club) => x.id === managedClubId) ?? list[0] ?? null;
      }
      if (!chosen && list[0]) chosen = list[0];
      setSelectedClubState(chosen);
      if (chosen) localStorage.setItem('selectedClubId', chosen.id);
    } catch {
      setClubs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshClubs();
  }, [refreshClubs]);

  const setSelectedClub = (club: Club | null) => {
    setSelectedClubState(club);
    if (club) localStorage.setItem('selectedClubId', club.id);
    else localStorage.removeItem('selectedClubId');
  };

  return (
    <ClubContext.Provider value={{ clubs, selectedClub, setSelectedClub, loading, refreshClubs }}>
      {children}
    </ClubContext.Provider>
  );
}

export function useClub() {
  const ctx = useContext(ClubContext);
  if (!ctx) throw new Error('useClub must be used within ClubProvider');
  return ctx;
}
