import { InterestType } from '../types/topic';

function normalizeInterests(interests: InterestType[]): InterestType[] {
  // Normalize interests by scaling the volume as a percentage of the total volume
  const totalVolume = interests.reduce((acc, { volume }) => acc + volume, 0);
  return interests.map((interest) => ({
    ...interest,
    volume: interest.volume / (totalVolume as number)
  }));
}

export function calculateMatchFactor(
  currentInterests: InterestType[],
  targetInterests: InterestType[]
): number {
  // Calculate the match factor between two users based on the current user's likes and the target user's posts
  // It is an indicator of how likely the current user are to like their tweets based on the topics they post about
  const normalizedCurrentInterests = normalizeInterests(currentInterests);
  const normalizedTargetInterests = normalizeInterests(targetInterests);

  const matchFactor = normalizedCurrentInterests.reduce(
    (acc, { topic, volume }) => {
      const targetInterest = normalizedTargetInterests.find(
        ({ topic: targetTopic }) => targetTopic.name === topic.name
      );
      if (targetInterest) {
        return acc + targetInterest.volume;
      }
      return acc;
    },
    0
  );

  return matchFactor;
}
