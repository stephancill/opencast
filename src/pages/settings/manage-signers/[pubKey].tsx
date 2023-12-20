import { SEO } from '@components/common/seo';
import { MainContainer } from '@components/home/main-container';
import { MainHeader } from '@components/home/main-header';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { useRouter } from 'next/router';
import { useRef, useState, type ReactElement, type ReactNode } from 'react';
import useSWR from 'swr';
import { Error } from '../../../components/ui/error';
import { Loading } from '../../../components/ui/loading';
import { MenuRow } from '../../../components/ui/menu-row';
import { useAuth } from '../../../lib/context/auth-context';
import { formatDate, formatNumber } from '../../../lib/date';
import { fetchJSON } from '../../../lib/fetch';
import {
  MessagesArchive,
  MessagesArchiveResponse,
  SignerDetail,
  SignerResponse
} from '../../../lib/types/signer';
import { truncateAddress } from '../../../lib/utils';
import {
  batchSubmitHubMessages,
  makeMessage
} from '../../../lib/farcaster/utils';
import { Message } from '@farcaster/hub-web';

function getSignerDescription(signer: SignerDetail) {
  return `${formatNumber(
    signer.messageCount
  )} messages • Last used ${formatDate(
    new Date(signer.lastMessageTimestamp),
    'tweet'
  )} • Created ${formatDate(new Date(signer.createdAtTimestamp), 'tweet')}`;
}

export default function SignerDetailPage(): JSX.Element {
  const { user } = useAuth();

  const {
    query: { pubKey },
    back
  } = useRouter();

  const { data: signer, isValidating: loading } = useSWR(
    `/api/user/${user?.id}/signers/${pubKey}`,
    async (url: string) => (await fetchJSON<SignerResponse>(url)).result,
    {
      revalidateOnFocus: false
    }
  );

  const inputFile = useRef<HTMLInputElement>(null);

  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [isSignAndBroadcastLoading, setIsSignAndBroadcastLoading] =
    useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const [importedData, setImportedData] = useState<MessagesArchive | null>(
    null
  );

  const handleBackup = async () => {
    setIsBackupLoading(true);
    try {
      const res = await fetchJSON<MessagesArchiveResponse>(
        `/api/user/${user?.id}/signers/${pubKey}/backup`
      ).catch((err) => console.error(err));
      if (!res) return;
      const result = res.result;
      const blob = new Blob([JSON.stringify(result)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `opencast-backup-${pubKey}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {}

    setIsBackupLoading(false);
  };

  const handleSignAndRebroadcast = async () => {
    setIsSignAndBroadcastLoading(true);

    try {
      const signedMessages = await Promise.all(
        importedData!.messages.map(async (message) => {
          const newMessage = await makeMessage(message.data!);
          return newMessage;
        })
      );

      console.log(signedMessages);

      // Submit messages
      // TODO: See if this works
      // await batchSubmitHubMessages(
      //   signedMessages.filter((m) => m !== null) as Message[]
      // );
    } catch (error) {
      console.error(error);
    }

    setIsSignAndBroadcastLoading(false);
  };

  const handleDelete = async () => {
    setIsDeleteLoading(true);
    setTimeout(() => {
      setIsDeleteLoading(false);
    }, 1000);
  };

  const matchesCurrentSigner = (pubKey: string) =>
    user?.keyPair?.publicKey.toLowerCase() === pubKey.toLowerCase();

  return (
    <MainContainer>
      <SEO title={`Manage Signer / Opencast`} />
      <MainHeader
        useMobileSidebar
        title={
          signer
            ? signer.name || truncateAddress(`0x${signer.pubKey}`)
            : 'Manage Signer'
        }
        description={signer ? getSignerDescription(signer) : ''}
        useActionButton
        action={back}
      >
        {signer ? (
          <div>
            <div></div>
          </div>
        ) : (
          ''
        )}
      </MainHeader>
      <section>
        {!user?.keyPair ? (
          <div>You're not logged in.</div>
        ) : loading ? (
          <Loading />
        ) : signer ? (
          <div>
            <input
              type='file'
              id='file'
              ref={inputFile}
              style={{ display: 'none' }}
              accept='application/json'
              onChange={(e) => {
                const files = e.target?.files;
                if (files && files[0]) {
                  const file = files[0];
                  var reader = new FileReader();
                  reader.readAsText(file, 'UTF-8');
                  reader.onload = function (evt) {
                    if (evt.target?.result) {
                      console.log(evt.target.result);
                      if (typeof evt.target.result === 'string') {
                        const json = JSON.parse(evt.target.result);
                        console.log(json);
                        setImportedData(json);
                      }

                      //
                    }
                  };
                  reader.onerror = function (evt) {
                    console.error(`Error loading file`);
                  };
                }
              }}
            />
            <MenuRow
              title='Backup'
              description='Create an archive of all messages signed by this signer'
              onClick={handleBackup}
              iconName='ArchiveBoxArrowDownIcon'
              isLoading={isBackupLoading}
            />
            {matchesCurrentSigner(signer.pubKey) && (
              <>
                <MenuRow
                  title='Import'
                  description='Import an archive of messages to be re-signed and broadcasted by this signer'
                  onClick={() => inputFile.current?.click()}
                  iconName='PencilIcon'
                />
                {importedData && (
                  <div className='flex'>
                    <div className='w-16 border-b'></div>
                    <div className='w-full border-l'>
                      <MenuRow
                        title='Sign & Rebroadcast'
                        description={`Sign & rebroadcast ${
                          importedData.messages.length
                        } messages by ${
                          importedData.signer.name ||
                          truncateAddress(`0x${importedData.signer.pubKey}`)
                        }`}
                        onClick={handleSignAndRebroadcast}
                        iconName='SignalIcon'
                        isLoading={isSignAndBroadcastLoading}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <MenuRow
              title='Delete & Revoke All'
              description='Remove the signer and revoke all messages signed by this signer'
              onClick={handleDelete}
              iconName='TrashIcon'
              variant='destructive'
              isLoading={isDeleteLoading}
            />
          </div>
        ) : (
          <Error />
        )}
      </section>
    </MainContainer>
  );
}

SignerDetailPage.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);
