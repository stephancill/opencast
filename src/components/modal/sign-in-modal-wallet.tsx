import { Dialog } from '@headlessui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { encodeAbiParameters } from 'viem';
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract
} from 'wagmi';
import { KEY_GATEWAY } from '../../contracts';
import { useAuth } from '../../lib/context/auth-context';
import { generateKeyPair } from '../../lib/crypto';
import { fetchJSON } from '../../lib/fetch';
import useFid from '../../lib/hooks/useConnectedWalletFid';
import { addKeyPair } from '../../lib/keys';
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
import { add } from 'lodash';

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

const PENDING_KEY_REQUEST = '-opencast-pendingSignerRequest';

type KeyRequest =
  | {
      keyPair: KeyPair;
      authorization: AppAuthType;
      state: 'pending' | 'authorized' | 'completed';
    }
  | {
      state: 'preparing';
      keyPair: KeyPair;
    };

const WalletSignInModal = ({
  closeModal,
  open
}: {
  closeModal: () => void;
  open: boolean;
}) => {
  const { handleUserAuth } = useAuth();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { address } = useAccount();
  const { data: idOf } = useFid();
  const { data: user, isValidating: loadingUser } = useSWR<User | null>(
    idOf ? `/api/user/${idOf}?full=false` : null,
    async (url) => (await fetchJSON<UserResponse>(url)).result || null,
    {}
  );
  // const { data: appAuth, isValidating: appAuthLoading } =
  //   useSWR<AppAuthType | null>(
  //     keypair ? `/api/signer/${keypair.publicKey}/authorize` : null,
  //     async (url) => (await fetchJSON<AppAuthResponse>(url)).result || null
  //   );

  const [appAuthLoading, setAppAuthLoading] = useState<boolean>(false);

  const [pendingRequest, setPendingRequest] = useState<KeyRequest | null>(null);
  const [polling, setPolling] = useState<boolean>(false);

  const {
    writeContract: addKey,
    data: addKeyTxHash,
    isPending: addKeySignPending,
    isSuccess: addKeySignSuccess,
    error: addKeyError
  } = useWriteContract();

  const { isSuccess: isAddKeyTxSuccess, isLoading: isAddKeyTxLoading } =
    useWaitForTransactionReceipt({ hash: addKeyTxHash });

  useEffect(() => {}, [addKeyTxHash]);

  useEffect(() => {
    if (pendingRequest) {
      localStorage.setItem(PENDING_KEY_REQUEST, JSON.stringify(pendingRequest));

      if (pendingRequest?.state === 'preparing') {
        setAppAuthLoading(true);
        fetchJSON<AppAuthResponse>(
          `/api/signer/${pendingRequest.keyPair.publicKey}/authorize`
        )
          .then(({ result: authorizationResult, message }) => {
            if (!authorizationResult) {
              console.error('Error generating signature', message);
              return;
            }
            setAppAuthLoading(false);
            setPendingRequest({
              ...pendingRequest,
              authorization: authorizationResult,
              state: 'authorized'
            });
          })
          .catch((e) => {
            setAppAuthLoading(false);
          });
      } else if (pendingRequest.state === 'authorized' && addKeyTxHash) {
        setPendingRequest({
          ...pendingRequest,
          state: 'pending'
        });
      } else if (pendingRequest.state === 'pending') {
        if (!polling) {
          pollForSigner();
        }
      } else if (pendingRequest.state === 'completed') {
        addKeyPair(pendingRequest.keyPair);
        localStorage.removeItem(PENDING_KEY_REQUEST);
        handleUserAuth(pendingRequest.keyPair);
        closeModal?.();
      }
    }
  }, [pendingRequest, addKeyTxHash]);

  useEffect(() => {
    // Load existing request
    const pendingKeyRequest = localStorage.getItem(
      PENDING_KEY_REQUEST
    ) as string;

    let request: KeyRequest | undefined;

    if (pendingKeyRequest) {
      const parsed: KeyRequest = JSON.parse(pendingKeyRequest);
      // Check that request is still valid
      if (
        parsed.state !== 'preparing' &&
        parsed.authorization.deadline &&
        parsed.authorization.deadline > Math.floor(Date.now() / 1000)
      ) {
        request = parsed;
      }
    }

    if (!request) {
      newKeyPair();
      return;
    }

    setPendingRequest(request);
  }, []);

  const newKeyPair = () => {
    generateKeyPair().then((keypair) => {
      setPendingRequest({
        keyPair: keypair,
        state: 'preparing'
      });
    });
  };

  const pollForSigner = async () => {
    if (pendingRequest?.state !== 'pending') return;

    setPolling(true);

    let tries = 0;
    // TODO: Loading indicators
    while (true || tries < 40) {
      tries += 1;
      await new Promise((r) => setTimeout(r, 2000));

      const { result } = await fetchJSON<UserResponse>(
        `/api/signer/${pendingRequest.keyPair.publicKey}/user`
      );

      if (result?.id) {
        break;
      }
    }

    setPolling(false);
    setPendingRequest({
      ...pendingRequest,
      state: 'completed'
    });
  };

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
              {chainId !== 10 && (
                <div>
                  <div>Please connect to the Optimism network</div>
                  <Button
                    className='accent-tab mt-2 flex items-center justify-center bg-main-accent font-bold text-white enabled:hover:bg-main-accent/90 enabled:active:bg-main-accent/75'
                    onClick={() => switchChain({ chainId: 10 })}
                  >
                    Switch to Optimism
                  </Button>
                </div>
              )}
              {!idOf && chainId === 10 && (
                <div>
                  This address is not registered on the Farcaster network.
                </div>
              )}
              {idOf &&
                chainId === 10 &&
                (loadingUser || appAuthLoading ? (
                  <Loading />
                ) : (
                  user &&
                  pendingRequest?.state === 'authorized' && (
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
                          !isAddKeyTxSuccess &&
                          pendingRequest.state === 'authorized' &&
                          pendingRequest?.keyPair && (
                            <Button
                              disabled={addKeySignPending}
                              onClick={() => {
                                addKey({
                                  ...KEY_GATEWAY,
                                  chainId: 10,
                                  functionName: 'add',
                                  args: [
                                    1,
                                    pendingRequest.keyPair.publicKey,
                                    1,
                                    encodeAbiParameters(KEY_METADATA_TYPE_1, [
                                      {
                                        requestFid: BigInt(
                                          pendingRequest.authorization
                                            .requestFid
                                        ),
                                        requestSigner: pendingRequest
                                          .authorization
                                          .requestSigner as `0x${string}`,
                                        signature: pendingRequest.authorization
                                          .signature as `0x${string}`,
                                        deadline: BigInt(
                                          pendingRequest.authorization.deadline
                                        )
                                      }
                                    ])
                                  ]
                                });
                              }}
                              className='accent-tab flex-grow items-center justify-center bg-main-accent font-bold text-white enabled:hover:bg-main-accent/90 enabled:active:bg-main-accent/75'
                            >
                              Sign in
                            </Button>
                          )
                        )}
                      </div>
                      {pendingRequest?.keyPair && (
                        <div className='mt-2 break-all text-center text-sm text-light-secondary dark:text-dark-secondary'>
                          Authorizing{' '}
                          <span title={pendingRequest.keyPair.publicKey}>
                            {truncateAddress(pendingRequest.keyPair.publicKey)}{' '}
                          </span>
                          <button className='underline' onClick={newKeyPair}>
                            Reset
                          </button>
                        </div>
                      )}
                      {addKeyTxHash && (
                        <a
                          href={`https://optimistic.etherscan.io/tx/${addKeyTxHash}`}
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
