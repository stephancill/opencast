import { AuthLayout } from '@components/layout/auth-layout';
import type { ReactElement, ReactNode } from 'react';
import Login from './login';

export default function Landing(): JSX.Element {
  return <Login />;
}

Landing.getLayout = (page: ReactElement): ReactNode => (
  <AuthLayout>{page}</AuthLayout>
);
