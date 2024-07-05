import type { UserFull } from './types/user';
import { KeyPair } from './types/keypair';
import { hexToBytes } from 'viem';

type UserWithKey = UserFull & { keyPair?: KeyPair };

export async function storeSignerLargeBlob({
  privateKey,
  onSignerStored
}: {
  privateKey: `0x${string}`;
  onSignerStored: (created: boolean) => void;
}) {
  try {
    const challenge = new Uint8Array(32);
    const blob = hexToBytes(privateKey);

    let credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        extensions: {
          // @ts-ignore -- LargeBlob extension is not yet in the WebAuthn types
          largeBlob: {
            write: blob
          }
        }
      }
    });

    if (credential) {
      // @ts-ignore -- LargeBlob extension is not yet in the WebAuthn types
      if (credential.getClientExtensionResults().largeBlob.written) {
        // Success, the large blob was written.
        alert('Signer data saved successfully.');
        onSignerStored(true);
        return;
      } else {
        // The large blob could not be written (e.g. because of a lack of space).
        // The assertion is still valid.
        alert('Could not save largeBlob.');
      }
    } else {
      // The user did not complete the challenge.
      alert('User did not complete the challenge.');
    }
  } catch (error) {
    console.error('Error creating passkey:', error);
    alert('Failed to get passkey and store signer data.');
  }

  onSignerStored(true);
}

export async function createNewPasskey({
  user,
  onPasskeyCreated
}: {
  user: UserWithKey;
  onPasskeyCreated: (created: boolean) => void;
}) {
  {
    const rp = {
      name: process.env.NEXT_PUBLIC_FC_CLIENT_NAME || 'opencast',
      id: location.hostname
    };

    try {
      const challenge = new Uint8Array(32);
      await navigator.credentials.create({
        publicKey: {
          challenge,
          rp,
          user: {
            displayName: user.name,
            name: user.username,
            id: Buffer.from(user.id)
          },
          authenticatorSelection: {
            residentKey: 'required'
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' }
          ],
          extensions: {
            // @ts-ignore -- LargeBlob extension is not yet in the WebAuthn types
            largeBlob: { support: 'required' }
          }
        }
      });
      alert('Credential created, please load the passkey to save your signer.');
      onPasskeyCreated(true);
    } catch (error) {
      console.error('Error creating passkey:', error);
      alert('Failed to create passkey and store signer data.');
    }
  }
}
