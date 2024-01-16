import { Aside } from '@components/aside/aside';
import { Placeholder } from '@components/common/placeholder';
import { useRequireAuth } from '@lib/hooks/useRequireAuth';
import type { ReactNode } from 'react';
import { AsideTrends } from '../aside/trends';

export type LayoutProps = {
  children: ReactNode;
};

export function ProtectedLayout({ children }: LayoutProps): JSX.Element {
  const user = useRequireAuth();

  if (!user) return <Placeholder />;

  return <>{children}</>;
}

export function HomeLayout({ children }: LayoutProps): JSX.Element {
  return (
    <>
      {children}
      <Aside>
        {/* <Suggestions /> */}
        <AsideTrends />
      </Aside>
    </>
  );
}

export function UserLayout({ children }: LayoutProps): JSX.Element {
  return (
    <>
      {children}
      <Aside>
        {/* <Suggestions /> */}
        <></>
      </Aside>
      <></>
    </>
  );
}

export function TrendsLayout({ children }: LayoutProps): JSX.Element {
  return (
    <>
      {children}
      <Aside>
        {/* <Suggestions /> */}
        <></>
      </Aside>
    </>
  );
}

export function PeopleLayout({ children }: LayoutProps): JSX.Element {
  return <>{children}</>;
}
