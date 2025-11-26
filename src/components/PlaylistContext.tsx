import React, { createContext, useCallback, useContext, useState } from 'react';

import { Song } from '../storage/songs';

type PlaylistContextValue = {
  songs: Song[];
  addSong: (song: Song) => void;
  removeSong: (url: string) => void;
  clear: () => void;
};

const PlaylistContext = createContext<PlaylistContextValue>({
  songs: [],
  addSong: () => {},
  removeSong: () => {},
  clear: () => {},
});

type PlaylistProviderProps = {
  children: React.ReactNode;
};

export const PlaylistProvider: React.FC<PlaylistProviderProps> = ({
  children,
}) => {
  const [songs, setSongs] = useState<Song[]>([]);

  const addSong = useCallback((song: Song) => {
    setSongs(prev => {
      if (prev.some(s => s.url === song.url)) {
        return prev;
      }
      return [...prev, song];
    });
  }, []);

  const removeSong = useCallback((url: string) => {
    setSongs(prev => prev.filter(s => s.url !== url));
  }, []);

  const clear = useCallback(() => {
    setSongs([]);
  }, []);

  return (
    <PlaylistContext.Provider value={{ songs, addSong, removeSong, clear }}>
      {children}
    </PlaylistContext.Provider>
  );
};

export const usePlaylist = () => useContext(PlaylistContext);


