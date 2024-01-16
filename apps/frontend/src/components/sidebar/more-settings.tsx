import { DisplayModal } from '@components/modal/display-modal';
import { Modal } from '@components/modal/modal';
import { Button } from '@components/ui/button';
import { HeroIcon } from '@components/ui/hero-icon';
import { Menu } from '@headlessui/react';
import { useModal } from '@lib/hooks/useModal';
import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit';
import cn from 'clsx';
import type { Variants } from 'framer-motion';
import { AnimatePresence, motion } from 'framer-motion';
import { useAccount } from 'wagmi';

export const variants: Variants = {
  initial: { opacity: 0, y: 50 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', duration: 0.4 }
  },
  exit: { opacity: 0, y: 50, transition: { duration: 0.2 } }
};

export function MoreSettings(): JSX.Element {
  const { open, openModal, closeModal } = useModal();
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();

  return (
    <>
      <Modal
        modalClassName='max-w-xl bg-main-background w-full p-8 rounded-2xl hover-animation'
        open={open}
        closeModal={closeModal}
      >
        <DisplayModal closeModal={closeModal} />
      </Modal>
      <Menu className='relative' as='div'>
        {({ open }): JSX.Element => (
          <>
            <Menu.Button className='group relative flex w-full py-1 outline-none'>
              <div
                className={cn(
                  `custom-button flex gap-4 text-xl transition group-hover:bg-light-primary/10 group-focus-visible:ring-2
                   group-focus-visible:ring-[#878a8c] dark:group-hover:bg-dark-primary/10 dark:group-focus-visible:ring-white
                   xl:pr-5`,
                  open && 'bg-light-primary/10 dark:bg-dark-primary/10'
                )}
              >
                <HeroIcon
                  className='h-7 w-7'
                  iconName='EllipsisHorizontalCircleIcon'
                />{' '}
                <p className='hidden xl:block'>More</p>
              </div>
            </Menu.Button>
            <AnimatePresence>
              {open && (
                <Menu.Items
                  className='menu-container absolute w-60 font-medium xl:w-11/12'
                  as={motion.div}
                  {...variants}
                  static
                >
                  <Menu.Item>
                    {({ active }): JSX.Element => (
                      <Button
                        className={cn(
                          'flex w-full gap-3 rounded-none rounded-b-md p-4 duration-200',
                          active && 'bg-main-sidebar-background'
                        )}
                        onClick={openModal}
                      >
                        <HeroIcon iconName='PaintBrushIcon' />
                        Display
                      </Button>
                    )}
                  </Menu.Item>
                  {address ? (
                    <div className='align-center flex w-full items-center gap-3 rounded-none rounded-b-md p-4 '>
                      <HeroIcon
                        className='hidden h-6 w-6 xl:block'
                        iconName='WalletIcon'
                      />
                      <ConnectButton
                        showBalance={false}
                        accountStatus={'address'}
                        chainStatus={'none'}
                      ></ConnectButton>
                    </div>
                  ) : (
                    <Menu.Item>
                      {({ active }): JSX.Element => (
                        <Button
                          className={cn(
                            'flex w-full gap-3 rounded-none rounded-b-md p-4 duration-200',
                            active && 'bg-main-sidebar-background'
                          )}
                          onClick={openConnectModal}
                        >
                          <HeroIcon iconName='WalletIcon' />
                          Connect Wallet
                        </Button>
                      )}
                    </Menu.Item>
                  )}
                </Menu.Items>
              )}
            </AnimatePresence>
          </>
        )}
      </Menu>
    </>
  );
}
