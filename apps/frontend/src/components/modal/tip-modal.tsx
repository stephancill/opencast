import { Dialog } from '@headlessui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { parseEther } from 'viem';
import { useAccount, useChainId, useSendTransaction } from 'wagmi';
import * as chains from 'wagmi/chains';
import { UserFull } from '../../lib/types/user';
import { truncateAddress } from '../../lib/utils';
import { Button } from '../ui/button';
import { HeroIcon } from '../ui/hero-icon';
import { Loading } from '../ui/loading';
import { Modal } from './modal';

interface TipModalProps {
  tipUserOpen: boolean;
  tipCloseModal: () => void;
  isUserLoading: boolean;
  user?: UserFull;
  username: string;
}

export function TipModal({
  tipCloseModal,
  tipUserOpen,
  isUserLoading,
  user,
  username
}: TipModalProps) {
  const { address: currentUserAddress } = useAccount();
  const chainId = useChainId();

  const [tipAmount, setTipAmount] = useState<number>(0.001);
  const {
    data: tipTxResult,
    isLoading: tipTxResultLoading,
    isSuccess: tipTxSuccess,
    sendTransaction: sendTipTx
  } = useSendTransaction({
    to: user?.address || undefined,
    value: parseEther(tipAmount.toString())
  });

  useEffect(() => {
    if (!tipTxSuccess) return;
    tipCloseModal();

    const chainById = Object.values(chains).reduce(
      (acc: { [key: string]: chains.Chain }, cur) => {
        if (cur.id) acc[cur.id] = cur;
        return acc;
      },
      {}
    );

    const chain = chainById[chainId];
    const explorerUrl = chain?.blockExplorers?.default;
    const url = `${explorerUrl?.url}/tx/${tipTxResult?.hash}`;

    if (!url) return;

    toast.success(
      () => (
        <span className='flex gap-2'>
          Your tip was sent
          <Link href={`${explorerUrl?.url}/tx/${tipTxResult?.hash}`}>
            <a className='custom-underline font-bold' target='_blank'>
              View
            </a>
          </Link>
        </span>
      ),
      { duration: 6000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipTxSuccess]);

  return (
    <Modal
      modalClassName='max-w-sm bg-main-background w-full p-8 rounded-2xl'
      open={tipUserOpen}
      closeModal={tipCloseModal}
    >
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <div className='flex items-center'>
              <i className='inline pr-2'>
                <HeroIcon iconName='BanknotesIcon' />
              </i>
              <Dialog.Title className='inline text-xl font-bold'>
                Tip user
              </Dialog.Title>
            </div>
            <Dialog.Description className='text-light-secondary dark:text-dark-secondary'>
              Send @{username} some ETH
            </Dialog.Description>
          </div>
          {isUserLoading ? (
            <Loading />
          ) : (
            <div className='flex flex-col'>
              <div className={`p-2 pl-0`} data-rk='data-rk'>
                <ConnectButton></ConnectButton>
              </div>
              {user?.address ? (
                currentUserAddress && (
                  <div className='mt-4 flex flex-col gap-4'>
                    <div className='flex justify-center gap-2'>
                      {[0.0005, 0.001, 0.002].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setTipAmount(amount)}
                          className={`rounded-full  p-2 
                       ${
                         tipAmount === amount
                           ? 'border-2 border-main-accent font-bold text-main-accent'
                           : 'border border-gray-500 text-gray-500'
                       }`}
                        >
                          {amount}
                        </button>
                      ))}
                    </div>
                    {!tipTxResultLoading ? (
                      <Button
                        className='accent-tab mt-2 flex items-center justify-center bg-main-accent font-bold text-white enabled:hover:bg-main-accent/90 enabled:active:bg-main-accent/75'
                        onClick={() => {
                          sendTipTx();
                        }}
                        disabled={tipTxResultLoading || tipAmount === 0}
                      >
                        Send{' '}
                        {tipAmount.toLocaleString(undefined, {
                          maximumFractionDigits: 6
                        })}{' '}
                        ETH
                      </Button>
                    ) : (
                      <Loading></Loading>
                    )}
                    <div className='w-full text-center text-gray-500'>
                      to @{user.username}{' '}
                      <span title={user.address}>
                        ({truncateAddress(user.address)})
                      </span>
                    </div>
                  </div>
                )
              ) : (
                <div>User doesn't have an address connected</div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
