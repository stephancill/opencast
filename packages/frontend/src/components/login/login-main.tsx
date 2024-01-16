import { Button } from '@components/ui/button';
import { CustomIcon } from '@components/ui/custom-icon';
import { NextImage } from '@components/ui/next-image';
import { useModal } from '../../lib/hooks/useModal';
import WalletSignInModal from '../modal/sign-in-modal-wallet';
import { WarpcastSignInModal } from '../modal/sign-in-modal-warpcast';
import { HeroIcon } from '../ui/hero-icon';
import Link from 'next/link';

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
          {/* eslint-disable-next-line jsx-a11y/heading-has-content */}
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
            <Link href='/home' passHref>
              <a
                className='custom-button main-tab flex justify-center gap-2 border border-white bg-black font-bold text-white
             transition hover:bg-opacity-90 focus-visible:bg-opacity-90 active:bg-opacity-80
             dark:hover:brightness-125 dark:focus-visible:brightness-125 dark:active:brightness-150'
              >
                Continue without signing in
              </a>
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
