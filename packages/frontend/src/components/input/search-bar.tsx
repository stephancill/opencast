import cn from 'clsx';
import {
  DetailedHTMLProps,
  InputHTMLAttributes,
  KeyboardEvent,
  useRef
} from 'react';
import { Button } from '../ui/button';
import { HeroIcon } from '../ui/hero-icon';

export function SearchBar({
  setInputValue,
  inputValue,
  className,
  ...inputProps
}: DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & {
  setInputValue: (value: string) => void;
  inputValue: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const clearInputValue = (focus?: boolean) => (): void => {
    if (focus) inputRef.current?.focus();
    else inputRef.current?.blur();

    setInputValue('');
  };

  const handleEscape = ({ key }: KeyboardEvent<HTMLInputElement>): void => {
    if (key === 'Escape') clearInputValue()();
  };

  return (
    <label
      className={cn(
        'group flex items-center justify-between gap-4 rounded-full bg-main-search-background px-4 py-2 transition focus-within:bg-main-background focus-within:ring-2 focus-within:ring-main-accent',
        className
      )}
    >
      <i>
        <HeroIcon
          className='h-5 w-5 text-light-secondary transition-colors 
               group-focus-within:text-main-accent dark:text-dark-secondary'
          iconName='MagnifyingGlassIcon'
        />
      </i>
      <input
        className='peer flex-1 bg-transparent outline-none 
             placeholder:text-light-secondary dark:placeholder:text-dark-secondary'
        type='text'
        placeholder='Search'
        ref={inputRef}
        value={inputValue}
        // onChange={(e) => {
        //   handleChange(e);
        //   handleChangeDebounced(e);
        // }}
        onKeyUp={handleEscape}
        {...inputProps}
      />
      <Button
        className={cn(
          'accent-tab scale-50 bg-main-accent p-1 opacity-0 transition hover:brightness-90 disabled:opacity-0',
          inputValue &&
            'focus:scale-100 focus:opacity-100 peer-focus:scale-100 peer-focus:opacity-100'
        )}
        onClick={clearInputValue(true)}
        disabled={!inputValue}
      >
        <HeroIcon className='h-3 w-3 stroke-white' iconName='XMarkIcon' />
      </Button>
    </label>
  );
}
