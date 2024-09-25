import { useEffect, useRef } from 'react';

type ComposerFormActionDialogProps = {
  composerActionForm: any;
  onClose: () => void;
  onSave: (arg: { composerState: any }) => void;
};

export function ComposerFormActionDialog({
  composerActionForm,
  onClose,
  onSave
}: ComposerFormActionDialogProps) {
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const result = event.data;

      // on error is not called here because there can be different messages that don't have anything to do with composer form actions
      // instead we are just waiting for the correct message
      if (!result.success) {
        console.warn('Invalid message received', event.data);
        return;
      }

      if (result.data.data.cast.embeds.length > 2) {
        console.warn('Only first 2 embeds are shown in the cast');
      }

      onSaveRef.current({
        composerState: result.data.data.cast
      });
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex-grow'>
        <iframe
          className='h-[620px] w-full opacity-100 transition-opacity duration-300'
          src={composerActionForm.url}
          sandbox='allow-forms allow-scripts allow-same-origin'
        ></iframe>
      </div>
      <span className='ml-auto mt-auto px-2 text-sm text-gray-400'>
        {new URL(composerActionForm.url).hostname}
      </span>
    </div>
  );
}
