import { ExternalEmbed } from '../../lib/types/tweet';
import { preventBubbling } from '../../lib/utils';
import { NextImage } from '../ui/next-image';

const hoverModifier =
  'hover:brightness-75 dark:hover:brightness-125 hover:duration-200 transition';

export function TweetEmbed({
  title,
  text,
  image,
  provider,
  url,
  icon
}: ExternalEmbed): JSX.Element {
  return (
    <button
      className='w-full rounded-md border border-black border-light-border 
    p-2  text-left text-sm dark:border-dark-border'
      onClick={preventBubbling(() => window.open(url, '_blank'))}
    >
      <a href={url} target={'_blank'}>
        <div className='flex items-center'>
          <div className='flex-shrink'>
            <div className='flex items-center'>
              {icon && (
                <span className='mx-1'>
                  <img
                    src={icon}
                    alt={provider || ''}
                    width={16}
                    height={16}
                  ></img>
                </span>
              )}
              {title && (
                <span className={`mx-1 line-clamp-2 ${hoverModifier}`}>
                  {title}
                </span>
              )}
            </div>
            {text && (
              <span
                className={`mx-1 line-clamp-4 text-gray-400 ${hoverModifier}`}
              >
                {text}
              </span>
            )}
          </div>
          {image && (
            <div className='ml-2 mr-1 block hidden h-28 w-28 flex-shrink-0 flex-grow-0 overflow-hidden rounded-md sm:block'>
              <img
                src={image}
                title={title || 'Unknown'}
                className='h-full w-full object-cover'
              />
            </div>
          )}
        </div>
      </a>
    </button>
  );
}
