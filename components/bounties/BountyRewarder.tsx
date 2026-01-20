import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Checkbox,
  CheckboxGroup,
  VStack,
  Text,
  Button,
  Divider,
  useTheme,
  Box,
  Badge,
  HStack,
  Avatar,
} from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import { Discussion } from "@hiveio/dhive";
import { transferWithKeychain } from "@/lib/hive/client-functions";
import { KeychainSDK } from "keychain-sdk";

interface WinnerInfo {
  username: string;
  place: number;
  rewardAmount: number;
}

interface BountyRewarderProps {
  isOpen: boolean;
  onClose: () => void;
  post: Discussion;
  user: string | null;
  uniqueCommenters: string[];
  challengeName: string;
  rewardInfo: {
    amount: number;
    currency: string;
  };
  onRewardSuccess: () => void;
  addComment: (newComment: Discussion) => void;
}

const BountyRewarder: React.FC<BountyRewarderProps> = ({
  isOpen,
  onClose,
  post,
  user,
  uniqueCommenters,
  challengeName,
  rewardInfo,
  onRewardSuccess,
  addComment,
}) => {
  const theme = useTheme();
  const [selectedWinners, setSelectedWinners] = useState<string[]>([]);
  const [isRewarding, setIsRewarding] = useState(false);
  const [rewardError, setRewardError] = useState<string | null>(null);
  const [rewardSuccess, setRewardSuccess] = useState(false);
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");

  // Smart weighted reward formula that adapts to number of winners with precise rounding
  const calculateRewards = (winners: string[]): WinnerInfo[] => {
    if (winners.length === 0) return [];
    
    const totalReward = rewardInfo.amount;
    const winnersList: WinnerInfo[] = [];
    
    if (winners.length === 1) {
      // Only 1 winner: gets 100%
      winnersList.push({ 
        username: winners[0], 
        place: 1, 
        rewardAmount: totalReward 
      });
    } else if (winners.length === 2) {
      // 2 winners: 1st gets 70%, 2nd gets 30%
      const firstPlace = Math.round(totalReward * 0.70 * 1000) / 1000; // Round to 3 decimals
      const secondPlace = totalReward - firstPlace; // Ensure exact total
      
      winnersList.push({ 
        username: winners[0], 
        place: 1, 
        rewardAmount: firstPlace 
      });
      winnersList.push({ 
        username: winners[1], 
        place: 2, 
        rewardAmount: secondPlace 
      });
    } else if (winners.length === 3) {
      // 3 winners: 1st gets 50%, 2nd gets 30%, 3rd gets 20%
      const firstPlace = Math.round(totalReward * 0.50 * 1000) / 1000;
      const secondPlace = Math.round(totalReward * 0.30 * 1000) / 1000;
      const thirdPlace = totalReward - firstPlace - secondPlace; // Ensure exact total
      
      winnersList.push({ 
        username: winners[0], 
        place: 1, 
        rewardAmount: firstPlace 
      });
      winnersList.push({ 
        username: winners[1], 
        place: 2, 
        rewardAmount: secondPlace 
      });
      winnersList.push({ 
        username: winners[2], 
        place: 3, 
        rewardAmount: thirdPlace 
      });
    } else {
      // 4+ winners: 1st gets 40%, 2nd gets 25%, 3rd gets 20%, rest split remaining 15% equally
      const topTierReward = totalReward * 0.85; // 40% + 25% + 20% = 85%
      const lowerTierReward = totalReward * 0.15; // Remaining 15%
      const lowerTierWinners = winners.length - 3; // Number of winners after 3rd place
      const rewardPerLowerTier = lowerTierReward / lowerTierWinners;
      
      winners.forEach((username, index) => {
        let rewardAmount: number;
        let place: number;
        
        if (index === 0) {
          // 1st place: 40%
          rewardAmount = Math.round(totalReward * 0.40 * 1000) / 1000;
          place = 1;
        } else if (index === 1) {
          // 2nd place: 25%
          rewardAmount = Math.round(totalReward * 0.25 * 1000) / 1000;
          place = 2;
        } else if (index === 2) {
          // 3rd place: 20%
          rewardAmount = Math.round(totalReward * 0.20 * 1000) / 1000;
          place = 3;
        } else {
          // 4th place and beyond: split the remaining 15% equally
          rewardAmount = Math.round(rewardPerLowerTier * 1000) / 1000;
          place = index + 1;
        }
        
        winnersList.push({ username, place, rewardAmount });
      });
      
      // Adjust the last lower-tier winner to ensure exact total
      if (lowerTierWinners > 0) {
        const totalDistributed = winnersList.reduce((sum, winner) => sum + winner.rewardAmount, 0);
        const lastLowerTierIndex = winnersList.length - 1;
        const adjustment = totalReward - totalDistributed;
        
        if (Math.abs(adjustment) > 0.001) {
          winnersList[lastLowerTierIndex].rewardAmount = Math.round((winnersList[lastLowerTierIndex].rewardAmount + adjustment) * 1000) / 1000;
        }
      }
    }
    
    return winnersList;
  };

  const winnerRewards = calculateRewards(selectedWinners);
  const totalRewardAmount = winnerRewards.reduce((sum, winner) => sum + winner.rewardAmount, 0);

  const getPlaceEmoji = (place: number) => {
    switch (place) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return `${place}️⃣`;
    }
  };

  const getPlaceBadgeColor = (place: number) => {
    switch (place) {
      case 1: return "gold";
      case 2: return "silver";
      case 3: return "bronze";
      default: return "gray";
    }
  };

  const handleRewardBountyHunters = async () => {
    if (!user) {
      setRewardError("You must be logged in to reward bounty hunters.");
      return;
    }

    if (selectedWinners.length === 0) {
      setRewardError("No winners selected.");
      return;
    }

    setIsRewarding(true);
    setRewardError(null);
    setRewardSuccess(false);
    
    try {
      setCurrentStep("Sending rewards...");
      
      for (let i = 0; i < winnerRewards.length; i++) {
        const winner = winnerRewards[i];
        try {
          setCurrentStep(`Sending ${winner.place}${getOrdinalSuffix(winner.place)} place reward to @${winner.username}... (${i + 1}/${winnerRewards.length})`);
          
          const transferResult = await transferWithKeychain(
            String(user),
            winner.username,
            winner.rewardAmount.toFixed(3),
            `🏆 ${winner.place}${getOrdinalSuffix(winner.place)} Place! @${winner.username} won ${winner.rewardAmount.toFixed(3)} ${rewardInfo.currency} in the bounty: ${challengeName}`,
            rewardInfo.currency
          );
        } catch (err) {
          console.error(`Transfer error for ${winner.username}:`, err);
          setRewardError(`Failed to send reward to @${winner.username}. Please try again.`);
          setCurrentStep("");
          setIsRewarding(false);
          return;
        }
      }

      setCurrentStep("Announcing Winners... Confirm the keychain transaction to make a post in this bounty tagging the winners");
      
      const winnersList = winnerRewards
        .map((winner) => `${getPlaceEmoji(winner.place)} @${winner.username} - ${winner.rewardAmount.toFixed(3)} ${rewardInfo.currency}`)
        .join("\n");
      
      const commentBody = `🏆 Bounty Winners! 🏆\n\n${winnersList}\n\n💰 Total Distributed: ${totalRewardAmount.toFixed(3)} ${rewardInfo.currency}\n\nThank you for participating! 🎉`;
      const permlink = `bounty-winners-${Date.now()}`;
      
      // Validation: ensure all required fields are present
      const missingFields = [];
      if (!user || user === "undefined") missingFields.push("user");
      if (!post.author || post.author === "undefined")
        missingFields.push("post.author");
      if (!post.permlink || post.permlink === "undefined")
        missingFields.push("post.permlink");
      if (!permlink || permlink === "undefined") missingFields.push("permlink");
      if (!commentBody || commentBody === "undefined")
        missingFields.push("commentBody");

      if (missingFields.length > 0) {
        setRewardError("Missing required data: " + missingFields.join(", "));
        setIsRewarding(false);
        return;
      }
      
      const postObj = {
        username: String(user),
        body: commentBody,
        parent_username: post.author,
        parent_perm: post.permlink,
        permlink,
        json_metadata: JSON.stringify({}),
        comment_options: "",
      };
      
      // Validate all fields are present and not undefined
      for (const [key, value] of Object.entries(postObj)) {
        if (value === undefined || value === null || value === "undefined") {
          setRewardError(`Field ${key} is missing or undefined.`);
          setIsRewarding(false);
          return;
        }
      }
      
      try {
        const keychain = new KeychainSDK(window);
        const commentResult = await keychain.post(postObj);
        if (!commentResult || commentResult.success === false) {
          throw new Error("Failed to post bounty winner comment.");
        }
        
        // Add the new comment to the comments list immediately
        const newComment = {
          author: String(user),
          permlink,
          body: commentBody,
          parent_author: post.author,
          parent_permlink: post.permlink,
          created: new Date().toISOString(),
          children: 0,
          active_votes: [],
          replies: [],
          // Add required Discussion properties with minimal values
          id: 0,
          active: new Date().toISOString(),
          total_vote_weight: 0,
          url: `/${post.author}/${post.permlink}#@${user}/${permlink}`,
          root_title: post.parent_permlink ? post.root_title || "" : post.title || "",
          pending_payout_value: "0.000 HBD",
          total_pending_payout_value: "0.000 HBD",
          cashout_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          max_cashout_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          total_payout_value: "0.000 HBD",
          curator_payout_value: "0.000 HBD",
          author_rewards: "0",
          net_rshares: "0",
          abs_rshares: "0",
          vote_rshares: "0",
          children_abs_rshares: "0",
          max_accepted_payout: "1000000.000 HBD",
          percent_hbd: 10000,
          allow_replies: true,
          allow_votes: true,
          allow_curation_rewards: true,
          beneficiaries: [],
          last_update: new Date().toISOString(),
          last_payout: "1970-01-01T00:00:00",
          depth: 1,
          category: post.category || "general",
          title: "",
          json_metadata: "{}",
          author_reputation: 0,
          promoted: "0.000 HBD",
          body_length: commentBody.length.toString(),
          reblogged_by: [],
          net_votes: 0,
          root_comment: 0,
          reward_weight: 0,
        } as Discussion;
        
        addComment(newComment);
      } catch (err) {
        console.error("Keychain post error:", err);
        setRewardError(
          "Failed to post bounty winner comment. " +
            ((err as any)?.message || String(err))
        );
        setIsRewarding(false);
        return;
      }
      
      setRewardSuccess(true);
      onRewardSuccess();
      setCurrentStep("");
      
      // Only close the modal after success
      setTimeout(() => {
        onClose();
        // Show completion overlay
        setShowCompletionOverlay(true);
        // Hide overlay after 3 seconds
        setTimeout(() => {
          setShowCompletionOverlay(false);
        }, 3000);
        // Reset state for next use
        setSelectedWinners([]);
        setRewardError(null);
        setRewardSuccess(false);
      }, 2000);
    } catch (err: any) {
      setRewardError(err.message || "Failed to reward bounty hunters.");
    } finally {
      setIsRewarding(false);
    }
  };

  const getOrdinalSuffix = (num: number) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  const handleClose = () => {
    if (!isRewarding) {
      onClose();
      // Reset state
      setSelectedWinners([]);
      setRewardError(null);
      setRewardSuccess(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} isCentered>
        <ModalOverlay bg="rgba(0, 0, 0, 0.6)" />
        <ModalContent
          bg="muted"
          border="1px solid"
          borderColor="border"
          color="text"
        >
        <ModalHeader color="primary" fontWeight="bold">
          🏆 Select Bounty Winners
        </ModalHeader>
        <ModalCloseButton color="text" />
        <ModalBody>
          <VStack spacing={3} align="stretch" mb={4}>
            {selectedWinners.length === 1 && (
              <HStack spacing={4} justify="center">
                <Badge colorScheme="gold" variant="solid">🥇 1st: 100%</Badge>
              </HStack>
            )}
            {selectedWinners.length === 2 && (
              <HStack spacing={4} justify="center">
                <Badge colorScheme="gold" variant="solid">🥇 1st: 70%</Badge>
                <Badge colorScheme="silver" variant="solid">🥈 2nd: 30%</Badge>
              </HStack>
            )}
            {selectedWinners.length === 3 && (
              <HStack spacing={4} justify="center">
                <Badge colorScheme="gold" variant="solid">🥇 1st: 50%</Badge>
                <Badge colorScheme="silver" variant="solid">🥈 2nd: 30%</Badge>
                <Badge colorScheme="bronze" variant="solid">🥉 3rd: 20%</Badge>
              </HStack>
            )}
            {selectedWinners.length >= 4 && (
              <HStack spacing={4} justify="center" wrap="wrap">
                <Badge colorScheme="gold" variant="solid">🥇 1st: 40%</Badge>
                <Badge colorScheme="silver" variant="solid">🥈 2nd: 25%</Badge>
                <Badge colorScheme="bronze" variant="solid">🥉 3rd: 20%</Badge>
                <Badge colorScheme="gray" variant="solid">4th+: Split 15% equally</Badge>
              </HStack>
            )}
          </VStack>

          <CheckboxGroup
            value={selectedWinners}
            onChange={(val: string[]) => setSelectedWinners(val)}
          >
            <VStack align="start" spacing={2}>
              {uniqueCommenters.map((username: string, index: number) => (
                <Box
                  key={username}
                  w="100%"
                  p={2}
                  border="1px solid"
                  borderColor="border"
                  borderRadius="none"
                  bg="background"
                >
                  <HStack spacing={3} align="center">
                    <Avatar
                      size="sm"
                      name={username}
                      src={`https://images.hive.blog/u/${username}/avatar`}
                      bg="muted"
                      border="1px solid"
                      borderColor="border"
                    />
                    <Checkbox 
                      value={username}
                      colorScheme="primary"
                      sx={{
                        '& .chakra-checkbox__control': {
                          borderColor: 'primary',
                          _checked: {
                            bg: 'primary',
                            borderColor: 'primary',
                            '& .chakra-checkbox__icon': {
                              color: 'background',
                            },
                          },
                        },
                        '& .chakra-checkbox__label': {
                          color: 'text',
                          fontWeight: 'bold',
                        },
                      }}
                    >
                      @{username}
                    </Checkbox>
                  </HStack>
                  
                  {selectedWinners.includes(username) && (
                    <Box mt={2} ml={6}>
                      {(() => {
                        const winner = winnerRewards.find(w => w.username === username);
                        if (!winner) return null;
                        return (
                          <HStack spacing={2}>
                            <Badge
                              colorScheme={getPlaceBadgeColor(winner.place)}
                              variant="solid"
                              size="sm"
                            >
                              {getPlaceEmoji(winner.place)} {winner.place}{getOrdinalSuffix(winner.place)} Place
                            </Badge>
                            <Text fontSize="sm" color="accent" fontWeight="bold">
                              {winner.rewardAmount.toFixed(3)} {rewardInfo.currency}
                            </Text>
                          </HStack>
                        );
                      })()}
                    </Box>
                  )}
                </Box>
              ))}
            </VStack>
          </CheckboxGroup>

          <Divider my={4} borderColor="border" />
          
          {selectedWinners.length > 0 && (
            <Box p={3} bg="background" borderRadius="md" border="1px solid" borderColor="border">
              <Text color="text" fontSize="sm">
                Total Distributed: <b style={{ color: theme.colors.accent }}>
                  {totalRewardAmount.toFixed(3)} {rewardInfo.currency}
                </b>
              </Text>
            </Box>
          )}

          {rewardError && (
            <Text color="error" mt={3}>
              {rewardError}
            </Text>
          )}
          
          {currentStep && (
            <Text color="primary" mt={3} fontWeight="bold">
              {currentStep}
            </Text>
          )}
          
          {rewardSuccess && (
            <Text color="success" mt={3}>
              Bounty rewards sent and winners announced!
            </Text>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            bg="primary"
            color="background"
            _hover={{ bg: "accent" }}
            mr={3}
            isDisabled={selectedWinners.length === 0 || isRewarding}
            onClick={handleRewardBountyHunters}
            isLoading={isRewarding}
            fontWeight="bold"
          >
            Send Rewards
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleClose} 
            isDisabled={isRewarding}
            color="text"
            _hover={{ bg: "muted" }}
          >
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
    
    {/* Completion Overlay */}
    {showCompletionOverlay && (
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="rgba(0, 0, 0, 0.8)"
        zIndex={9999}
        display="flex"
        alignItems="center"
        justifyContent="center"
        animation="fadeInOut 3s ease-in-out"
        sx={{
          "@keyframes fadeInOut": {
            "0%": { opacity: 0 },
            "20%": { opacity: 1 },
            "80%": { opacity: 1 },
            "100%": { opacity: 0 },
          },
        }}
      >
        <Text
          fontSize="8xl"
          fontWeight="bold"
          color="success"
          textAlign="center"
          textShadow="0 2px 8px rgba(0,0,0,0.5)"
        >
          BOUNTY COMPLETE
        </Text>
      </Box>
    )}
    </>
  );
};

export default BountyRewarder; 