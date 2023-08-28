import { getRandomId } from '@lib/random';
import type { Bookmark } from '@lib/types/bookmark';
import type { User, UserFull } from '@lib/types/user';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { KeyPair } from '../types/keypair';
import useSWR from 'swr';
import { NotificationsResponse } from '../types/notifications';
import { fetchJSON } from '../fetch';

type AuthContext = {
  user: UserFull | null;
  error: Error | null;
  loading: boolean;
  isAdmin: boolean;
  randomSeed: string;
  userBookmarks: Bookmark[] | null;
  userNotifications: number | null;
  signOut: () => Promise<void>;
  handleUserAuth: () => void;
  resetNotifications: () => void;
};

export const AuthContext = createContext<AuthContext | null>(null);

type AuthContextProviderProps = {
  children: ReactNode;
};

export function AuthContextProvider({
  children
}: AuthContextProviderProps): JSX.Element {
  const [userId, setUserId] = useState<string | null>(null); // '1689'

  const [user, setUser] = useState<UserFull | null>(null);
  const [userBookmarks, setUserBookmarks] = useState<Bookmark[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  const [lastCheckedNotifications, setLastCheckedNotifications] =
    useState<Date | null>(null);

  const manageUser = async (keyPair: KeyPair): Promise<void> => {
    const userResponse = await fetch(`/api/signer/${keyPair.publicKey}/user`);

    if (userResponse.ok) {
      const { result: user } = await userResponse.json();
      setUser(user);
    }

    setLoading(false);
  };

  const handleUserAuth = (): void => {
    setLoading(true);

    // Get signer from local storage
    const keyPairRaw = localStorage.getItem('keyPair') as string | null;
    const keyPair = keyPairRaw ? JSON.parse(keyPairRaw) : null;

    if (keyPair) void manageUser(keyPair);
    else {
      setUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    handleUserAuth();
    setLastCheckedNotifications(
      new Date(localStorage.getItem('lastChecked') || new Date().toISOString())
    );
  }, []);

  const signOut = async (): Promise<void> => {
    try {
      localStorage.removeItem('keyPair');
      handleUserAuth();
    } catch (error) {
      setError(error as Error);
    }
  };

  const isAdmin = user ? user.username === 'ccrsxx' : false;
  const randomSeed = useMemo(getRandomId, [user?.id]);

  const { data: userNotifications, isValidating: loadingNotifications } =
    useSWR(
      user?.id && lastCheckedNotifications
        ? `/api/user/${
            user.id
          }/notifications?last_time=${lastCheckedNotifications.toISOString()}`
        : null,
      async (url) => (await fetchJSON<NotificationsResponse>(url)).result,
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        refreshWhenHidden: true,
        refreshInterval: 10000 // Poll every 10 seconds
      }
    );

  const resetNotifications = (): void => {
    setLastCheckedNotifications(new Date());
  };

  useEffect(() => {
    if (lastCheckedNotifications)
      localStorage.setItem(
        'lastChecked',
        lastCheckedNotifications.toISOString()
      );
  }, [lastCheckedNotifications]);

  const value: AuthContext = {
    user,
    error,
    loading,
    isAdmin,
    randomSeed,
    userBookmarks,
    userNotifications: userNotifications?.badgeCount || null,
    signOut,
    handleUserAuth,
    resetNotifications
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContext {
  const context = useContext(AuthContext);

  if (!context)
    throw new Error('useAuth must be used within an AuthContextProvider');

  return context;
}
