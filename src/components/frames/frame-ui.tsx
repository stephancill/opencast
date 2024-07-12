import { FrameUI as BaseFrameUI } from '@frames.js/render/ui';
import Image from 'next/image';
import React from 'react';
import cn from 'clsx';
import { HeroIcon } from '../ui/hero-icon';

type Props = React.ComponentProps<
  typeof BaseFrameUI<{ className?: string; style?: React.CSSProperties }>
>;

const components: Props['components'] = {
  Button(
    { frameButton, isDisabled, onPress, index, frameState },
    stylingProps
  ) {
    return (
      <button
        {...stylingProps}
        key={index}
        className={cn(
          'flex-1 rounded border p-2 text-sm text-light-primary hover:bg-gray-100 hover:text-light-primary dark:border-dark-border dark:text-white dark:hover:bg-gray-100/10 dark:hover:text-dark-primary',
          (frameState.status === 'loading' || frameState.isImageLoading) &&
            'cursor-default bg-gray-100',
          stylingProps.className
        )}
        disabled={isDisabled}
        onClick={onPress}
        type='button'
      >
        {frameButton.action === 'mint' ? `⬗ ` : ''}
        {frameButton.label}
        {frameButton.action === 'tx' ? (
          <HeroIcon
            iconName='BoltIcon'
            className='align-text-middle mb-[2px] ml-1 inline-block h-4 w-4 select-none overflow-visible text-gray-400'
          ></HeroIcon>
        ) : (
          ''
        )}
        {frameButton.action === 'post_redirect' || frameButton.action === 'link'
          ? ` ↗`
          : ''}
      </button>
    );
  },
  MessageTooltip(props, stylingProps) {
    return (
      <div
        {...stylingProps}
        className={cn(
          'absolute inset-x-2 bottom-2 rounded-sm border border-slate-100 shadow-md',
          'flex items-center gap-2 p-2 text-sm',
          props.status === 'error' && 'text-red-500',
          stylingProps.className
        )}
      >
        {props.status === 'error' ? (
          <HeroIcon iconName='ExclamationCircleIcon' className='text-red-500' />
        ) : (
          <HeroIcon
            iconName='InformationCircleIcon'
            className='text-gray-500'
          />
        )}
        {props.message}
      </div>
    );
  },
  LoadingScreen(props, stylingProps) {
    return (
      <div {...stylingProps}>
        <div className='h-full w-full animate-pulse bg-gray-100 dark:bg-light-secondary'></div>
      </div>
    );
  },
  Image(props, stylingProps) {
    if (props.status === 'frame-loading') {
      return <div />;
    }

    return (
      <Image
        {...stylingProps}
        src={props.src}
        onLoad={props.onImageLoadEnd}
        onError={props.onImageLoadEnd}
        alt='Frame image'
        sizes='100vw'
        height={0}
        width={0}
      />
    );
  }
};

const theme: Props['theme'] = {
  ButtonsContainer: {
    className: 'flex gap-[8px] px-2 pb-2'
  },
  Root: {
    className:
      'flex flex-col w-full gap-2 border rounded-lg overflow-hidden relative'
  },
  Error: {
    className:
      'flex text-red-500 text-sm p-2 border border-red-500 rounded-md shadow-md aspect-square justify-center items-center'
  },
  LoadingScreen: {
    className:
      'absolute top-0 left-0 right-0 bottom-0 z-10 bg-white dark:bg-light-primary'
  },
  Image: {
    className: 'w-full object-cover max-h-full'
  },
  ImageContainer: {
    className: 'relative w-full h-full border-b border-gray-300 overflow-hidden'
  },
  TextInput: {
    className: 'p-[6px] border rounded border-gray-300 box-border w-full'
  },
  TextInputContainer: {
    className: 'w-full px-2'
  }
};

export function FrameUI(props: Props) {
  return <BaseFrameUI {...props} components={components} theme={theme} />;
}
