import { forwardRef } from 'react';
import cn from 'clsx';
import { Loading } from './loading';
import type { ComponentPropsWithRef } from 'react';

type ButtonProps = ComponentPropsWithRef<'button'> & {
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, loading, disabled, children, ...rest }, ref) => {
    const isDisabled = loading || disabled;

    return (
      <button
        className={cn(
          'custom-button main-tab',
          loading && 'relative !text-transparent disabled:cursor-wait',
          className
        )}
        type='button'
        disabled={isDisabled}
        ref={ref}
        {...rest}
      >
        {loading && (
          <Loading
            iconClassName='h-5 w-5'
            className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
          />
        )}
        {children}
      </button>
    );
  }
);
