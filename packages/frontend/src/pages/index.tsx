import { useRouter } from 'next/router';
import Login from './login';
import React from 'react';
import { useAuth } from '@lib/context/auth-context';

export default function Landing(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user) {
      router.push('/home');
    }
  }, [user, router]);

  return <Login />;
}
