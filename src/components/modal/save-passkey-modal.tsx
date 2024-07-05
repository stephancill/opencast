import { useState } from 'react';
import { ActionModal } from './action-modal';
import { createNewPasskey, storeSignerLargeBlob } from '../../lib/passkeys';
import { User } from '../../lib/types/user';
import { UserWithKey } from '../../lib/context/auth-context';

export function SavePasskeyModal({
  user,
  closeSavePasskeyModal
}: {
  user: UserWithKey | null;
  closeSavePasskeyModal: () => void;
}) {
  const [passkeyCreated, setPasskeyCreated] = useState(false);

  return (
    <ActionModal
      useIcon
      focusOnMainBtn
      title='Save your Signer Key?'
      description='This will save your Farcaster signer to a passkey which can be used to import your signer on other devices.'
      mainBtnLabel='Load Passkey'
      secondaryBtnLabel='Create New Passkey'
      secondaryAction={
        !passkeyCreated
          ? async () => {
              if (!user?.keyPair) return;

              createNewPasskey({
                user,
                onPasskeyCreated: setPasskeyCreated
              });
            }
          : undefined
      }
      action={async () => {
        if (!user?.keyPair) return;

        storeSignerLargeBlob({
          privateKey: user.keyPair.privateKey,
          onSignerStored: (created) => {
            if (created) {
              closeSavePasskeyModal();
            }
          }
        });
      }}
      closeModal={closeSavePasskeyModal}
    />
  );
}
