'use client';

import * as React from 'react';

// Core
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
  getFarcasterChannels,
  getFarcasterMentions,
  getMentionFidsByUsernames
} from '@mod-protocol/farcaster';
import { creationMiniApps } from '@mod-protocol/miniapp-registry';
import { CreationMiniApp } from '@mod-protocol/react';
import { EditorContent, useEditor } from '@mod-protocol/react-editor';

// UI implementation
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@mod-protocol/react-ui-shadcn/dist/components/ui/popover';
import { EmbedsEditor } from '@mod-protocol/react-ui-shadcn/dist/lib/embeds';
import { createRenderMentionsSuggestionConfig } from '@mod-protocol/react-ui-shadcn/dist/lib/mentions';
import { renderers } from '@mod-protocol/react-ui-shadcn/dist/renderers';
import cn from 'clsx';
import useSWR from 'swr';
import { useAuth } from '../../lib/context/auth-context';
import { fetchJSON } from '../../lib/fetch';
import { TopicResponse, TopicType } from '../../lib/types/topic';
import { CreationMiniAppsSearch } from '../search/creation-miniapps-search';
import { SearchTopics } from '../search/search-topics';
import { TopicView, TweetTopicSkeleton } from '../tweet/tweet-topic';
import { UserAvatar } from '../user/user-avatar';
import { InputOptions } from './input-options';

type InputProps = {
  isModal?: boolean;
  isReply?: boolean;
  parentAuthor?: { id: string; username: string; userId: string };
  disabled?: boolean;
  children?: React.ReactNode;
  replyModal?: boolean;
  parentUrl?: string;
  loading?: boolean;
  closeModal?: () => void;
};

// Optionally replace with your API_URL here
const API_URL =
  process.env.NEXT_PUBLIC_MOD_API_URL ?? 'https://api.modprotocol.org';

//TODO
// const getMentions: (query: string) => Promise<ModMention[]> = async (
//   query: string
// ) => {
//   const { result } = await fetchJSON<BaseResponse<User[]>>(
//     `/api/search?q=${query}`
//   );
//   const modMentions: ModMention[] =
//     result?.map((user) => ({
//       fid: parseInt(user.id),
//       avatar_url: user.photoURL,
//       display_name: user.name,
//       username: user.username
//     })) || [];

//   console.log(modMentions);

//   return modMentions;
// };

const getMentions = getFarcasterMentions(API_URL);

const getChannels = getFarcasterChannels(API_URL);
const getMentionFids = getMentionFidsByUsernames(API_URL);
const getUrlMetadata = fetchUrlMetadata(API_URL);
const onError = (err: any) => console.error(err.message);
const onSubmit = async ({
  text,
  embeds,
  channel
}: {
  text: string;
  embeds: Embed[];
  channel: Channel;
}) => {
  const formattedCast = await formatPlaintextToHubCastMessage({
    text,
    embeds,
    parentUrl: channel.parent_url || undefined,
    getMentionFidsByUsernames: getMentionFids
  });
  window.alert(
    `This is a demo, and doesn't do anything.\n\nCast text:\n${text}\nEmbeds:\n${embeds
      .map((embed) => (embed as any).url)
      .join(', ')}\nChannel:\n${channel.name}`
  );

  console.log(formattedCast);

  // submit the cast to a hub

  return true;
};

export default function EditorExample({
  disabled,
  replyModal,
  loading,
  parentUrl,
  parentAuthor: parent,
  isReply = false
}: InputProps) {
  const { user: currentUser } = useAuth();
  const formId = React.useId();
  const [currentMiniapp, setCurrentMiniapp] =
    React.useState<ModManifest | null>(null);
  const [miniappPopoverEnabled, setMiniappPopoverEnabled] =
    React.useState(false);
  const {
    editor,
    getText,
    getEmbeds,
    setEmbeds,
    setText,
    setChannel,
    getChannel,
    addEmbed,
    handleSubmit
  } = useEditor({
    placeholderText: isReply ? 'Cast your reply' : "What's happening?",
    fetchUrlMetadata: getUrlMetadata,
    onError,
    onSubmit,
    linkClassName: 'text-blue-600',
    renderMentionsSuggestionConfig: createRenderMentionsSuggestionConfig({
      getResults: getMentions
    })
  });

  /* Topic */
  const [topicUrl, setTopicUrl] = React.useState(parentUrl);
  const [showingTopicSelector, setShowingTopicSelector] = React.useState(false);
  const [topic, setTopic] = React.useState<TopicType | null>();
  const { data: topicResult, isValidating: loadingTopic } = useSWR(
    topicUrl ? `/api/topic?url=${encodeURIComponent(topicUrl)}` : null,
    async (url) => {
      const res = await fetchJSON<TopicResponse>(url);
      return res.result;
    },
    { revalidateOnFocus: false }
  );
  React.useEffect(() => {
    if (topicUrl !== parentUrl) {
      setTopicUrl(parentUrl);
    }
  }, [parentUrl]);
  React.useEffect(() => {
    if (topicUrl === topic?.url || topic === undefined) return;
    setTopicUrl(topic?.url);
  }, [topic]);

  React.useEffect(() => {
    if (topicResult && topic?.url !== topicResult.url) {
      setTopic(topicResult);
    }
  }, [topicResult]);

  React.useEffect(() => {
    setMiniappPopoverEnabled(false);
  }, [currentMiniapp]);
  React.useEffect(() => {
    topic &&
      setChannel({
        parent_url: topic.url,
        image: topic.image || null,
        channel_id: topic.url,
        name: topic.name
      });
  }, [topic]);

  return (
    <form
      className={cn('flex flex-col', {
        '-mx-4': isReply,
        'gap-2': replyModal,
        'cursor-not-allowed': disabled
      })}
      onSubmit={handleSubmit}
    >
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
          <div className='flex min-h-[48px] w-full flex-col justify-center gap-4'>
            <div
              className='w-full min-w-0 resize-none bg-transparent text-xl outline-none
                       placeholder:text-light-secondary dark:placeholder:text-dark-secondary'
            >
              <EditorContent
                editor={editor}
                autoFocus
                className='break-text w-full'
              />
              <EmbedsEditor embeds={getEmbeds()} setEmbeds={setEmbeds} />
            </div>
            <div className='flex flex-row gap-1 pt-2'>
              {loadingTopic ? (
                <div className='w-10'>
                  <TweetTopicSkeleton />
                </div>
              ) : showingTopicSelector && !parent ? (
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
            {!loading && (
              <InputOptions
                // reply={reply}
                // modal={modal}
                // inputLimit={inputLimit}
                inputLength={Buffer.from(getText()).length}
                isValidTweet={
                  Buffer.from(getText()).length > 0 &&
                  Buffer.from(getText()).length < 320
                }
                inputLimit={320}
                isCharLimitExceeded={Buffer.from(getText()).length > 320}
                handleImageUpload={() => {}}
                options={[
                  {
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
                    popoverContent: (open, setOpen) => (
                      <CreationMiniAppsSearch
                        miniapps={creationMiniApps}
                        onSelect={(miniapp) => {
                          setCurrentMiniapp(miniapp);
                        }}
                        open={!!currentMiniapp}
                        setOpen={(op: boolean) => {
                          setMiniappPopoverEnabled(true);
                          if (!op && miniappPopoverEnabled)
                            setCurrentMiniapp(null);
                        }}
                      />
                    )
                  }
                ]}
              />
            )}
            <Popover
              open={!!currentMiniapp}
              onOpenChange={(op: boolean) => {
                if (!op) setCurrentMiniapp(null);
              }}
            >
              <PopoverTrigger></PopoverTrigger>
              <PopoverContent className='ml-2 w-[400px]' align='start'>
                <div className='space-y-4'>
                  <h4 className='font-medium leading-none'>
                    {currentMiniapp?.name}
                  </h4>
                  <hr />
                  {currentMiniapp && (
                    <CreationMiniApp
                      input={getText()}
                      embeds={getEmbeds()}
                      api={API_URL}
                      variant='creation'
                      manifest={currentMiniapp}
                      renderers={renderers}
                      onOpenFileAction={handleOpenFile}
                      onExitAction={() => setCurrentMiniapp(null)}
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
