import { SEO } from '@components/common/seo';
import { MainContainer } from '@components/home/main-container';
import { MainHeader } from '@components/home/main-header';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { useRouter } from 'next/router';
import { type ReactElement, type ReactNode } from 'react';
import { MenuLinkProps, MenuRow } from '../../components/ui/menu-row';
import { useAuth } from '../../lib/context/auth-context';

const menuLinks: MenuLinkProps[] = [
  {
    href: '/settings/manage-signers',
    description: 'Manage the keypairs that have access to your account',
    title: 'Manage Signers',
    iconName: 'KeyIcon'
  }
];

export default function Settings(): JSX.Element {
  const { user } = useAuth();

  const { back } = useRouter();

  return (
    <MainContainer>
      <SEO title={`Settings / Selekt`} />
      <MainHeader
        useMobileSidebar
        title='Settings'
        useActionButton
        action={back}
      ></MainHeader>
      {!user?.keyPair ? (
        <div>You're not logged in.</div>
      ) : (
        <div>
          <section>
            {menuLinks.map((item) => (
              <MenuRow {...item} key={item.href}></MenuRow>
            ))}
          </section>
        </div>
      )}
    </MainContainer>
  );
}

Settings.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);
