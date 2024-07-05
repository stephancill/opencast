import { Button } from '@components/ui/button';
import { CustomIcon } from '@components/ui/custom-icon';
import { NextImage } from '@components/ui/next-image';
import Link from 'next/link';
import { bytesToHex } from 'viem';
import { useAuth } from '../../lib/context/auth-context';
import { getKeyPair } from '../../lib/crypto';
import { useModal } from '../../lib/hooks/useModal';
import { addKeyPair } from '../../lib/keys';
import WalletSignInModal from '../modal/sign-in-modal-wallet';
import { WarpcastSignInModal } from '../modal/sign-in-modal-warpcast';
import { HeroIcon } from '../ui/hero-icon';

export function LoginMain(): JSX.Element {
  const {
    openModal: openModalWarpcast,
    closeModal: closeModalWarpcast,
    open: openWarpcast
  } = useModal();

  const {
    openModal: openModalWallet,
    closeModal: closeModalWallet,
    open: openWallet
  } = useModal();

  const { handleUserAuth } = useAuth();

  return (
    <main className='grid lg:grid-cols-[1fr,45vw]'>
      <div className='relative hidden items-center justify-center  lg:flex'>
        <NextImage
          imgClassName='object-cover'
          blurClassName='bg-accent-blue'
          src='/assets/twitter-banner.png'
          alt='Opencast banner'
          layout='fill'
          useSkeleton
        />
        <i className='absolute'>
          <CustomIcon className='h-96 w-96 text-white' iconName='TwitterIcon' />
        </i>
      </div>
      <WarpcastSignInModal
        closeModal={closeModalWarpcast}
        open={openWarpcast}
      ></WarpcastSignInModal>
      <WalletSignInModal
        closeModal={closeModalWallet}
        open={openWallet}
      ></WalletSignInModal>

      <div className='flex flex-col items-center justify-between gap-6 p-8 lg:items-start lg:justify-center'>
        <i className='mb-0 self-center lg:mb-10 lg:self-auto'>
          <CustomIcon
            className='-mt-4 h-6 w-6 text-accent-blue lg:h-12 lg:w-12 dark:lg:text-twitter-icon'
            iconName='TwitterIcon'
          />
        </i>
        <div className='flex max-w-xs flex-col gap-4 font-twitter-chirp-extended lg:max-w-none lg:gap-16'>
          <h1
            className='text-3xl before:content-["See_what’s_happening_in_the_world_right_now."] 
                       lg:text-6xl lg:before:content-["Happening_now"]'
          />
          <h2 className='hidden text-xl lg:block lg:text-3xl'>
            Use Opencast today.
          </h2>
        </div>
        <div className='flex max-w-xs flex-col gap-6 [&_button]:py-2'>
          <div className='grid gap-3 font-bold'>
            <Button
              className='flex justify-center gap-2 border border-light-line-reply font-bold text-light-primary transition
                         hover:bg-[#e6e6e6] focus-visible:bg-[#e6e6e6] active:bg-[#cccccc] dark:border-0 dark:bg-white
                         dark:hover:brightness-90 dark:focus-visible:brightness-90 dark:active:brightness-75'
              onClick={openModalWarpcast}
            >
              <CustomIcon iconName='TriangleIcon' /> Sign in with Warpcast
            </Button>
            <Button
              className='flex justify-center gap-2 border border-light-line-reply font-bold text-light-primary transition
                         hover:bg-[#e6e6e6] focus-visible:bg-[#e6e6e6] active:bg-[#cccccc] dark:border-0 dark:bg-white
                         dark:hover:brightness-90 dark:focus-visible:brightness-90 dark:active:brightness-75'
              onClick={openModalWallet}
            >
              <HeroIcon iconName='GlobeAltIcon' /> Sign in with Ethereum
            </Button>
            <Button
              className='flex justify-center gap-2 border border-light-line-reply font-bold text-light-primary transition
                         hover:bg-[#e6e6e6] focus-visible:bg-[#e6e6e6] active:bg-[#cccccc] dark:border-0 dark:bg-white
                         dark:hover:brightness-90 dark:focus-visible:brightness-90 dark:active:brightness-75'
              onClick={async () => {
                const challenge = new Uint8Array(32);

                const assertion = await navigator.credentials.get({
                  publicKey: {
                    challenge,
                    extensions: {
                      // @ts-ignore -- This is a valid property
                      largeBlob: {
                        read: true
                      }
                    }
                  }
                });

                try {
                  if (
                    // @ts-ignore -- This is a valid property
                    typeof assertion?.getClientExtensionResults().largeBlob
                      .blob !== 'undefined'
                  ) {
                    // Reading a large blob was successful.
                    const blobBits = new Uint8Array(
                      // @ts-ignore -- This is a valid property
                      assertion.getClientExtensionResults().largeBlob.blob
                    );
                    const privateKey = bytesToHex(blobBits);
                    const keyPair = await getKeyPair(privateKey);

                    addKeyPair(keyPair);
                    handleUserAuth(keyPair);
                  } else {
                    // The large blob could not be read (e.g. because the data is corrupted).
                    // The assertion is still valid.
                    console.log('The large blob could not be read.');
                  }
                } catch (error) {
                  console.error(error);
                }
              }}
            >
              <HeroIcon iconName='KeyIcon' /> Sign in with Passkey
            </Button>
            <Link
              href='/home'
              className='custom-button main-tab flex justify-center gap-2 border border-white bg-black font-bold text-white
             transition hover:bg-opacity-90 focus-visible:bg-opacity-90 active:bg-opacity-80
             dark:hover:brightness-125 dark:focus-visible:brightness-125 dark:active:brightness-150'
            >
              Continue without signing in
            </Link>
            <p
              className='inner:custom-underline inner:custom-underline text-center text-xs
                         text-light-secondary inner:text-accent-blue dark:text-dark-secondary'
            >
              By signing up you agree that you are doing so at your own risk.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
