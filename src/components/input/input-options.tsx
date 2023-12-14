import { Button } from '@components/ui/button';
import type { IconName } from '@components/ui/hero-icon';
import { HeroIcon } from '@components/ui/hero-icon';
import { ToolTip } from '@components/ui/tooltip';
import { motion } from 'framer-motion';
import type { ChangeEvent, ClipboardEvent } from 'react';
import { useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { variants } from './input';
import { ProgressBar } from './progress-bar';

type Options = {
  name: string;
  iconName: IconName;
  disabled: boolean;
  onClick?: () => void;
  popoverContent?: (
    open: boolean,
    setOpen: (val: boolean) => void
  ) => JSX.Element;
}[];

type InputOptionsProps = {
  reply?: boolean;
  modal?: boolean;
  inputLimit: number;
  inputLength: number;
  isValidTweet: boolean;
  isCharLimitExceeded: boolean;
  handleImageUpload: (
    e: ChangeEvent<HTMLInputElement> | ClipboardEvent<HTMLTextAreaElement>
  ) => void;
  options: Readonly<Options>;
};

export function InputOptions({
  reply,
  modal,
  inputLimit,
  inputLength,
  isValidTweet,
  isCharLimitExceeded,
  handleImageUpload,
  options
}: InputOptionsProps): JSX.Element {
  const [open, setOpen] = useState<boolean[]>(
    new Array(options.length).fill(false)
  );

  const inputFileRef = useRef<HTMLInputElement>(null);

  const imgOnClick = (): void => inputFileRef.current?.click();

  let filteredOptions = options;

  return (
    <motion.div className='flex justify-between' {...variants}>
      <div
        className='flex text-main-accent [&>button:nth-child(n+4)]:hidden 
                   xs:[&>button:nth-child(n+6)]:hidden md:[&>button]:!block'
      >
        <input
          className='hidden'
          type='file'
          accept='image/*'
          onChange={handleImageUpload}
          ref={inputFileRef}
          multiple
        />
        {filteredOptions.map(
          ({ name, iconName, disabled, onClick, popoverContent }, index) => (
            <Popover
              open={open[index]}
              onOpenChange={(value) =>
                setOpen((prev) => {
                  const newOpen = [...prev];
                  newOpen[index] = value;
                  return newOpen;
                })
              }
            >
              <PopoverTrigger asChild>
                <Button
                  className='accent-tab accent-bg-tab group relative rounded-full p-2 
                       hover:bg-main-accent/10 active:bg-main-accent/20'
                  aria-expanded={open[index]}
                  type='button'
                  disabled={disabled}
                  key={name}
                >
                  <HeroIcon className='h-5 w-5' iconName={iconName} />
                  <ToolTip tip={name} modal={modal} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-[400px] p-0' align='start'>
                <div className='mb-2 text-lg font-bold'>{name}</div>
                {popoverContent?.(open[index], (val) =>
                  setOpen((prev) => {
                    const newOpen = [...prev];
                    newOpen[index] = val;
                    return newOpen;
                  })
                )}
              </PopoverContent>
            </Popover>
          )
        )}
      </div>
      <div className='flex items-center gap-4'>
        <motion.div
          className='flex items-center gap-4'
          animate={
            inputLength ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }
          }
        >
          <ProgressBar
            modal={modal}
            inputLimit={inputLimit}
            inputLength={inputLength}
            isCharLimitExceeded={isCharLimitExceeded}
          />
          {!reply && (
            <>
              <i className='hidden h-8 w-[1px] bg-[#B9CAD3] dark:bg-[#3E4144] xs:block' />
              <Button
                className='group relative hidden rounded-full border border-light-line-reply p-[1px]
                           text-main-accent dark:border-light-secondary xs:block'
                disabled
              >
                <HeroIcon className='h-5 w-5' iconName='PlusIcon' />
                <ToolTip tip='Add' modal={modal} />
              </Button>
            </>
          )}
        </motion.div>
        <Button
          type='submit'
          className='accent-tab bg-main-accent px-4 py-1.5 font-bold text-white
                     enabled:hover:bg-main-accent/90
                     enabled:active:bg-main-accent/75'
          disabled={!isValidTweet}
        >
          {reply ? 'Reply' : 'Cast'}
        </Button>
      </div>
    </motion.div>
  );
}
