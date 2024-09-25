import { OnTransactionFunc, UseFrameOptions } from '@frames.js/render';
import { FarcasterSigner, signFrameAction } from '@frames.js/render/farcaster';
import { useAuth } from '@lib/context/auth-context';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import {
  useAccount,
  useChainId,
  useSendTransaction,
  useSwitchChain
} from 'wagmi';

type FrameContextType = {
  frameConfig: Omit<UseFrameOptions, 'frameContext' | 'homeframeUrl' | 'frame'>;
};

const FrameContext = createContext<FrameContextType | undefined>(undefined);

export const useFrameConfig = () => {
  const context = useContext(FrameContext);
  if (!context) {
    throw new Error('useFrameContext must be used within a FrameProvider');
  }
  return context;
};

export const FrameConfigProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { user } = useAuth();
  const { address: connectedAddress } = useAccount();
  const [farcasterSigner, setFarcasterSigner] = useState<
    FarcasterSigner | undefined
  >(undefined);
  const { sendTransactionAsync } = useSendTransaction();
  const currentChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  useEffect(() => {
    if (user?.keyPair) {
      setFarcasterSigner({
        fid: parseInt(user.id),
        privateKey: user.keyPair.privateKey,
        status: 'approved',
        publicKey: user.keyPair.publicKey
      });

      console.log('farcasterSigner', farcasterSigner);
    } else {
      setFarcasterSigner(undefined);
    }
  }, [user]);

  const onTransaction: OnTransactionFunc = useCallback(
    async ({ transactionData }) => {
      // Switch to the chain that the transaction is on
      const chainId = parseInt(transactionData.chainId.split(':')[1]);
      if (chainId !== currentChainId) {
        const newChain = await switchChainAsync?.({ chainId });
        if (!newChain) {
          console.error('Failed to switch network');
          return null;
        }
      }

      const hash = await sendTransactionAsync({
        ...transactionData.params,
        value: transactionData.params.value
          ? BigInt(transactionData.params.value)
          : undefined,
        chainId: parseInt(transactionData.chainId.split(':')[1])
      });
      return hash || null;
    },
    [currentChainId, switchChainAsync, sendTransactionAsync]
  );

  const frameConfig = useMemo(
    () =>
      ({
        frameActionProxy: '/frames',
        connectedAddress,
        frameGetProxy: '/frames',
        signerState: {
          hasSigner: farcasterSigner !== undefined,
          signer: farcasterSigner || null,
          onSignerlessFramePress: async () => {
            // Only run if `hasSigner` is set to `false`
            // This is a good place to throw an error or prompt the user to login
            // alert("A frame button was pressed without a signer. Perhaps you want to prompt a login");
          },
          // @ts-ignore -- TODO: Fix this
          signFrameAction,
          isLoadingSigner: false,
          logout: async () => {}
        },
        onTransaction
      } as FrameContextType['frameConfig']),
    [connectedAddress, farcasterSigner, onTransaction]
  );

  const contextValue = useMemo(() => ({ frameConfig }), [frameConfig]);

  return (
    <FrameContext.Provider value={contextValue}>
      {children}
    </FrameContext.Provider>
  );
};
