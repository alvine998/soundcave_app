import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiInstance } from './api';

const STREAM_TS_PREFIX = '@soundcave:stream_ts:';

export type StreamType = 'musics' | 'podcasts' | 'music-videos';

/**
 * Tracks a stream for a specific resource if not already tracked within the last 24 hours.
 * @param type The type of the resource ('musics', 'podcasts', 'music-videos')
 * @param id The ID of the resource
 */
export const trackStream = async (type: StreamType, id: number | string) => {
  if (!id) return;

  const storageKey = `${STREAM_TS_PREFIX}${type}:${id}`;

  try {
    const lastStreamTs = await AsyncStorage.getItem(storageKey);
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000; // 24 hours in ms

    if (!lastStreamTs || now - parseInt(lastStreamTs, 10) >= cooldown) {
      console.log(`Tracking stream for ${type} ID: ${id}`);
      const api = await getApiInstance();

      // Hit the specific stream endpoint
      await api.post(`/api/${type}/${id}/stream`);

      // Update the timestamp in storage
      await AsyncStorage.setItem(storageKey, now.toString());
      return true;
    } else {
      console.log(
        `Stream for ${type} ID: ${id} already tracked within 24 hours.`,
      );
      return false;
    }
  } catch (error) {
    console.error(`Error tracking stream for ${type} ID: ${id}:`, error);
    return false;
  }
};
