import { Dialog } from '@headlessui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { encodeAbiParameters } from 'viem';
import {
  useAccount,
  useContractWrite,
  useNetwork,
  usePrepareContractWrite,
  useSwitchNetwork,
  useWaitForTransaction
} from 'wagmi';
import { KEY_GATEWAY } from '../../contracts';
import { useAuth } from '../../lib/context/auth-context';
import { generateKeyPair } from '../../lib/crypto';
import { fetchJSON } from '../../lib/fetch';
import { addKeyPair } from '../../lib/storage';
import { AppAuthResponse, AppAuthType } from '../../lib/types/app-auth';
import { KeyPair } from '../../lib/types/keypair';
import { User, UserResponse } from '../../lib/types/user';
import { truncateAddress } from '../../lib/utils';
import { Modal } from '../modal/modal';
import { Button } from '../ui/button';
import { Loading } from '../ui/loading';
import { UserAvatar } from '../user/user-avatar';
import { UserName } from '../user/user-name';
import { UserUsername } from '../user/user-username';
import useFid from '../../lib/hooks/useConnectedWalletFid';

const KEY_METADATA_TYPE_1 = [
  {
    components: [
      {
        internalType: 'uint256',
        name: 'requestFid',
        type: 'uint256'
      },
      {
        internalType: 'address',
        name: 'requestSigner',
        type: 'address'
      },
      {
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes'
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256'
      }
    ],
    internalType: 'struct SignedKeyRequestValidator.SignedKeyRequestMetadata',
    name: 'metadata',
    type: 'tuple'
  }
] as const;

const WalletSignInModal = ({
  closeModal,
  open
}: {
  closeModal: () => void;
  open: boolean;
}) => {
  const { handleUserAuth } = useAuth();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const { address } = useAccount();
  const { data: idOf } = useFid();
  const { data: user, isValidating: loadingUser } = useSWR<User | null>(
    idOf ? `/api/user/${idOf}` : null,
    async (url) => (await fetchJSON<UserResponse>(url)).result || null,
    {}
  );
  const [keypair, setKeypair] = useState<KeyPair | undefined>();
  const { data: appAuth, isValidating: appAuthLoading } =
    useSWR<AppAuthType | null>(
      keypair ? `/api/signer/${keypair.publicKey}/authorize` : null,
      async (url) => (await fetchJSON<AppAuthResponse>(url)).result || null
    );

  const { config: addKeyConfig } = usePrepareContractWrite({
    ...KEY_GATEWAY,
    chainId: 10,
    functionName: !!(keypair && appAuth) ? 'add' : undefined,
    args: [
      1,
      `0x${keypair?.publicKey}`,
      1,
      appAuth
        ? encodeAbiParameters(KEY_METADATA_TYPE_1, [
            {
              requestFid: BigInt(appAuth.requestFid),
              requestSigner: appAuth.requestSigner as `0x${string}`,
              signature: appAuth.signature as `0x${string}`,
              deadline: BigInt(appAuth.deadline)
            }
          ])
        : `0x00`
    ],
    enabled: !!(keypair && appAuth)
  });

  const {
    write: addKey,
    data: addKeySignResult,
    isLoading: addKeySignPending,
    isSuccess: addKeySignSuccess
  } = useContractWrite(addKeyConfig);

  const { isSuccess: isAddKeyTxSuccess, isLoading: isAddKeyTxLoading } =
    useWaitForTransaction({ hash: addKeySignResult?.hash });

  const newKeyPair = () => {
    generateKeyPair().then((keypair) => {
      localStorage.setItem('pendingKeyPair', JSON.stringify(keypair));
      setKeypair(keypair);
    });
  };

  const pollForSigner = async () => {
    let tries = 0;
    // TODO: Loading indicators
    while (true || tries < 40) {
      tries += 1;
      await new Promise((r) => setTimeout(r, 2000));

      const { result } = await fetchJSON<UserResponse>(
        `/api/signer/${keypair?.publicKey}/user`
      );

      if (result?.id) {
        break;
      }
    }

    // Move pending keypair to keypair
    const pendingKeyPairRaw = localStorage.getItem('pendingKeyPair') as string;
    const pendingKeyPair = JSON.parse(pendingKeyPairRaw) as KeyPair;
    localStorage.removeItem('pendingKeyPair');
    addKeyPair(pendingKeyPair);

    setTimeout(() => {
      closeModal?.();
      handleUserAuth(pendingKeyPair);
    }, 2000);
  };

  useEffect(() => {
    if (!addKeySignSuccess) return;
    console.log('polling for signer');
    pollForSigner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddKeyTxSuccess]);

  useEffect(() => {
    const keyPair = localStorage.getItem('pendingKeyPair');
    if (keyPair) {
      setKeypair(JSON.parse(keyPair));
    } else {
      newKeyPair();
    }
  }, []);

  return (
    <Modal
      className='flex items-start justify-center'
      modalClassName='bg-main-background rounded-2xl max-w-xl p-4 overflow-hidden flex justify-center'
      open={open}
      closeModal={closeModal}
    >
      <div>
        <div className='flex flex-col gap-2'>
          <div className='flex'>
            <Dialog.Title className='flex-grow text-xl font-bold'>
              Sign in with Ethereum Wallet
            </Dialog.Title>
            <button onClick={closeModal}>x</button>
          </div>

          <Dialog.Description className='text-light-secondary dark:text-dark-secondary'>
            Connect your wallet below to get started.
          </Dialog.Description>
        </div>
        <div className='flex flex-col justify-center gap-4 p-8 pb-4'>
          <div className={`p-2 pl-0`} data-rk='data-rk'>
            <ConnectButton
              chainStatus={'icon'}
              showBalance={true}
            ></ConnectButton>
          </div>
          {address && (
            <>
              {chain?.id !== 10 && (
                <div>
                  <div>Please connect to the Optimism network</div>
                  <Button
                    className='accent-tab mt-2 flex items-center justify-center bg-main-accent font-bold text-white enabled:hover:bg-main-accent/90 enabled:active:bg-main-accent/75'
                    onClick={() => switchNetwork?.(10)}
                  >
                    Switch to Optimism
                  </Button>
                </div>
              )}
              {!idOf && chain?.id === 10 && (
                <div>
                  This address is not registered on the Farcaster network.
                </div>
              )}
              {idOf &&
                chain?.id === 10 &&
                appAuth &&
                (loadingUser || appAuthLoading ? (
                  <Loading />
                ) : (
                  user &&
                  keypair && (
                    <div>
                      <div className='flex flex-wrap items-center gap-2'>
                        <div className='flex flex-grow gap-3 truncate'>
                          <UserAvatar
                            src={user.photoURL}
                            alt={user.name}
                            size={40}
                          />
                          <div className='hidden truncate text-start leading-5 xl:block'>
                            <UserName
                              name={user.name}
                              className='start'
                              verified={user.verified}
                            />
                            <UserUsername
                              username={user.username}
                              disableLink
                            />
                          </div>
                        </div>
                        {addKeySignPending || isAddKeyTxLoading ? (
                          <Loading></Loading>
                        ) : (
                          !isAddKeyTxSuccess && (
                            <Button
                              disabled={addKeySignPending}
                              onClick={addKey}
                              className='accent-tab flex-grow items-center justify-center bg-main-accent font-bold text-white enabled:hover:bg-main-accent/90 enabled:active:bg-main-accent/75'
                            >
                              Sign in
                            </Button>
                          )
                        )}
                      </div>
                      <div className='mt-2 break-all text-center text-sm text-light-secondary dark:text-dark-secondary'>
                        Authorizing{' '}
                        <span title={keypair.publicKey}>
                          {truncateAddress(`0x${keypair.publicKey}`)}{' '}
                        </span>
                        <button className='underline' onClick={newKeyPair}>
                          Reset
                        </button>
                      </div>
                      {addKeySignResult?.hash && (
                        <a
                          href={`https://optimistic.etherscan.io/tx/${addKeySignResult.hash}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-center text-sm text-light-secondary underline dark:text-dark-secondary'
                        >
                          View transaction
                        </a>
                      )}
                    </div>
                  )
                ))}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default WalletSignInModal;
