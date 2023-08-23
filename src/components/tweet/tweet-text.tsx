import Link from 'next/link';
import { useMemo } from 'react';
import { ImagesPreview } from '../../lib/types/file';
import { Mention } from '../../lib/types/tweet';
import { replaceOccurrencesMultiple } from '../../lib/utils';
import { UserTooltip } from '../user/user-tooltip';
import isURL from 'validator/lib/isURL';

export interface TweetTextProps {
  text: string;
  images: ImagesPreview | null;
  mentions: Mention[];
}

function splitAndInsert(
  input: string,
  indices: number[],
  insertions: JSX.Element[],
  elementBuilder: (s: string) => JSX.Element
) {
  let result = [];
  let lastIndex = 0;

  indices.forEach((index, i) => {
    result.push(
      elementBuilder(Buffer.from(input).slice(lastIndex, index).toString())
    );
    result.push(insertions[i]);
    lastIndex = index;
  });

  result.push(elementBuilder(Buffer.from(input).slice(lastIndex).toString())); // get remaining part of string

  return result;
}

const urlRegex = /(https?:\/\/[^\s]+)/g;

export function TweetText({
  text,
  images,
  mentions
}: TweetTextProps): JSX.Element {
  const indices = useMemo(
    () => mentions.map((mention) => mention.position),
    [mentions]
  );

  const segments = useMemo(() => {
    const segments = splitAndInsert(
      text,
      indices,
      mentions.map((mention, index) => {
        const link = (
          <Link href={`/user/${mention.username}`} key={index}>
            <span className='inline text-main-accent hover:cursor-pointer hover:underline'>{`@${mention.username}`}</span>
          </Link>
        );
        return mention.user ? (
          <span className='inline-block'>
            <UserTooltip {...mention.user}>{link}</UserTooltip>
          </span>
        ) : (
          link
        );
      }),
      (s) => {
        return (
          <span className='inline' key={s}>
            {s.split(/(\s|\n)/).map((part, index) => {
              if (isURL(part, { require_protocol: false })) {
                return (
                  <Link
                    href={
                      !(
                        part.toLowerCase().startsWith('https://') ||
                        part.toLowerCase().startsWith('http://')
                      )
                        ? `https://${part}`
                        : part
                    }
                    key={part}
                    passHref
                  >
                    <a
                      target={'_blank'}
                      key={part}
                      className='inline text-main-accent hover:cursor-pointer hover:underline'
                    >
                      {part}
                    </a>
                  </Link>
                );
              } else {
                return replaceOccurrencesMultiple(
                  part,
                  images?.map((img) => img.src ?? '') ?? [],
                  ''
                );
              }
            })}
          </span>
        );
      }
    );
    return segments;
  }, [text, indices, mentions, images]);

  return <div className='whitespace-pre-line break-words'>{segments}</div>;
}
