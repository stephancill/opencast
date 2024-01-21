import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@lib/context/auth-context';
import { sleep } from '@lib/utils';
import { Placeholder } from '@components/common/placeholder';
import type { LayoutProps } from './common-layout';

export function AuthLayout({ children }: LayoutProps): JSX.Element {
  const [pending, setPending] = useState(true);

  const { user, loading } = useAuth();
  const { replace } = useRouter();

  useEffect(() => {
    const checkLogin = async (): Promise<void> => {
      setPending(true);

      if (user) {
        // TODO: This seems janky. Investigate.
        await sleep(500);
        void replace('/home');
      } else if (!loading) {
        // TODO: This seems janky. Investigate.
        await sleep(500);
        setPending(false);
      }
    };

    void checkLogin();
  }, [user, loading, replace]);

  if (loading || pending) return <Placeholder />;

  return <>{children}</>;
}
