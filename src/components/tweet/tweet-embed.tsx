import { ExternalEmbed } from '../../lib/types/tweet';
import { preventBubbling } from '../../lib/utils';
import { NextImage } from '../ui/next-image';

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
    p-2  text-left text-sm text-gray-400 dark:border-dark-border'
      onClick={preventBubbling(() => window.open(url, '_blank'))}
    >
      <a href={url} target={'_blank'}>
        <div
          className='flex items-center transition hover:brightness-125
    hover:duration-200'
        >
          <div>
            <div className='flex items-center'>
              {icon && (
                <span className='mx-1 overflow-hidden rounded-md'>
                  <NextImage
                    src={icon}
                    alt={provider || 'Unknown'}
                    width={16}
                    height={16}
                  ></NextImage>
                </span>
              )}
              {title && <span className='mx-1 line-clamp-2'>{title}</span>}
            </div>
            {text && <span className='mx-1 line-clamp-4'>{text}</span>}
          </div>
          {image && (
            <div className='mx-1 ml-auto pt-2'>
              <NextImage
                src={image}
                alt={title || 'Unknown'}
                width={64}
                height={64}
              ></NextImage>
            </div>
          )}
        </div>
      </a>
    </button>
  );
}
