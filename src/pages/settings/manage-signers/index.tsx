import { SEO } from '@components/common/seo';
import { MainContainer } from '@components/home/main-container';
import { MainHeader } from '@components/home/main-header';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { useRouter } from 'next/router';
import { type ReactElement, type ReactNode } from 'react';
import useSWR from 'swr';
import { Error } from '../../../components/ui/error';
import { Loading } from '../../../components/ui/loading';
import { MenuRow } from '../../../components/ui/menu-row';
import { useAuth } from '../../../lib/context/auth-context';
import { formatDate, formatNumber } from '../../../lib/date';
import { fetchJSON } from '../../../lib/fetch';
import { SignersResponse } from '../../../lib/types/signer';
import { truncateAddress } from '../../../lib/utils';

export default function Home(): JSX.Element {
  const { user, userNotifications } = useAuth();

  const { back } = useRouter();

  const { data: signers, isValidating: loading } = useSWR(
    `/api/user/${user?.id}/signers`,
    async (url: string) => (await fetchJSON<SignersResponse>(url)).result,
    {
      revalidateOnFocus: false
    }
  );

  return (
    <MainContainer>
      <SEO title={`Manage Signers / Opencast`} />
      <MainHeader
        useMobileSidebar
        title='Manage Signers'
        useActionButton
        action={back}
      ></MainHeader>
      <section>
        {!user?.keyPair ? (
          <div>You're not logged in.</div>
        ) : loading ? (
          <Loading />
        ) : signers ? (
          signers.map((signer) => (
            <MenuRow
              href={`/settings/manage-signers/${signer.pubKey}`}
              title={signer.name || truncateAddress(`0x${signer.pubKey}`)}
              description={`${formatNumber(
                signer.messageCount
              )} messages • Last used ${formatDate(
                new Date(signer.lastMessageTimestamp),
                'tweet'
              )} • Created ${formatDate(
                new Date(signer.createdAtTimestamp),
                'tweet'
              )}`}
              iconName='KeyIcon'
              key={signer.pubKey}
            ></MenuRow>
          ))
        ) : (
          <Error />
        )}
      </section>
    </MainContainer>
  );
}

Home.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);
