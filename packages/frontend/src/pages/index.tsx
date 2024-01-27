import { useRouter } from 'next/router';
import Login from './login';
import React from 'react';
import { useAuth } from '@lib/context/auth-context';
import { isProduction } from '@lib/env';

export default function Landing(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user) {
      router.push('/home');
    }
  }, [user, router]);

  return isProduction ? <div>Coming soon</div> : <Login />;
}
