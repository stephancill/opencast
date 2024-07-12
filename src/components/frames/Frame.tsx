'use client';

import {
  FarcasterFrameContext,
  FarcasterSigner,
  signFrameAction
} from '@frames.js/render/farcaster';
import { useFrame } from '@frames.js/render/use-frame';
import { useAuth } from '@lib/context/auth-context';
import { Frame as FrameType } from 'frames.js';
import { useEffect, useState } from 'react';
import * as chains from 'viem/chains';
import {
  useAccount,
  useChainId,
  useSendTransaction,
  useSwitchChain
} from 'wagmi';
import { FrameUI } from './frame-ui';

type FrameProps = {
  url: string;
  frame: FrameType;
  frameContext: FarcasterFrameContext;
};

const getChainFromId = (id: number): chains.Chain | undefined => {
  return Object.values(chains).find((chain) => chain.id === id);
};

export function Frame({ frame, frameContext, url }: FrameProps) {
  const { user } = useAuth();
  const { address: connectedAddress } = useAccount();
  const [farcasterSigner, setFarcasterSigner] = useState<
    FarcasterSigner | undefined
  >(undefined);
  const { sendTransactionAsync, sendTransaction } = useSendTransaction();
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
    } else {
      setFarcasterSigner(undefined);
    }
  }, [user]);

  const frameState = useFrame({
    homeframeUrl: url,
    frame,
    frameActionProxy: '/frames',
    connectedAddress,
    frameGetProxy: '/frames',
    frameContext,
    signerState: {
      hasSigner: farcasterSigner !== undefined,
      signer: farcasterSigner,
      onSignerlessFramePress: () => {
        // Only run if `hasSigner` is set to `false`
        // This is a good place to throw an error or prompt the user to login
        // alert("A frame button was pressed without a signer. Perhaps you want to prompt a login");
      },
      signFrameAction: signFrameAction
    },
    onTransaction: async ({ transactionData }) => {
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
    }
  });

  return (
    <div className='w-full overflow-hidden'>
      <FrameUI frameState={frameState} />
    </div>
  );
}
