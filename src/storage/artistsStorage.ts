import AsyncStorage from '@react-native-async-storage/async-storage';

export type Artist = {
  id: number;
  name: string;
  profile_image: string | null;
};

const STORAGE_KEY = '@soundcave:featuredArtists';

export const saveFeaturedArtists = async (artists: Artist[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(artists));
  } catch (error) {
    console.error('Error saving featured artists to cache:', error);
  }
};

export const getFeaturedArtists = async (): Promise<Artist[] | null> => {
  try {
    const storedArtists = await AsyncStorage.getItem(STORAGE_KEY);
    if (!storedArtists) {
      return null;
    }
    return JSON.parse(storedArtists) as Artist[];
  } catch (error) {
    console.error('Error reading featured artists from cache:', error);
    await AsyncStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const clearFeaturedArtists = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};
