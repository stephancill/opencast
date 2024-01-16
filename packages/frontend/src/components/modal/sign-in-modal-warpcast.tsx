import { Dialog } from '@headlessui/react';
import WarpcastAuthPopup from '../login/sign-in-with-warpcast';
import { Modal } from './modal';

export function WarpcastSignInModal({
  open,
  closeModal
}: {
  open: boolean;
  closeModal: () => void;
}) {
  return (
    <Modal
      className='flex items-start justify-center'
      modalClassName='bg-main-background rounded-2xl max-w-xl p-4 overflow-hidden flex justify-center'
      open={open}
      closeModal={closeModal}
    >
      <div>
        <div className='flex flex-col gap-2'>
          <div className='flex'>
            <Dialog.Title className='flex-grow text-xl font-bold'>
              Sign in with Warpcast
            </Dialog.Title>
            <button onClick={closeModal}>x</button>
          </div>

          <Dialog.Description className='text-light-secondary dark:text-dark-secondary'>
            Scan the QR code with the camera app on your device with Warpcast
            installed.
          </Dialog.Description>
        </div>
        <div className='flex justify-center p-8'>
          <WarpcastAuthPopup closeModal={closeModal}></WarpcastAuthPopup>
        </div>
      </div>
    </Modal>
  );
}
