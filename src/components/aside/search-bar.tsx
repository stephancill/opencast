import { Button } from '@components/ui/button';
import { HeroIcon } from '@components/ui/hero-icon';
import cn from 'clsx';
import { debounce } from 'lodash';
import { useRouter } from 'next/router';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { useCallback, useRef, useState } from 'react';
import useSWR from 'swr';
import { fetchJSON } from '../../lib/fetch';
import { BaseResponse } from '../../lib/types/responses';
import { Loading } from '../ui/loading';

export type SearchBarProps<T> = {
  urlBuilder: (query: string) => string | null;
  resultBuilder: (data: T, callback: () => void) => JSX.Element;
};

export function SearchBar<T>({
  urlBuilder,
  resultBuilder
}: SearchBarProps<T>): JSX.Element {
  const [inputValue, setInputValue] = useState('');
  const [queryValue, setQueryValue] = useState('');
  const [resultsVisible, setResultsVisible] = useState(false);

  const blurTimeout = useRef<NodeJS.Timeout>();

  const handleFocusEvent = () => {
    clearTimeout(blurTimeout.current);
    setResultsVisible(true);
  };

  const handleBlurEvent = () => {
    blurTimeout.current = setTimeout(() => {
      setResultsVisible(false);
    }, 200);
  };

  const handleClickOnResult = () => {
    clearTimeout(blurTimeout.current);
    // your code for when a user clicks a search result
    setResultsVisible(false);
    setInputValue('');
    setQueryValue('');
  };

  const { push } = useRouter();

  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value);
  };

  const handleChangeDebounced = useCallback(
    debounce((e) => {
      setQueryValue(e.target.value);
    }, 1000),
    []
  );

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    // if (inputValue) void push(`/search?q=${inputValue}`);
  };

  const clearInputValue = (focus?: boolean) => (): void => {
    if (focus) inputRef.current?.focus();
    else inputRef.current?.blur();

    setInputValue('');
  };

  const handleEscape = ({ key }: KeyboardEvent<HTMLInputElement>): void => {
    if (key === 'Escape') clearInputValue()();
  };

  const { data, isValidating } = useSWR(
    () => urlBuilder(queryValue),
    async (url) => (await fetchJSON<BaseResponse<T[]>>(url)).result,
    { revalidateOnFocus: false }
  );

  return (
    <div className='hover-animation sticky top-0 z-10 flex-col bg-main-background py-2'>
      <form className='' onSubmit={handleSubmit}>
        <label
          className='group flex items-center justify-between gap-4 rounded-full
                   bg-main-search-background px-4 py-2 transition focus-within:bg-main-background
                   focus-within:ring-2 focus-within:ring-main-accent'
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
            placeholder='Search Farcaster'
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              handleChange(e);
              handleChangeDebounced(e);
            }}
            onKeyUp={handleEscape}
            onBlur={handleBlurEvent}
            onFocus={handleFocusEvent}
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
      </form>

      {resultsVisible && (data || isValidating) && (
        <div className='menu-container hover-animation absolute mt-1 w-full overflow-hidden rounded-2xl bg-main-background'>
          {isValidating ? (
            <div>{<Loading className='p-4' />}</div>
          ) : data && data.length > 0 ? (
            data?.map((result) =>
              resultBuilder(result, () => {
                handleClickOnResult();
              })
            )
          ) : (
            <div className='p-4'>No results</div>
          )}
        </div>
      )}
    </div>
  );
}
