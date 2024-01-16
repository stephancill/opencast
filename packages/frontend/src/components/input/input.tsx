import { UserAvatar } from '@components/user/user-avatar';
import { Message } from '@farcaster/hub-web';
import { useAuth } from '@lib/context/auth-context';
import {
  Embed,
  ModManifest,
  fetchUrlMetadata,
  handleAddEmbed,
  handleOpenFile,
  handleSetInput
} from '@mod-protocol/core';
import {
  Channel,
  formatPlaintextToHubCastMessage,
  getFarcasterMentions,
  getMentionFidsByUsernames
} from '@mod-protocol/farcaster';
import { creationMods, defaultRichEmbedMod } from '@mod-protocol/mod-registry';
import { CreationMod, RichEmbed } from '@mod-protocol/react';
import {
  EditorContent,
  useEditor,
  useTextLength
} from '@mod-protocol/react-editor';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@mod-protocol/react-ui-shadcn/dist/components/ui/popover';
import { EmbedsEditor } from '@mod-protocol/react-ui-shadcn/dist/lib/embeds';
import { createRenderMentionsSuggestionConfig } from '@mod-protocol/react-ui-shadcn/dist/lib/mentions';
import { renderers } from '@mod-protocol/react-ui-shadcn/dist/renderers';
import cn from 'clsx';
import type { Variants } from 'framer-motion';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useId, useState } from 'react';
import { toast } from 'react-hot-toast';
import useSWR from 'swr';
import { useAccount } from 'wagmi';
import { createCastMessage, submitHubMessage } from '../../lib/farcaster/utils';
import { fetchJSON } from '../../lib/fetch';
import { TopicResponse, TopicType } from '../../lib/types/topic';
import { CreationModsSearch } from '../search/creation-mods-search';
import { SearchTopics } from '../search/search-topics';
import { TopicView, TweetTopicSkeleton } from '../tweet/tweet-topic';
import { Loading } from '../ui/loading';
import { InputOptions } from './input-options';

type InputProps = {
  isModal?: boolean;
  isReply?: boolean;
  parentPost?: { id: string; username: string; userId: string };
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

// Optionally replace with your API_URL here
const API_URL = process.env.NEXT_PUBLIC_MOD_API_URL!;

// TODO: Implement independent mentions

const getMentions = getFarcasterMentions(API_URL);

const getMentionFids = getMentionFidsByUsernames(API_URL);
const getUrlMetadata = fetchUrlMetadata(API_URL);
const onError = (err: any) => console.error(err.message);

export function Input({
  isModal,
  isReply,
  parentPost,
  disabled,
  children,
  replyModal,
  parentUrl,
  closeModal
}: InputProps): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const { user: currentUser } = useAuth();
  const formId = useId();
  const [currentMod, setCurrentMod] = useState<ModManifest | null>(null);
  const [modPopoverEnabled, setModPopoverEnabled] = useState(false);
  const [visited, setVisited] = useState(false);
  const { address } = useAccount();

  /* Topic */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentUrl]);

  useEffect(() => {
    if (topicUrl === topic?.url || topic === undefined) return;
    setTopicUrl(topic?.url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  useEffect(() => {
    if (topicResult && topic?.url !== topicResult.url) {
      setTopic(topicResult);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicResult]);

  const handleFocus = (): void => {
    setVisited(!loading);
  };

  const onSubmit = async ({
    text,
    embeds
  }: {
    text: string;
    embeds: Embed[];
    channel: Channel;
  }): Promise<boolean> => {
    if (!currentUser) return false;

    setLoading?.(true);

    // if (!inputValue && selectedImages.length === 0) {
    //   setLoading?.(false);
    //   return;
    // }

    const formattedCast = await formatPlaintextToHubCastMessage({
      text,
      embeds,
      parentUrl: topicUrl || undefined,
      getMentionFidsByUsernames: getMentionFids
    });
    if (!formattedCast) {
      setLoading?.(false);
      return false;
    }

    // submit the cast to a hub
    const castMessage = await createCastMessage({
      text: formattedCast.text,
      fid: parseInt(currentUser?.id),
      embeds: formattedCast.embeds,
      mentions: formattedCast.mentions,
      mentionsPositions: formattedCast.mentionsPositions,
      parentCastHash: isReply && parentPost ? parentPost.id : undefined,
      parentCastFid:
        isReply && parentPost ? parseInt(parentPost.userId) : undefined,
      parentUrl: !parentPost ? topicUrl : undefined
    });

    if (castMessage) {
      const res = await submitHubMessage(castMessage);
      const message = Message.fromJSON(res);

      // await sleep(500);

      if (!isModal && !replyModal) {
        // discardTweet();
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

    return true;
  };

  const {
    editor,
    getText,
    getEmbeds,
    setEmbeds,
    setText,
    setChannel,
    addEmbed,
    handleSubmit
  } = useEditor({
    placeholderText: isReply ? 'Cast your reply' : "What's happening?",
    fetchUrlMetadata: getUrlMetadata,
    onError,
    onSubmit,
    linkClassName: 'text-main-accent',
    renderMentionsSuggestionConfig: createRenderMentionsSuggestionConfig({
      getResults: getMentions
    }),
    editorOptions: {
      editorProps: {
        attributes: {
          style: 'outline: 0;  min-height: 48px;'
        },
        handleDrop(view, event) {
          const files = event.dataTransfer?.files;
          if (!files) return false;
          handleFileUpload(files);
          return true;
        }
      }
    }
  });

  const textLength = useTextLength({ getText, maxByteLength: 320 });

  useEffect(() => {
    setModPopoverEnabled(false);
  }, [currentMod]);
  useEffect(() => {
    topic &&
      setChannel({
        parent_url: topic.url,
        image: topic.image || null,
        channel_id: topic.url,
        name: topic.name
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <form
      className={cn('flex flex-col', {
        '-mx-4': isReply && !isModal,
        'my-2': replyModal,
        'cursor-not-allowed': disabled
      })}
      onSubmit={handleSubmit}
    >
      {loading && <i className='h-1 animate-pulse bg-main-accent' />}
      {children}
      {isReply && visited && !replyModal && (
        <p className='-mb-2 ml-[75px] mt-2 text-light-secondary dark:text-dark-secondary'>
          Replying to{' '}
          <Link href={`/user/${parentPost?.username as string}`}>
            <a className='custom-underline text-main-accent'>
              @{parentPost?.username as string}
            </a>
          </Link>
        </p>
      )}
      <label
        className={cn(
          'hover-animation grid w-full grid-cols-[auto,1fr] gap-3 px-4 py-3',
          isReply
            ? 'pb-1 pt-3'
            : replyModal
            ? 'pt-0'
            : 'border-b-2 border-light-border dark:border-dark-border',
          (disabled || loading) && 'pointer-events-none opacity-50'
        )}
        htmlFor={formId}
      >
        <UserAvatar
          src={currentUser!.photoURL}
          alt={currentUser!.name}
          username={currentUser!.username}
        />
        <div className='mt-3 flex w-full flex-col gap-4'>
          <div className='flex min-h-[48px] flex-col justify-center'>
            <div
              className='w-full min-w-0 cursor-text resize-none bg-transparent text-xl
                       outline-none placeholder:text-light-secondary dark:placeholder:text-dark-secondary'
            >
              {/* Tailwind doesn't compile properly without (?) */}
              <p
                data-placeholder=''
                className='is-empty before:text-foreground-secondary before-pointer-events-none hidden cursor-text before:absolute before:opacity-50 before:content-[attr(data-placeholder)]'
              ></p>
              <EditorContent
                editor={editor}
                onPaste={async (e) => {
                  const isPastingText = e.clipboardData.getData('text');
                  if (isPastingText) return;

                  const files = e.clipboardData.files;

                  handleFileUpload(files);
                }}
                autoFocus
                placeholder="What's happening?"
                onFocus={handleFocus}
              />
              <div className='text-base'>
                <EmbedsEditor
                  embeds={getEmbeds()}
                  setEmbeds={setEmbeds}
                  RichEmbed={({ embed }) => (
                    <RichEmbed
                      api={API_URL}
                      defaultRichEmbedMod={defaultRichEmbedMod}
                      mods={[defaultRichEmbedMod]}
                      embed={embed}
                      renderers={renderers}
                    />
                  )}
                />
              </div>
            </div>
            <div className='flex flex-row gap-1 pt-2'>
              {loadingTopic ? (
                <div className='w-10'>
                  <TweetTopicSkeleton />
                </div>
              ) : showingTopicSelector && !parentPost ? (
                <SearchTopics
                  enabled={showingTopicSelector}
                  onSelectRawUrl={setTopicUrl}
                  onSelectTopic={(topic) => {
                    setTopic(topic);
                  }}
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
            </div>
            {contentLoading && <Loading />}
            <div className='mt-2'>
              {(isReply ? isReply && visited && !loading : !loading) && (
                <InputOptions
                  inputLength={textLength.length}
                  isValidTweet={
                    textLength.isValid &&
                    (textLength.length > 0 || getEmbeds().length > 0)
                  }
                  inputLimit={320}
                  isCharLimitExceeded={textLength.length > 320}
                  handleImageUpload={() => {}}
                  options={
                    [
                      !isReply && {
                        name: 'Topic',
                        iconName: 'HashtagIcon',
                        disabled: false,
                        popoverContent: () => (
                          <SearchTopics
                            enabled={true}
                            onSelectRawUrl={setTopicUrl}
                            onSelectTopic={setTopic}
                            setShowing={setShowingTopicSelector}
                          />
                        )
                      },
                      {
                        name: 'Mods',
                        iconName: 'PlusIcon',
                        disabled: false,
                        popoverContent: () => (
                          <CreationModsSearch
                            mods={creationMods.filter(
                              (mod) =>
                                // Mods to exclude
                                ![
                                  'livepeer-video',
                                  'infura-ipfs-upload'
                                ].includes(mod.slug)
                            )}
                            onSelect={(mod) => {
                              setCurrentMod(mod);
                            }}
                            open={!!currentMod}
                            setOpen={(op: boolean) => {
                              setModPopoverEnabled(true);
                              if (!op && modPopoverEnabled) setCurrentMod(null);
                            }}
                          />
                        )
                      }
                    ].filter(Boolean) as any[]
                  }
                />
              )}
            </div>
            <Popover
              open={!!currentMod}
              onOpenChange={(op: boolean) => {
                if (!op) setCurrentMod(null);
              }}
            >
              <PopoverTrigger></PopoverTrigger>
              <PopoverContent className='ml-2 w-[400px]' align='start'>
                <div className='space-y-4'>
                  <h4 className='font-medium leading-none'>
                    {currentMod?.name}
                  </h4>
                  <hr />
                  {currentMod && (
                    <CreationMod
                      input={getText()}
                      embeds={getEmbeds()}
                      user={{
                        wallet: {
                          address: address ? address : undefined
                        },
                        farcaster: {
                          fid: currentUser?.id
                        }
                      }}
                      api={API_URL}
                      variant='creation'
                      manifest={currentMod}
                      renderers={renderers}
                      onOpenFileAction={handleOpenFile}
                      onExitAction={() => setCurrentMod(null)}
                      onSetInputAction={handleSetInput(setText)}
                      onAddEmbedAction={handleAddEmbed(addEmbed)}
                    />
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </label>
    </form>
  );
}
