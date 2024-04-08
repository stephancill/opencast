import { UserAvatar } from '@components/user/user-avatar';
import { Message } from '@farcaster/hub-web';
import { useAuth } from '@lib/context/auth-context';
import type { FilesWithId, ImageData, ImagesPreview } from '@lib/types/file';
import type { User } from '@lib/types/user';
import { getHttpsUrls, sleep } from '@lib/utils';
import { getImagesData } from '@lib/validation';
import cn from 'clsx';
import type { Variants } from 'framer-motion';
import { AnimatePresence, motion } from 'framer-motion';
import { debounce } from 'lodash';
import Link from 'next/link';
import type { ChangeEvent, ClipboardEvent, FormEvent, ReactNode } from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import useSWR from 'swr';
import { useAccount } from 'wagmi';
import { createCastMessage, submitHubMessage } from '../../lib/farcaster/utils';
import { fetchJSON } from '../../lib/fetch';
import { uploadToImgur } from '../../lib/imgur/upload';
import { BaseResponse } from '../../lib/types/responses';
import { TopicResponse, TopicType } from '../../lib/types/topic';
import { ExternalEmbed } from '../../lib/types/tweet';
import { SearchTopics } from '../search/search-topics';
import { UserSearchResult } from '../search/user-search-result';
import { TweetEmbed } from '../tweet/tweet-embed';
import { TopicView, TweetTopicSkeleton } from '../tweet/tweet-topic';
import { Loading } from '../ui/loading';
import EditorExample from './editor-example';
import { ImagePreview } from './image-preview';
import { InputForm, fromTop } from './input-form';
import { InputOptions } from './input-options';
// import { FarcasterMention as ModMention } from '@mod-protocol/farcaster';
// import { BaseResponse } from '../../lib/types/responses';
// import { User } from '../../lib/types/user';

type InputProps = {
  modal?: boolean;
  reply?: boolean;
  parent?: { id: string; username: string; userId: string };
  disabled?: boolean;
  children?: ReactNode;
  replyModal?: boolean;
  parentUrl?: string;
  closeModal?: () => void;
};

export const variants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 }
};

// TODO: Generalize this and move it somewhere else
function extractAndReplaceMentions(
  input: string,
  usersMap: { [key: string]: number }
) {
  let result = '';
  let mentions: number[] = [];
  let mentionsPositions: number[] = [];

  // Split on newlines and spaces, preserving delimiters
  let splits = input.split(/(\s|\n)/);

  splits.forEach((split, i) => {
    if (split.startsWith('@')) {
      const username = split.slice(1);

      // Check if user is in the usersMap
      if (username in usersMap) {
        // Get the starting position of each username mention
        const position = Buffer.from(result).length;

        mentions.push(usersMap[username]);
        mentionsPositions.push(position);

        // result += '@[...]'; // replace username mention with what you would like
      } else {
        result += split;
      }
    } else {
      result += split;
    }
  });

  // Return object with replaced text and user mentions array
  return {
    text: result,
    mentions,
    mentionsPositions
  };
}

export function Input({
  modal,
  reply,
  parent,
  disabled,
  children,
  replyModal,
  parentUrl,
  closeModal
}: InputProps): JSX.Element {
  const [selectedImages, setSelectedImages] = useState<FilesWithId>([]);
  const [imagesPreview, setImagesPreview] = useState<ImagesPreview>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [visited, setVisited] = useState(false);
  const { address } = useAccount();

  const [embedUrls, setEmbedUrls] = useState<string[]>([]); // URLs to be fetched
  const [embeds, setEmbeds] = useState<ExternalEmbed[]>([]); // Fetched embeds
  const [ignoredEmbedUrls, setIgnoredEmbedUrls] = useState<string[]>([]); // URLs of embeds to be ignored in the cast message

  const [topicUrl, setTopicUrl] = useState(parentUrl);
  const [showingTopicSelector, setShowingTopicSelector] = useState(false);
  const [topic, setTopic] = useState<TopicType | null>();

  const { data: topicResult, isValidating: loadingTopic } = useSWR(
    topicUrl ? `/api/topic?url=${encodeURIComponent(topicUrl)}` : null,
    async (url) => {
      const res = await fetchJSON<TopicResponse>(url);
      return res.result;
    },
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (topicUrl !== parentUrl) {
      setTopicUrl(parentUrl);
    }
  }, [parentUrl]);

  useEffect(() => {
    if (topicUrl === topic?.url || topic === undefined) return;
    setTopicUrl(topic?.url);
  }, [topic]);

  useEffect(() => {
    if (topicResult && topic?.url !== topicResult.url) {
      setTopic(topicResult);
    }
  }, [topicResult]);

  const { user, isAdmin } = useAuth();
  const { name, username, photoURL } = user as User;

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const previewCount = imagesPreview.length;
  const isUploadingImages = !!previewCount;

  useEffect(
    () => {
      if (modal) inputRef.current?.focus();
      return cleanImage;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const sendTweet = async (): Promise<void> => {
    inputRef.current?.blur();

    setLoading(true);

    if (!inputValue && selectedImages.length === 0) {
      setLoading(false);
      return;
    }

    const isReplying = reply ?? replyModal;

    const userId = user?.id as string;

    if (isReplying && !parent) {
      setLoading(false);
      return;
    }

    const uploadedLinks: string[] = [];

    // Sequentially upload files
    for (let i = 0; i < selectedImages.length; i++) {
      const link = await uploadToImgur(selectedImages[i]);

      if (!link) {
        toast.error(
          () => <span className='flex gap-2'>Failed to upload image</span>,
          { duration: 6000 }
        );
        setLoading(false);
        return;
      }

      uploadedLinks.push(link);
    }

    const rawText = inputValue.trim();

    // Get fids of mentioned users
    const mentionedUsers = ((input: string) => {
      let splits = input.split(/(\s|\n)/);

      const usernames: string[] = [];

      splits.forEach((split, i) => {
        if (split.startsWith('@')) {
          const username = split.slice(1);
          usernames.push(username);
        }
      });

      return usernames;
    })(rawText);

    const usersMapResponse = await fetchJSON<
      BaseResponse<{ [key: string]: number }>
    >(`/api/user/resolve-usernames?usernames=${mentionedUsers.join(',')}`);
    const usersMap = usersMapResponse.result;

    if (!usersMap) {
      toast.error(
        () => <span className='flex gap-2'>Failed to resolve usernames</span>,
        { duration: 6000 }
      );
      setLoading(false);
      return;
    }

    // Extract mentions for cast message
    const { text, mentions, mentionsPositions } = extractAndReplaceMentions(
      rawText,
      usersMap
    );

    // setLoading(false);
    // return;

    // TODO: Limit to only 2 embeds
    const castMessage = await createCastMessage({
      text: text,
      fid: parseInt(userId),
      embeds: [
        ...uploadedLinks.map((link) => ({ url: link })),
        ...embeds
          .filter((embed) => !ignoredEmbedUrls.includes(embed.url))
          .map(({ url }) => ({ url }))
      ],
      mentions: mentions,
      mentionsPositions: mentionsPositions,
      parentCastHash: isReplying && parent ? parent.id : undefined,
      parentCastFid: isReplying && parent ? parseInt(parent.userId) : undefined,
      parentUrl: !parent ? topicUrl : undefined
    });

    if (castMessage) {
      const res = await submitHubMessage(castMessage);
      const message = Message.fromJSON(res);

      await sleep(500);

      if (!modal && !replyModal) {
        discardTweet();
        setLoading(false);
      }

      if (closeModal) closeModal();

      const tweetId = Buffer.from(message.hash).toString('hex');

      toast.success(
        () => (
          <span className='flex gap-2'>
            Your post was sent
            <Link href={`/tweet/${tweetId}`}>
              <a className='custom-underline font-bold'>View</a>
            </Link>
          </span>
        ),
        { duration: 6000 }
      );
    } else {
      setLoading(false);
      toast.error(
        () => <span className='flex gap-2'>Failed to create post</span>,
        { duration: 6000 }
      );
    }
  };

  const handleImageUpload = (
    e: ChangeEvent<HTMLInputElement> | ClipboardEvent<HTMLTextAreaElement>
  ): void => {
    const isClipboardEvent = 'clipboardData' in e;

    if (isClipboardEvent) {
      const isPastingText = e.clipboardData.getData('text');
      if (isPastingText) return;
    }

    const files = isClipboardEvent ? e.clipboardData.files : e.target.files;

    const imagesData = getImagesData(files, previewCount);

    if (!imagesData) {
      toast.error('Please choose a GIF or photo up to 4');
      return;
    }

    const { imagesPreviewData, selectedImagesData } = imagesData;

    setImagesPreview([...imagesPreview, ...imagesPreviewData]);
    setSelectedImages([...selectedImages, ...selectedImagesData]);

    inputRef.current?.focus();
  };

  const removeImage = (targetId: string) => (): void => {
    setSelectedImages(selectedImages.filter(({ id }) => id !== targetId));
    setImagesPreview(imagesPreview.filter(({ id }) => id !== targetId));

    const { src } = imagesPreview.find(
      ({ id }) => id === targetId
    ) as ImageData;

    URL.revokeObjectURL(src);
  };

  const cleanImage = (): void => {
    imagesPreview.forEach(({ src }) => URL.revokeObjectURL(src));

    setSelectedImages([]);
    setImagesPreview([]);
  };

  const discardTweet = (): void => {
    setInputValue('');
    setVisited(false);
    cleanImage();
    setEmbedUrls([]);
    setEmbeds([]);
    setIgnoredEmbedUrls([]);

    inputRef.current?.blur();
  };

  const handleEmbedsChange = (value: string) => {
    if (value) {
      const urls = getHttpsUrls(value).filter(
        (url) => !ignoredEmbedUrls.includes(url)
      );
      setEmbedUrls(urls.slice(0, 2));
    }
  };

  const handleChangeDebounced = useCallback(
    debounce((e) => {
      handleEmbedsChange(e.target.value);
    }, 1500),
    []
  );

  const [showUsers, setShowUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: usersSearch,
    error,
    isValidating: usersSearchLoading
  } = useSWR(
    searchTerm.length > 0 ? `/api/search?q=${searchTerm}` : null,
    async (url) => (await fetchJSON<BaseResponse<User[]>>(url)).result
  );

  const debouncedSetSearchTerm = useCallback(
    debounce((value) => {
      setSearchTerm(value);
    }, 1000),
    []
  );

  const textLength = useTextLength({ getText, maxByteLength: 320 });

  useEffect(() => {
    if (!inputRef.current) return;
    const cursorPosition = inputRef.current.selectionStart;
    const textBeforeCursor = inputValue.slice(0, cursorPosition);

    // TODO: Handle edge cases like \n
    const lastKeyword = textBeforeCursor.split(' ').pop() || '';

    if (lastKeyword.startsWith('@')) {
      setShowUsers(true);
      debouncedSetSearchTerm(lastKeyword.slice(1));
    } else {
      setShowUsers(false);
    }
  }, [inputValue]);

  const handleUserClick = (user: User) => {
    if (!inputRef.current) return;
    const cursorPosition = inputRef.current.selectionStart;
    const textBeforeCursor = inputValue.slice(0, cursorPosition);
    const textAfterCursor = inputValue.slice(cursorPosition);

    const lastSpaceBeforeCursorIndex = textBeforeCursor.lastIndexOf(' ');

    const newTextBeforeCursor = textBeforeCursor.slice(
      0,
      lastSpaceBeforeCursorIndex + 1
    );
    const newTextAfterCursor = '@' + user.username + ' ' + textAfterCursor;

    setInputValue(newTextBeforeCursor + newTextAfterCursor);

    setShowUsers(false);
  };

  const handleChange = ({
    target: { value }
  }: ChangeEvent<HTMLTextAreaElement>): void => {
    setInputValue(value);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    void sendTweet();
  };

  const handleFocus = (): void => setVisited(!loading);

  const formId = useId();

  const inputLimit = 320;

  const inputLength = Buffer.from(inputValue).length;
  const isValidInput = !!inputValue.trim().length;
  const isCharLimitExceeded = inputLength > inputLimit;

  const isValidTweet =
    !isCharLimitExceeded && (isValidInput || isUploadingImages);

  const { data: newEmbeds, isValidating } = useSWR(
    embedUrls.length > 0 ? `/api/embeds?urls=${embedUrls.join(',')}` : null,
    fetchJSON<(ExternalEmbed | null)[]>
  );

  useEffect(() => {
    setEmbeds((prevEmbeds) => {
      if (newEmbeds) {
        return newEmbeds.filter((embed) => embed !== null) as ExternalEmbed[];
      } else {
        return prevEmbeds;
      }
    });
  }, [newEmbeds]);

  useEffect(() => {
    handleEmbedsChange(inputValue);
  }, [ignoredEmbedUrls]);

  const handleFileUpload = useCallback(async (files: FileList) => {
    // Mod expects a blob, so we convert the file to a blob
    const imageFiles = await Promise.all(
      Array.from(files)
        .filter(({ type }) => {
          return type.startsWith('image/');
        })
        .map(async (file) => {
          const arrayBuffer = await file.arrayBuffer();
          const blob = new Blob([new Uint8Array(arrayBuffer)], {
            type: file.type
          });
          return { blob, ...file };
        })
    );

    if (imageFiles.length === 0) return;

    setContentLoading(true);
    try {
      // Upload to imgur
      await Promise.all(
        imageFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file.blob);
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_MOD_API_URL}/imgur-upload`,
            {
              method: 'POST',
              body: formData
            }
          );

          const { url } = await res.json();
          if (!url) return;

          const currentEmbeds = getEmbeds();
          const newEmbeds: typeof currentEmbeds = [
            ...currentEmbeds,
            {
              url,
              metadata: {
                image: {
                  url: url
                },
                mimeType: 'image/png'
              },
              status: 'loaded'
            }
          ];

          setEmbeds(newEmbeds);
        })
      );
    } catch (e) {
      console.error(e);
    }
    setContentLoading(false);
  }, []);

  return (
    <div>
      <form
        className={cn('flex flex-col', {
          '-mx-4': reply,
          'gap-2': replyModal,
          'cursor-not-allowed': disabled
        })}
        onSubmit={handleSubmit}
      >
        {loading && (
          <motion.i
            className='h-1 animate-pulse bg-main-accent'
            {...variants}
          />
        )}
        {children}
        {reply && visited && (
          <motion.p
            className='-mb-2 ml-[75px] mt-2 text-light-secondary dark:text-dark-secondary'
            {...fromTop}
          >
            Replying to{' '}
            <Link href={`/user/${parent?.username as string}`}>
              <a className='custom-underline text-main-accent'>
                {parent?.username as string}
              </a>
            </Link>
          </motion.p>
        )}
        <label
          className={cn(
            'hover-animation grid w-full grid-cols-[auto,1fr] gap-3 px-4 py-3',
            reply
              ? 'pb-1 pt-3'
              : replyModal
              ? 'pt-0'
              : 'border-b-2 border-light-border dark:border-dark-border',
            (disabled || loading) && 'pointer-events-none opacity-50'
          )}
          htmlFor={formId}
        >
          <UserAvatar src={photoURL} alt={name} username={username} />
          <div className='flex w-full flex-col gap-4'>
            <InputForm
              modal={modal}
              reply={reply}
              formId={formId}
              visited={visited}
              loading={loading}
              inputRef={inputRef}
              replyModal={replyModal}
              inputValue={inputValue}
              isValidTweet={isValidTweet}
              isUploadingImages={isUploadingImages}
              sendTweet={sendTweet}
              handleFocus={handleFocus}
              discardTweet={discardTweet}
              handleChange={(e) => {
                handleChangeDebounced(e);
                handleChange(e);
              }}
              handleImageUpload={handleImageUpload}
            >
              {showUsers &&
                (usersSearchLoading ? (
                  <Loading />
                ) : (
                  usersSearch &&
                  usersSearch.length > 0 && (
                    <ul className='menu-container hover-animation mt-1 overflow-hidden rounded-2xl bg-main-background'>
                      {usersSearch.map((user) => {
                        return (
                          <li
                            key={user.id}
                            className='cursor-pointer p-2'
                            onClick={() => handleUserClick(user)}
                          >
                            <UserSearchResult user={user} />
                          </li>
                        );
                      })}
                    </ul>
                  )
                ))}
              {isUploadingImages && (
                <ImagePreview
                  imagesPreview={imagesPreview}
                  previewCount={previewCount}
                  removeImage={!loading ? removeImage : undefined}
                />
              )}
              {embeds?.map(
                (embed) =>
                  embed &&
                  !ignoredEmbedUrls.includes(embed.url) && (
                    <div key={embed.url} className='flex items-center gap-2'>
                      <button
                        className='text-light-secondary dark:text-dark-secondary'
                        onClick={() => {
                          setIgnoredEmbedUrls([...ignoredEmbedUrls, embed.url]);
                        }}
                      >
                        x
                      </button>
                      <TweetEmbed {...embed} key={embed.url} />
                    </div>
                  )
              )}
            </InputForm>

            {loadingTopic ? (
              <div className='w-10'>
                <TweetTopicSkeleton />
              </div>
            ) : showingTopicSelector && !parent ? (
              <SearchTopics
                enabled={showingTopicSelector}
                onSelectRawUrl={setTopicUrl}
                onSelectTopic={setTopic}
                setShowing={setShowingTopicSelector}
              />
            ) : (
              topic && (
                <div
                  className='cursor-pointer text-light-secondary dark:text-dark-secondary'
                  onClick={() => setShowingTopicSelector(true)}
                >
                  <TopicView topic={topic} />
                </div>
              )
            )}

            <AnimatePresence initial={false}>
              {(reply ? reply && visited && !loading : !loading) && (
                <InputOptions
                  reply={reply}
                  modal={modal}
                  inputLimit={inputLimit}
                  inputLength={inputLength}
                  isValidTweet={isValidTweet}
                  isCharLimitExceeded={isCharLimitExceeded}
                  handleImageUpload={handleImageUpload}
                  options={[
                    {
                      name: 'Media',
                      iconName: 'PhotoIcon',
                      disabled: false
                    },
                    {
                      name: 'Topic',
                      iconName: 'HashtagIcon',
                      disabled: false,
                      onClick() {
                        setShowingTopicSelector(!showingTopicSelector);
                      }
                    }
                  ]}
                />
              )}
            </AnimatePresence>
          </div>
        </label>
      </form>
      <EditorExample
        isReply={reply}
        replyModal={replyModal}
        loading={loading}
        disabled={disabled}
        parentAuthor={parent}
        parentUrl={parentUrl}
      ></EditorExample>
    </div>
  );
}
