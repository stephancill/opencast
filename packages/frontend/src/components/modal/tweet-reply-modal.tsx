import { Input } from '@components/input/input';
import { Tweet } from '@components/tweet/tweet';
import type { TweetProps } from '@components/tweet/tweet';

type TweetReplyModalProps = {
  tweet: TweetProps;
  closeModal: () => void;
};

export function TweetReplyModal({
  tweet,
  closeModal
}: TweetReplyModalProps): JSX.Element {
  return (
    <Input
      isModal
      replyModal
      isReply
      parentPost={{
        id: tweet.id,
        username: tweet.user.username,
        userId: tweet.user.id
      }}
      closeModal={closeModal}
      parentUrl={tweet.topicUrl || undefined}
    >
      <Tweet modal parentTweet {...tweet} />
    </Input>
  );
}
