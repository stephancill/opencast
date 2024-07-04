import { SEO } from '@components/common/seo';
import { MainContainer } from '@components/home/main-container';
import { MainHeader } from '@components/home/main-header';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { Message } from '@farcaster/hub-web';
import cn from 'clsx';
import { useRouter } from 'next/router';
import { useRef, useState, type ReactElement, type ReactNode } from 'react';
import useSWR from 'swr';
import {
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction
} from 'wagmi';
import { TweetFeed } from '../../../components/feed/tweet-feed';
import { Error } from '../../../components/ui/error';
import { HeroIcon } from '../../../components/ui/hero-icon';
import { Loading } from '../../../components/ui/loading';
import { MenuRow } from '../../../components/ui/menu-row';
import { SegmentedNavLink } from '../../../components/ui/segmented-nav-link';
import { KEY_REGISTRY } from '../../../contracts';
import { useAuth } from '../../../lib/context/auth-context';
import { formatDate, formatNumber } from '../../../lib/date';
import {
  batchSubmitHubMessages,
  makeMessage
} from '../../../lib/farcaster/utils';
import { fetchJSON } from '../../../lib/fetch';
import useConnectedWalletFid from '../../../lib/hooks/useConnectedWalletFid';
import {
  MessagesArchive,
  MessagesArchiveResponse,
  SignerDetail,
  SignerResponse
} from '../../../lib/types/signer';
import { truncateAddress } from '../../../lib/utils';
import { CautionWarn } from '../../../components/ui/caution-warn';

function getSignerDescription(signer: SignerDetail) {
  return `${formatNumber(
    signer.messageCount
  )} messages • Last used ${formatDate(
    new Date(signer.lastMessageTimestamp),
    'tweet'
  )}`;

  //• Created ${formatDate(new Date(signer.createdAtTimestamp), 'tweet')}
}

export default function SignerDetailPage(): JSX.Element {
  const { user } = useAuth();
  const { data: fid } = useConnectedWalletFid();

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

  const { config: removeKeyConfig, error: removeKeyError } =
    usePrepareContractWrite({
      ...KEY_REGISTRY,
      chainId: 10,
      functionName: signer ? 'remove' : undefined,
      args: signer?.pubKey ? [signer.pubKey] : undefined,
      enabled: !!signer
    });

  const {
    write: removeKey,
    data: removeKeySignResult,
    isLoading: removeKeySignPending,
    isSuccess: removeKeySignSuccess
  } = useContractWrite(removeKeyConfig);

  const {
    data: removeKeyTxReceipt,
    isSuccess: isRemoveKeyTxSuccess,
    isLoading: isRemoveKeyTxLoading
  } = useWaitForTransaction({ hash: removeKeySignResult?.hash });

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
        importedData!.messages.map(async (messageJson) => {
          const message = Message.fromJSON(messageJson);
          const newMessage = await makeMessage(message.data!);
          return newMessage;
        })
      );

      console.log(signedMessages.map((m) => Message.toJSON(m!)));

      // Submit messages
      // TODO: See if this works
      await batchSubmitHubMessages(
        signedMessages.filter((m) => m !== null) as Message[]
      );
    } catch (error) {
      console.error(error);
    }

    setIsSignAndBroadcastLoading(false);
  };

  const handleDelete = async () => {
    removeKey?.();
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
            ? signer.name || truncateAddress(signer.pubKey)
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
            <CautionWarn />
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
                          truncateAddress(importedData.signer.pubKey)
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

            {fid !== undefined && fid.toString() === user.id ? (
              <MenuRow
                title='Delete & revoke all'
                description='Remove the signer and revoke all messages signed by this signer'
                onClick={handleDelete}
                iconName='TrashIcon'
                variant='destructive'
                isLoading={
                  isDeleteLoading ||
                  removeKeySignPending ||
                  (removeKeySignResult?.hash != null && isRemoveKeyTxLoading)
                }
              />
            ) : (
              <div
                className='accent-tab relative 
               flex cursor-pointer flex-col gap-0.5 border-b border-light-border dark:border-dark-border lg:px-6 lg:py-4'
              >
                <div
                  className={cn(
                    'flex items-center text-light-secondary dark:text-dark-secondary'
                  )}
                >
                  <div className={cn('mr-4 overflow-hidden')}>
                    <HeroIcon
                      className={cn('h-6 w-6')}
                      iconName={'TrashIcon'}
                    />
                  </div>
                  <div>
                    <p className='font-bold '>Wallet not connected</p>
                    <p className='text-sm'>
                      Connect wallet in the sidebar to remove signer
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div
              className='hover-animation flex justify-between overflow-y-auto
    border-b border-light-border dark:border-dark-border'
            >
              {[
                signer.castAddCount + signer.castRemoveCount > 0
                  ? {
                      name: `Casts (+${signer.castAddCount} -${signer.castRemoveCount})`,
                      value: 'casts'
                    }
                  : undefined,
                signer.reactionAddCount + signer.reactionRemoveCount > 0
                  ? {
                      name: `Reactions (+${signer.reactionAddCount} -${signer.reactionRemoveCount})`,
                      value: 'reactions'
                    }
                  : undefined,
                signer.linkAddCount + signer.linkRemoveCount > 0
                  ? {
                      name: `Links (+${signer.linkAddCount} -${signer.linkRemoveCount})`,
                      value: 'links'
                    }
                  : undefined,
                signer.verificationAddEthAddressCount +
                  signer.verificationRemoveCount >
                0
                  ? {
                      name: `Verifications (+${signer.verificationAddEthAddressCount} -${signer.verificationRemoveCount})`,
                      value: 'verifications'
                    }
                  : undefined
              ]
                .filter((i) => i !== undefined)
                .map((item) => (
                  <SegmentedNavLink
                    name={item!.name}
                    key={item!.value}
                    isActive={item!.value === 'casts'}
                    onClick={() => {}}
                  />
                ))}
            </div>
            <TweetFeed
              apiEndpoint={`/api/user/${user?.id}/signers/${pubKey}/casts?fid=${user.id}`}
              feedOrdering='latest'
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
