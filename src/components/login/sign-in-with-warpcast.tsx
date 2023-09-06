import * as ed from '@noble/ed25519';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { useAuth } from '../../lib/context/auth-context';
import { fetchJSON } from '../../lib/fetch';
import { addKeyPair } from '../../lib/storage';
import { KeyPair } from '../../lib/types/keypair';
import { BaseResponse } from '../../lib/types/responses';

/* https://warpcast.notion.site/Signer-Request-API-Migration-Guide-Public-9e74827f9070442fb6f2a7ffe7226b3c */

export const useLocalStorage = (key: any, initialValue: any) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: any) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

const WarpcastAuthPopup = ({ closeModal }: { closeModal?: () => void }) => {
  const [, setKeyPair] = useLocalStorage('pendingKeyPair', null);
  const [deepLinkUrl, setDeepLinkUrl] = useState<string | null>(null);
  const [initiated, setInitiated] = useState<boolean>(false);
  const { handleUserAuth } = useAuth();

  // Generate a new Signer (Ed25519 key pair)
  const generateKeyPair = async () => {
    const privateKey = ed.utils.randomPrivateKey();
    const publicKey = await ed.getPublicKeyAsync(privateKey);

    return {
      publicKey: Buffer.from(publicKey).toString('hex'),
      privateKey: Buffer.from(privateKey).toString('hex')
    };
  };

  // Initiate the Signer request
  const initiateSignerRequest = async () => {
    const keyPair = await generateKeyPair();

    setKeyPair(keyPair);

    // Get app signature
    const { result: appSignatureResult } = (await fetchJSON(
      `/api/signer/${keyPair.publicKey}/authorize`
    )) as BaseResponse<{
      requestFid: number;
      signature: string;
      deadline: number;
    }>;

    if (!appSignatureResult) {
      toast.error('Error generating signature');
      return;
    }

    const { requestFid, signature, deadline } = appSignatureResult;

    const { result: signedKeyResult } = (await fetchJSON(
      `https://api.warpcast.com/v2/signed-key-requests`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: `0x${keyPair.publicKey}`,
          signature,
          requestFid,
          deadline
        })
      }
    )) as {
      result: { signedKeyRequest: { token: string; deeplinkUrl: string } };
    };

    if (!signedKeyResult) {
      toast.error('Error generating signed key');
      return;
    }

    const { token, deeplinkUrl: newDeepLinkUrl } =
      signedKeyResult.signedKeyRequest;

    pollForSigner(token);

    setDeepLinkUrl(newDeepLinkUrl);
  };

  // Poll for the status of the Signer request
  // TODO: Loading indicators
  const pollForSigner = async (token: string) => {
    let tries = 0;
    // TODO: Loading indicators
    while (true || tries < 40) {
      tries += 1;
      await new Promise((r) => setTimeout(r, 2000));

      const { result } = (await fetchJSON(
        `https://api.warpcast.com/v2/signed-key-request?token=${token}`
      )) as { result: { signedKeyRequest: { state: string } } };

      if (result.signedKeyRequest.state === 'completed') {
        break;
      }
    }

    // Move pending keypair to keypair
    const pendingKeyPairRaw = localStorage.getItem('pendingKeyPair') as string;
    const pendingKeyPair = JSON.parse(pendingKeyPairRaw) as KeyPair;
    localStorage.removeItem('pendingKeyPair');
    addKeyPair(pendingKeyPair);

    // TODO: Poll server to check if signer has been indexed
    setTimeout(() => {
      closeModal?.();
      handleUserAuth(pendingKeyPair);
    }, 2000);
  };

  useEffect(() => {
    setInitiated(true);
  }, []);

  // Debounced
  useEffect(() => {
    if (initiated) {
      initiateSignerRequest();
    }
  }, [initiated]);

  return (
    <div>
      {deepLinkUrl && (
        <div>
          <div className={'rounded bg-white p-2'}>
            <QRCode value={deepLinkUrl} />{' '}
          </div>
          <span className='pt-4 text-gray-500'>
            On mobile?{' '}
            <a className='underline' href={deepLinkUrl} target={'_blank'}>
              Open in Warpcast
            </a>
          </span>
        </div>
      )}
    </div>
  );
};

export default WarpcastAuthPopup;
