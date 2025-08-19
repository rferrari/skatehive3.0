"use client";

import UpvoteSnapToast from "./UpvoteSnapToast";
import WitnessVoteToast from "./WitnessVoteToast";

interface CommunityToastsProps {
  showInterval?: number;
  displayDuration?: number;
}

/**
 * Combined component that manages both upvote snap container and witness vote toasts
 */
export default function CommunityToasts({
  showInterval,
  displayDuration,
}: CommunityToastsProps) {
  return (
    <>
      <UpvoteSnapToast
        showInterval={showInterval}
        displayDuration={displayDuration}
      />
      <WitnessVoteToast
        showInterval={showInterval}
        displayDuration={displayDuration}
      />
    </>
  );
}
