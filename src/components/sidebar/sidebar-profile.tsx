import { ActionModal } from '@components/modal/action-modal';
import { Modal } from '@components/modal/modal';
import { Button } from '@components/ui/button';
import { CustomIcon } from '@components/ui/custom-icon';
import { HeroIcon } from '@components/ui/hero-icon';
import { UserAvatar } from '@components/user/user-avatar';
import { UserName } from '@components/user/user-name';
import { UserUsername } from '@components/user/user-username';
import { Menu } from '@headlessui/react';
import { useAuth } from '@lib/context/auth-context';
import { useModal } from '@lib/hooks/useModal';
import type { User } from '@lib/types/user';
import cn from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { variants } from './more-settings';

export function SidebarProfile(): JSX.Element {
  const {
    user,
    usersWithKeys: users,
    signOut,
    setUser,
    showAddAccountModal
  } = useAuth();
  const { open: isLogoutModalOpen, openModal: openLogoutModal, closeModal: closeLogoutModal } = useModal();
  const { open: isSavePasskeyModalOpen, openModal: openSavePasskeyModal, closeModal: closeSavePasskeyModal } = useModal();

  const { name, username, verified, photoURL } = user as User;

  return (
    <>
      <Modal
        modalClassName='max-w-xs bg-main-background w-full p-8 rounded-2xl'
        open={isLogoutModalOpen}
        closeModal={closeLogoutModal}
      >
        <ActionModal
          useIcon
          focusOnMainBtn
          title='Log out of Opencast?'
          description='You can always log back in at any time. If you just want to switch accounts, you can do that by adding an existing account.'
          mainBtnLabel='Log out'
          action={() => {
            signOut();
            closeLogoutModal();
          }}
          closeModal={closeLogoutModal}
        />
      </Modal>
      <Modal
        modalClassName='max-w-xs bg-main-background w-full p-8 rounded-2xl'
        open={isSavePasskeyModalOpen}
        closeModal={closeSavePasskeyModal}
      >
        <ActionModal
          useIcon
          focusOnMainBtn
          title='Save your Signer Key?'
          description='This will save your Farcaster signer to a passkey which can be used to import your signer on other devices.'
          mainBtnLabel='Save Passkey'
          action={async () => {
            if (!user?.keyPair) return;

            // const rp = { name: process.env.NEXT_PUBLIC_FC_CLIENT_NAME || "opencast", id: window.location.hostname }
            const rp = { name: process.env.NEXT_PUBLIC_FC_CLIENT_NAME || "opencast", id: "localhost" }

            console.log({ rp })

            try {
              const publicKey = await navigator.credentials.create({
                publicKey: {
                  challenge: new Uint8Array(32),
                  rp,
                  user: {
                    displayName: name,
                    name: username,
                    id: Buffer.from(user.id)
                  },
                  authenticatorSelection: {
                    residentKey: 'required',
                  },
                  pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
                  extensions: {
                    // @ts-ignore -- LargeBlob extension is not yet in the WebAuthn types
                    largeBlob: { support: 'required' },
                  }
                },
              });

              if (publicKey && 'response' in publicKey) {

                const credential = publicKey as PublicKeyCredential;
                const response = credential.response as AuthenticatorAttestationResponse;

                console.log({ credential })

                // @ts-ignore -- LargeBlob extension is not yet in the WebAuthn types
                if (credential.getClientExtensionResults().largeBlob.supported) {
                  // Large blob is supported for this credential.
                  const blob = Buffer.from(JSON.stringify(user.keyPair));
                  const assertion = await navigator.credentials.get({
                    publicKey: {
                      challenge: new Uint8Array(32),
                      allowCredentials: [{
                        type: "public-key",
                        id: Buffer.from(credential.id),
                      }],
                      extensions: {
                        // @ts-ignore -- LargeBlob extension is not yet in the WebAuthn types
                        largeBlob: {
                          write: blob,
                        },
                      },
                    }
                  });

                  // @ts-ignore -- LargeBlob extension is not yet in the WebAuthn types
                  if (assertion.getClientExtensionResults().largeBlob.written) {
                    // Success, the large blob was written.
                    alert('Signer data saved successfully.');
                    closeSavePasskeyModal();
                  } else {
                    // The large blob could not be written (e.g. because of a lack of space).
                    // The assertion is still valid.
                    alert('Could not save largeBlob.');
                  }
                } else {
                  // Large blob is not supported (this happens if support="preferred" -- the credential was still created).
                  alert('LargeBlob extension not supported.');
                }


              }
            } catch (error) {
              console.error('Error creating passkey:', error);
              alert('Failed to create passkey and store signer data.');
            }

            // closeSavePasskeyModal();
          }}
          closeModal={closeSavePasskeyModal}
        />
      </Modal>
      <Menu className='relative' as='section'>
        {({ open }): JSX.Element => (
          <>
            <Menu.Button
              className={cn(
                `custom-button main-tab dark-bg-tab flex w-full items-center 
                 justify-between hover:bg-light-primary/10 active:bg-light-primary/20
                 dark:hover:bg-dark-primary/10 dark:active:bg-dark-primary/20`,
                open && 'bg-light-primary/10 dark:bg-dark-primary/10'
              )}
            >
              <div className='flex gap-3 truncate'>
                <UserAvatar src={photoURL} alt={name} size={40} />
                <div className='hidden truncate text-start leading-5 xl:block'>
                  <UserName name={name} className='start' verified={verified} />
                  <UserUsername username={username} disableLink />
                </div>
              </div>
              <HeroIcon
                className='hidden h-6 w-6 xl:block'
                iconName='EllipsisHorizontalIcon'
              />
            </Menu.Button>
            <AnimatePresence>
              {open && (
                <Menu.Items
                  className='menu-container absolute bottom-20 left-0 right-0 w-60 xl:w-full'
                  as={motion.div}
                  {...variants}
                  static
                >
                  {/* TODO: Mobile */}
                  {users.map((menuUser) => {
                    const { name, username, verified, photoURL, id } = menuUser;
                    return (
                      <Menu.Item
                        className='flex items-center justify-between gap-4 border-b 
                               border-light-border hover:bg-light-primary/10 dark:border-dark-border'
                        as='div'
                      >
                        {({ active }): JSX.Element => (
                          <Button
                            className={cn(
                              'flex w-full items-center gap-3 rounded-md rounded-t-none',
                              active && 'bg-main-sidebar-background'
                            )}
                            onClick={() => setUser(menuUser)}
                          >
                            <div className='flex flex-grow items-center gap-3 truncate'>
                              <UserAvatar src={photoURL} alt={name} />
                              <div className='truncate'>
                                <UserName name={name} verified={verified} />
                                <UserUsername username={username} disableLink />
                              </div>
                            </div>
                            {user?.id === id && (
                              <i>
                                <HeroIcon
                                  className='h-5 w-5 text-main-accent'
                                  iconName='CheckIcon'
                                />
                              </i>
                            )}
                          </Button>
                        )}
                      </Menu.Item>
                    );
                  })}
                  <Menu.Item>
                    {({ active }): JSX.Element => (
                      <Button
                        className={cn(
                          'flex w-full gap-3 rounded-md rounded-t-none p-4',
                          active && 'bg-main-sidebar-background'
                        )}
                        onClick={showAddAccountModal}
                      >
                        <HeroIcon iconName='UserPlusIcon' />
                        Add another account
                      </Button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }): JSX.Element => (
                      <Button
                        className={cn(
                          'flex w-full gap-3 rounded-md rounded-t-none p-4',
                          active && 'bg-main-sidebar-background'
                        )}
                        onClick={openSavePasskeyModal}
                      >
                        <HeroIcon iconName='KeyIcon' />
                        Save Signer Key
                      </Button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }): JSX.Element => (
                      <Button
                        className={cn(
                          'flex w-full gap-3 rounded-md rounded-t-none p-4',
                          active && ' bg-main-sidebar-background'
                        )}
                        onClick={openLogoutModal}
                      >
                        <HeroIcon iconName='ArrowRightOnRectangleIcon' />
                        <div className='truncate'>Log out @{username}</div>
                      </Button>
                    )}
                  </Menu.Item>
                  <i
                    className='absolute -bottom-[10px] left-2 translate-x-1/2 rotate-180
                               [filter:drop-shadow(#cfd9de_1px_-1px_1px)] 
                               dark:[filter:drop-shadow(#333639_1px_-1px_1px)]
                               xl:left-1/2 xl:-translate-x-1/2'
                  >
                    <CustomIcon
                      className='h-4 w-6 fill-main-background'
                      iconName='TriangleIcon'
                    />
                  </i>
                </Menu.Items>
              )}
            </AnimatePresence>
          </>
        )}
      </Menu>
    </>
  );
}
