import { useAuth } from '@lib/context/auth-context';
import { useModal } from '@lib/hooks/useModal';
import { preventBubbling } from '@lib/utils';
import { Modal } from '@components/modal/modal';
import { ActionModal } from '@components/modal/action-modal';
import { Button } from '@components/ui/button';
import {
  createFollowMessage,
  submitHubMessage
} from '../../lib/farcaster/utils';
import toast from 'react-hot-toast';

type FollowButtonProps = {
  userTargetId: string;
  userTargetUsername: string;
};

export function FollowButton({
  userTargetId,
  userTargetUsername
}: FollowButtonProps): JSX.Element | null {
  const { user } = useAuth();
  const { open, openModal, closeModal } = useModal();

  if (user?.id === userTargetId) return null;

  const { id: userId, following } = user ?? {};

  const handleFollow = async (): Promise<void> => {
    if (!userId) {
      toast.error(`Failed to follow @${userTargetUsername}`);
    }

    const message = await createFollowMessage({
      fid: parseInt(userId!),
      targetFid: parseInt(userTargetId),
      remove: false
    });

    if (message) {
      const res = await submitHubMessage(message);
    } else {
      toast.error(`Failed to follow @${userTargetUsername}`);
    }
    closeModal();
  };

  const handleUnfollow = async (): Promise<void> => {
    if (!userId) {
      toast.error(`Failed to unfollow @${userTargetUsername}`);
    }

    const message = await createFollowMessage({
      fid: parseInt(userId!),
      targetFid: parseInt(userTargetId),
      remove: true
    });

    if (message) {
      const res = await submitHubMessage(message);
    } else {
      toast.error(`Failed to unfollow @${userTargetUsername}`);
    }
    closeModal();
  };

  const userIsFollowed = !!following?.includes(userTargetId ?? '');

  return (
    <>
      <Modal
        modalClassName='flex flex-col gap-6 max-w-xs bg-main-background w-full p-8 rounded-2xl'
        open={open}
        closeModal={closeModal}
      >
        <ActionModal
          title={`Unfollow @${userTargetUsername}?`}
          description='Their Tweets will no longer show up in your home timeline. You can still view their profile, unless their Tweets are protected.'
          mainBtnLabel='Unfollow'
          action={handleUnfollow}
          closeModal={closeModal}
        />
      </Modal>
      {userIsFollowed ? (
        <Button
          className='dark-bg-tab min-w-[106px] self-start border border-light-line-reply px-4 py-1.5 
                     font-bold hover:border-accent-red hover:bg-accent-red/10 hover:text-accent-red
                     hover:before:content-["Unfollow"] inner:hover:hidden dark:border-light-secondary'
          onClick={preventBubbling(openModal)}
        >
          <span>Following</span>
        </Button>
      ) : (
        <Button
          className='self-start border bg-light-primary px-4 py-1.5 font-bold text-white hover:bg-light-primary/90 
                     focus-visible:bg-light-primary/90 active:bg-light-border/75 dark:bg-light-border 
                     dark:text-light-primary dark:hover:bg-light-border/90 dark:focus-visible:bg-light-border/90 
                     dark:active:bg-light-border/75'
          onClick={preventBubbling(handleFollow)}
        >
          Follow
        </Button>
      )}
    </>
  );
}
