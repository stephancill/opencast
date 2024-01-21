import { getRandomId } from '@lib/random';
import type { Bookmark } from '@lib/types/bookmark';
import type { UserFull } from '@lib/types/user';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { fetchJSON } from '../fetch';
import { useModal } from '../hooks/useModal';
import { KeyPair } from '../types/keypair';
import { NotificationsResponseSummary } from '../types/notifications';
import { useRouter } from 'next/router';
import { usePrivy } from '@privy-io/react-auth';

type UserWithKey = UserFull & { keyPair?: KeyPair };

type AuthContext = {
  user: UserWithKey | null;
  error: Error | null;
  loading: boolean;
  isAdmin: boolean;
  randomSeed: string;
  userBookmarks: Bookmark[] | null;
  userNotifications: number | null;
  lastCheckedNotifications: Date | null;
  timelineCursor: Date | null;
  setTimelineCursor: (date: Date | null) => void;
  signOut: () => Promise<void>;
  showAddAccountModal: () => void;
  resetNotifications: () => void;
};

export const AuthContext = createContext<AuthContext | null>(null);

type AuthContextProviderProps = {
  children: ReactNode;
};

export function AuthContextProvider({
  children
}: AuthContextProviderProps): JSX.Element {
  const router = useRouter();

  const [user, _setUser] = useState<UserWithKey | null>(null);
  const [userBookmarks] = useState<Bookmark[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, _setLoading] = useState(true);
  const {
    ready: authReady,
    authenticated: userAuthenticated,
    user: privyUser,
    logout: privyLogOut
  } = usePrivy();

  console.log({
    authReady,
    userAuthenticated,
    privyUser
  });

  const modal = useModal();

  const [lastCheckedNotifications, setLastCheckedNotifications] =
    useState<Date | null>(null);

  const [timelineCursor, setTimelineCursor] = useState<Date | null>(null);

  useEffect(() => {
    setLastCheckedNotifications(
      new Date(localStorage.getItem('lastChecked') || new Date().toISOString())
    );
    setTimelineCursor(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async (): Promise<void> => {
    try {
      await privyLogOut();
    } catch (error) {
      setError(error as Error);
    }
  };

  const isAdmin = false;
  const randomSeed = useMemo(getRandomId, [user?.id]);

  const { data: userNotifications } = useSWR(
    router.pathname !== '/notifications' &&
      user?.keyPair &&
      lastCheckedNotifications
      ? `/api/user/${
          user.id
        }/notifications?last_time=${lastCheckedNotifications.toISOString()}`
      : null,
    async (url) => (await fetchJSON<NotificationsResponseSummary>(url)).result,
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
    timelineCursor,
    setTimelineCursor,
    signOut,
    showAddAccountModal: modal.openModal,
    resetNotifications,
    lastCheckedNotifications
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContext {
  const context = useContext(AuthContext);

  if (!context)
    throw new Error('useAuth must be used within an AuthContextProvider');

  return context;
}
