import * as ed from '@noble/ed25519';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { useAuth } from '../../lib/context/auth-context';

/* https://warpcast.notion.site/Warpcast-API-Docs-Signer-Requests-Public-e02ef71883374d2ca8d27239a8cc35d5 */

export const useLocalStorage = (key: any, initialValue: any) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
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
      console.log(error);
    }
  };

  return [storedValue, setValue];
};

const WarpcastAuthPopup = () => {
  const [, setKeyPair] = useLocalStorage('keyPair', null);
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

    const res = await fetch(`https://api.warpcast.com/v2/signer-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: `0x${keyPair.publicKey}`,
        name: process.env.NEXT_PUBLIC_FC_CLIENT_NAME || 'Opencast'
      })
    });

    const json = await res.json();
    const { token, deepLinkUrl } = json.result;

    pollForSigner(token);

    setDeepLinkUrl(deepLinkUrl);
  };

  // Poll for the status of the Signer request
  // TODO: Loading indicators
  const pollForSigner = async (token: string) => {
    let tries = 0;
    // TODO: Loading indicators
    while (true || tries < 40) {
      tries += 1;
      await new Promise((r) => setTimeout(r, 2000));

      const res = await fetch(
        `https://api.warpcast.com/v2/signer-request?token=${token}`
      );
      const json = await res.json();

      const signerRequest = json.result.signerRequest;

      if (signerRequest.base64SignedMessage) {
        break;
      }
    }

    // TODO: Poll server to check if signer has been indexed
    setTimeout(() => {
      handleUserAuth();
    }, 5000);
  };

  useEffect(() => {
    console.log(process.env.NEXT_PUBLIC_FC_CLIENT_NAME);
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
          <div>
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
