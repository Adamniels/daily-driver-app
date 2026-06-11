/**
 * One interface for the auth token, two backends: expo-secure-store on
 * native, localStorage on web (SecureStore has no web implementation).
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY = 'habit-quest.token';

export interface TokenStorage {
  get(): Promise<string | null>;
  set(token: string): Promise<void>;
  clear(): Promise<void>;
}

const webStorage: TokenStorage = {
  get: () => Promise.resolve(globalThis.localStorage.getItem(KEY)),
  set: (token) => {
    globalThis.localStorage.setItem(KEY, token);
    return Promise.resolve();
  },
  clear: () => {
    globalThis.localStorage.removeItem(KEY);
    return Promise.resolve();
  },
};

const nativeStorage: TokenStorage = {
  get: () => SecureStore.getItemAsync(KEY),
  set: (token) => SecureStore.setItemAsync(KEY, token),
  clear: () => SecureStore.deleteItemAsync(KEY),
};

export const tokenStorage: TokenStorage = Platform.OS === 'web' ? webStorage : nativeStorage;
