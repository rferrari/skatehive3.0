import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Box,
  Text,
  HStack,
  Button,
  Divider,
  VStack,
  Spinner,
  useToken,
  useTheme,
  Avatar,
  Input,
  IconButton,
  useColorModeValue,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Tooltip,
} from "@chakra-ui/react";
import { Discussion } from "@hiveio/dhive";
import { useComments } from "@/hooks/useComments";
import { ArrowBackIcon, CloseIcon, ChatIcon } from "@chakra-ui/icons";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { BiMessage } from "react-icons/bi";
import { useAioha } from "@aioha/react-ui";
import useIsMobile from "@/hooks/useIsMobile";
import { useFarcasterMiniapp } from "@/hooks/useFarcasterMiniapp";
import Snap from "./Snap";
import SnapComposer from "./SnapComposer";
import { EnhancedMarkdownRenderer } from "../markdown/EnhancedMarkdownRenderer";

interface ConversationProps {
  discussion: Discussion;
  setConversation: (conversation: Discussion | undefined) => void;
  onOpen: () => void;
  setReply: (reply: Discussion) => void;
  isOpen?: boolean;
}

// Constants for better maintainability
const EMOJI_REACTIONS = [
  "❤️",
  "🔥",
  "👏",
  "😢",
  "😍",
  "😮",
  "😂",
  "🛹",
] as const;
const MOBILE_BREAKPOINT = 768;
const COMMENT_SKELETON_COUNT = 3;

const Conversation = ({
  discussion,
  setConversation,
  onOpen,
  setReply,
  isOpen = true,
}: ConversationProps) => {
  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL
  const { user, aioha } = useAioha();
  const isMobile = useIsMobile();
  const { isInMiniapp } = useFarcasterMiniapp();

  // Custom mobile detection with proper hydration handling
  const [isCustomMobile, setIsCustomMobile] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration and mobile detection
  useEffect(() => {
    setIsHydrated(true);
    setIsCustomMobile(window.innerWidth < 768);

    const handleResize = () => {
      setIsCustomMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Use custom mobile detection or Farcaster miniapp for small screen UI
  const useSmallScreenUI = (isHydrated && isCustomMobile) || isInMiniapp;

  const { comments, isLoading, error } = useComments(
    discussion.author,
    discussion.permlink,
    true
  );
  const theme = useTheme();
  const toast = useToast();
  const [primaryColor] = useToken("colors", ["primary"]);

  // Theme-aware colors
  const mobileBgColor = useColorModeValue("black", "black");
  const textColor = useColorModeValue("gray.800", "white");
  const mobileTextColor = useColorModeValue("white", "white");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // State hooks
  const [optimisticReplies, setOptimisticReplies] = useState<Discussion[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set()
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Derived data and memoized values
  const replies = comments;
  const allComments = useMemo(
    () => [...optimisticReplies, ...replies],
    [optimisticReplies, replies]
  );
  const hasComments = useMemo(
    () => allComments.length > 0,
    [allComments.length]
  );

  // Effects
  useEffect(() => {
    if (useSmallScreenUI) {
      window.scrollTo(0, 0);
    }
  }, [useSmallScreenUI]);

  // Helper function to format time like Instagram
  const formatTimeAgo = useCallback((dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  }, []);

  const handleCommentChange = useCallback(
    (value: string) => {
      if (value.length <= 500) {
        // Character limit
        setCommentText(value);
      } else {
        toast({
          title: "Comment too long",
          description: "Comments must be 500 characters or less",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [toast]
  );

  const handleCommentSubmit = useCallback(async () => {
    if (!commentText.trim() || isSubmitting) return;

    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to comment",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate a unique permlink for the comment
      const permlink = `re-${discussion.author}-${
        discussion.permlink
      }-${Date.now()}`;

      // Use aioha to submit the comment
      const result = await aioha.comment(
        discussion.author,
        discussion.permlink,
        permlink,
        "", // Empty title for comments
        commentText,
        {
          app: "Skatehive App 3.0",
          format: "markdown",
        }
      );

      if (result && !result.error) {
        // Create optimistic comment for immediate UI update
        const newComment: Discussion = {
          author: user!,
          permlink,
          body: commentText,
          parent_author: discussion.author,
          parent_permlink: discussion.permlink,
          created: new Date().toISOString(),
          children: 0,
          active_votes: [],
          replies: [],
          // Add required Discussion properties
          id: Date.now(),
          active: new Date().toISOString(),
          allow_replies: true,
          allow_votes: true,
          allow_curation_rewards: true,
          beneficiaries: [],
          last_update: new Date().toISOString(),
          last_payout: "1970-01-01T00:00:00",
          depth: 1,
          category: discussion.category || "general",
          title: "",
          json_metadata: JSON.stringify({
            app: "Skatehive App 3.0",
            format: "markdown",
          }),
          author_reputation: 0,
          promoted: "0.000 HBD",
          body_length: commentText.length.toString(),
          reblogged_by: [],
          net_votes: 0,
          root_comment: 0,
          reward_weight: 0,
          total_vote_weight: 0,
          url: `/${discussion.author}/${discussion.permlink}#@${user}/${permlink}`,
          root_title: discussion.title || "",
          pending_payout_value: "0.000 HBD",
          total_pending_payout_value: "0.000 HBD",
          cashout_time: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          max_cashout_time: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          total_payout_value: "0.000 HBD",
          curator_payout_value: "0.000 HBD",
          author_rewards: "0",
          net_rshares: "0",
          abs_rshares: "0",
          vote_rshares: "0",
          children_abs_rshares: "0",
          max_accepted_payout: "1000000.000 HBD",
          percent_hbd: 10000,
        } as Discussion;

        // Add to optimistic replies for immediate feedback
        setOptimisticReplies((prev) => [...prev, newComment]);

        setCommentText("");
        toast({
          title: "Comment posted!",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } else {
        throw new Error(result?.error?.message || "Failed to post comment");
      }

      // Refocus input after submission
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    } catch (error: any) {
      console.error("Comment submission error:", error);
      toast({
        title: "Failed to post comment",
        description: error.message || "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [commentText, isSubmitting, user, toast, discussion, aioha]);

  const handleEmojiClick = useCallback(
    (emoji: string) => {
      if (commentText.length + emoji.length <= 500) {
        setCommentText((prev) => prev + emoji);
        // Maintain focus on input after emoji click
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 0);
      }
    },
    [commentText.length]
  );

  const handleLikeComment = useCallback(
    async (commentPermlink: string) => {
      if (!user) {
        toast({
          title: "Please log in",
          description: "You need to be logged in to like comments",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const isCurrentlyLiked = likedComments.has(commentPermlink);

      // Find the comment to get its author
      const comment = allComments.find((c) => c.permlink === commentPermlink);
      if (!comment) return;

      // Optimistic update
      setLikedComments((prev) => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.delete(commentPermlink);
        } else {
          newSet.add(commentPermlink);
        }
        return newSet;
      });

      try {
        // Use aioha to vote (positive weight for like, 0 for unlike)
        const weight = isCurrentlyLiked ? 0 : 10000; // 100% upvote or remove vote

        const result = await aioha.vote(
          comment.author,
          commentPermlink,
          weight
        );

        if (result && result.error) {
          // Revert optimistic update on error
          setLikedComments((prev) => {
            const newSet = new Set(prev);
            if (isCurrentlyLiked) {
              newSet.add(commentPermlink);
            } else {
              newSet.delete(commentPermlink);
            }
            return newSet;
          });

          throw new Error(result.error.message || "Failed to vote");
        }

        toast({
          title: isCurrentlyLiked ? "Vote removed" : "Comment liked!",
          status: "success",
          duration: 1000,
          isClosable: true,
        });
      } catch (error: any) {
        console.error("Vote error:", error);

        // Revert optimistic update on error
        setLikedComments((prev) => {
          const newSet = new Set(prev);
          if (isCurrentlyLiked) {
            newSet.add(commentPermlink);
          } else {
            newSet.delete(commentPermlink);
          }
          return newSet;
        });

        toast({
          title: "Failed to like comment",
          description: error.message || "Please try again",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [user, likedComments, allComments, aioha, toast]
  );

  const handleReplyToComment = useCallback(
    (author: string) => {
      const mention = `@${author} `;
      if (commentText.length + mention.length <= 500) {
        setCommentText((prev) => prev + mention);
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 0);
      }
    },
    [commentText.length]
  );

  const handleToggleReplies = useCallback(async (commentPermlink: string) => {
    setExpandedReplies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentPermlink)) {
        newSet.delete(commentPermlink);
      } else {
        newSet.add(commentPermlink);
        // Fetch replies when expanding
        fetchRepliesForComment(commentPermlink);
      }
      return newSet;
    });
  }, []);

  const fetchRepliesForComment = useCallback(
    async (commentPermlink: string) => {
      // Find the comment to get its author
      const comment = allComments.find((c) => c.permlink === commentPermlink);
      if (!comment) return;

      try {
        // Import fetchComments dynamically to avoid circular dependencies
        const { fetchComments } = await import("@/lib/hive/fetchComments");
        const replies = await fetchComments(
          comment.author,
          comment.permlink,
          false
        );

        // Store the replies in the comment object for rendering
        comment.replies = replies as any;
        // Force re-render by updating state
        setExpandedReplies((prev) => new Set(prev));
      } catch (error) {
        console.error("Error fetching replies:", error);
        toast({
          title: "Failed to load replies",
          description: "Please try again",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [allComments, toast]
  );

  const onBackClick = useCallback(() => {
    setConversation(undefined);
  }, [setConversation]);

  // New onNewComment handler for SnapComposer with optimistic update
  const handleNewReply = useCallback(
    (newComment: Partial<Discussion>) => {
      const newReply = newComment as Discussion;
      setOptimisticReplies((prev) => [...prev, newReply]);
      setReply(newReply);
    },
    [setReply]
  );

  // Callback to update comment count when a new comment is added
  const handleCommentAdded = useCallback(() => {
    // This will be called when a comment is added to update the count
    // The count is already updated optimistically in the Snap component
  }, []);

  // Early return AFTER all hooks have been called
  if (isLoading) {
    return (
      <Box
        h="100vh"
        bg={useSmallScreenUI ? mobileBgColor : "background"}
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderTopRadius={useSmallScreenUI ? "20px" : "0"}
      >
        <VStack spacing={4}>
          <Spinner size="xl" color={primaryColor} />
          <Text color={useSmallScreenUI ? mobileTextColor : textColor}>
            Loading conversation...
          </Text>
        </VStack>
      </Box>
    );
  }

  // Error state for comments
  if (!comments && !isLoading) {
    return (
      <Box
        h="100vh"
        bg={useSmallScreenUI ? mobileBgColor : "background"}
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderTopRadius={useSmallScreenUI ? "20px" : "0"}
        p={4}
      >
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Failed to load comments!</AlertTitle>
            <AlertDescription>
              Please check your connection and try again.
            </AlertDescription>
          </Box>
        </Alert>
      </Box>
    );
  }

  // Comment Item Component for recursive rendering
  const CommentItem = ({
    comment,
    depth = 0,
  }: {
    comment: Discussion;
    depth?: number;
  }) => {
    const hasReplies = comment.children && comment.children > 0;
    const isExpanded = expandedReplies.has(comment.permlink);
    const nestedReplies = (comment as any).replies || [];

    return (
      <Box>
        <Box
          py={4}
          pl={depth * 4} // Indent based on depth
          borderBottom="1px solid"
          borderColor={"muted"}
          borderLeft={depth > 0 ? "2px solid" : "none"}
          borderLeftColor={depth > 0 ? "gray.600" : "transparent"}
          _last={{ borderBottom: "none" }}
        >
          <HStack spacing={3} align="start">
            <Avatar
              size="sm"
              name={comment.author}
              src={`https://images.hive.blog/u/${comment.author}/avatar/sm`}
              loading="lazy"
            />
            <VStack align="start" spacing={2} flex={1}>
              <HStack spacing={2} align="center" w="100%">
                <Text fontWeight="bold" fontSize="sm" color={mobileTextColor}>
                  {comment.author}
                </Text>
                <Text color="gray.400" fontSize="xs">
                  {formatTimeAgo(comment.created)}
                </Text>
                {comment.author === discussion.author && (
                  <Box
                    color="white"
                    px={2}
                    py={0.5}
                    borderRadius="md"
                    fontSize="xs"
                  >
                    author
                  </Box>
                )}
                <Box ml="auto">
                  <Tooltip label="Like comment" placement="top">
                    <IconButton
                      aria-label="Like comment"
                      icon={
                        <AiOutlineHeart
                          size={16}
                          color={
                            likedComments.has(comment.permlink) ? "red" : "gray"
                          }
                        />
                      }
                      variant="ghost"
                      size="xs"
                      color={
                        likedComments.has(comment.permlink)
                          ? "red.400"
                          : "gray.400"
                      }
                      _hover={{ bg: "gray.800", transform: "scale(1.1)" }}
                      _active={{
                        bg: "gray.700",
                        transform: "scale(0.9)",
                      }}
                      minW="32px"
                      h="32px"
                      onClick={() => handleLikeComment(comment.permlink)}
                    />
                  </Tooltip>
                </Box>
              </HStack>
              <EnhancedMarkdownRenderer content={comment.body} />
              <HStack spacing={4}>
                <Button
                  variant="ghost"
                  size="xs"
                  color="gray.400"
                  p={0}
                  h="auto"
                  fontWeight="normal"
                  _hover={{ bg: "transparent", color: "white" }}
                  onClick={() => handleReplyToComment(comment.author)}
                >
                  Reply
                </Button>
                {hasReplies && (
                  <Button
                    variant="ghost"
                    size="xs"
                    color="gray.400"
                    p={0}
                    h="auto"
                    fontWeight="normal"
                    _hover={{ bg: "transparent", color: "white" }}
                    onClick={() => handleToggleReplies(comment.permlink)}
                    leftIcon={<BiMessage size={12} />}
                  >
                    {isExpanded ? "Hide" : "View"} {comment.children}{" "}
                    {comment.children === 1 ? "reply" : "replies"}
                  </Button>
                )}
                <Text fontSize="xs" color="gray.500">
                  {comment.active_votes?.length || 0} likes
                </Text>
              </HStack>
            </VStack>
          </HStack>
        </Box>

        {/* Nested Replies */}
        {isExpanded && nestedReplies.length > 0 && (
          <VStack spacing={0} align="stretch">
            {nestedReplies.map((nestedReply: Discussion) => (
              <CommentItem
                key={nestedReply.permlink}
                comment={nestedReply}
                depth={depth + 1}
              />
            ))}
          </VStack>
        )}
      </Box>
    );
  };

  // Mobile Instagram-style component (now used for both mobile and miniapp)
  const SmallScreenConversation = () => (
    <Box
      bg={"background"}
      color={textColor}
      h="100%"
      position="relative"
      borderTopRadius="20px"
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Box
        position="sticky"
        top={0}
        zIndex={10}
        borderBottom="1px solid"
        borderColor={borderColor}
        p={4}
        backdropFilter="blur(10px)"
        bg="background"
        borderTopRadius="20px"
        flexShrink={0}
      >
        {/* Handle bar */}
        <Box
          w="40px"
          h="4px"
          bg="gray.600"
          borderRadius="2px"
          mx="auto"
          mb={4}
        />
        <HStack spacing={4} align="center">
          <IconButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBackClick();
            }}
            variant="ghost"
            aria-label="Go back to feed"
            icon={<ArrowBackIcon />}
            color={mobileTextColor}
            _hover={{ bg: "gray.800" }}
            _active={{ bg: "gray.700" }}
            size="md"
            minW="44px"
            h="44px"
            autoFocus={false}
          />
          <Text
            fontSize="lg"
            fontWeight="semibold"
            flex={1}
            textAlign="center"
            color={mobileTextColor}
            as="h1"
            role="heading"
            aria-level={1}
          >
            Comments
          </Text>
          <Box w="44px" aria-hidden="true" />{" "}
          {/* Spacer for center alignment */}
        </HStack>
      </Box>

      {/* Comments List - Scrollable */}
      <Box
        flex={1}
        overflowY="auto"
        overflowX="hidden"
        pb="120px" // Space for emoji bar and input
        px={4}
        minH={0} // Important for flex child scrolling
        css={{
          touchAction: "auto",
          WebkitOverflowScrolling: "touch",
          "&::-webkit-scrollbar": {
            width: "4px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "background",
            borderRadius: "2px",
          },
        }}
      >
        {isLoading ? (
          // Loading skeleton for comments
          <VStack spacing={4} py={4}>
            {Array.from({ length: 3 }).map((_, index) => (
              <HStack key={index} spacing={3} align="start" w="100%">
                <SkeletonCircle size="8" />
                <VStack align="start" spacing={2} flex={1}>
                  <Skeleton height="16px" width="120px" />
                  <SkeletonText mt={2} noOfLines={2} spacing={2} />
                </VStack>
              </HStack>
            ))}
          </VStack>
        ) : hasComments ? (
          <VStack spacing={0} align="stretch" w="100%" minH={0}>
            {allComments.map((comment: Discussion) => (
              <CommentItem key={comment.permlink} comment={comment} depth={0} />
            ))}
          </VStack>
        ) : (
          // Empty state for no comments
          <Box py={20} textAlign="center" color="gray.500">
            <Text fontSize="lg" mb={2}>
              No comments yet
            </Text>
            <Text fontSize="sm">Be the first to share your thoughts!</Text>
          </Box>
        )}
      </Box>

      {/* Emoji Reaction Bar */}
      <Box
        position="absolute"
        bottom="60px"
        left={0}
        right={0}
        bg="background"
        borderTop="1px solid"
        borderColor={"muted"}
        p={3}
        zIndex={5}
        backdropFilter="blur(10px)"
        flexShrink={0}
      >
        <HStack justify="center" spacing={3} overflowX="auto" pb={2}>
          {EMOJI_REACTIONS.map((emoji, index) => (
            <Tooltip key={index} label={`Add ${emoji}`} placement="top">
              <Button
                variant="ghost"
                p={2}
                minW="40px"
                h="40px"
                borderRadius="full"
                _hover={{ bg: "gray.800", transform: "scale(1.2)" }}
                _active={{ bg: "gray.700", transform: "scale(0.9)" }}
                transition="all 0.2s"
                tabIndex={-1}
                onClick={(e) => {
                  e.preventDefault();
                  handleEmojiClick(emoji);
                }}
                isDisabled={isSubmitting}
              >
                <Text fontSize="20px">{emoji}</Text>
              </Button>
            </Tooltip>
          ))}
        </HStack>
      </Box>

      {/* Bottom Input */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        bg="background"
        borderTop="1px solid"
        borderColor={"muted"}
        p={4}
        zIndex={10}
        backdropFilter="blur(10px)"
        flexShrink={0}
      >
        <HStack spacing={3} align="end">
          <Avatar
            size="sm"
            name={user || "guest"}
            src={
              user ? `https://images.hive.blog/u/${user}/avatar/sm` : undefined
            }
            loading="lazy"
          />
          <Box flex={1} position="relative">
            <Input
              ref={inputRef}
              placeholder={
                user ? "Add a comment..." : "Please log in to comment"
              }
              variant="unstyled"
              color={mobileTextColor}
              _placeholder={{ color: "gray.500" }}
              fontSize="sm"
              borderRadius="20px"
              bg="gray.800"
              px={4}
              py={3}
              minH="40px"
              value={commentText}
              onChange={(e) => handleCommentChange(e.target.value)}
              _focus={{ bg: "gray.700", outline: "none", boxShadow: "none" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleCommentSubmit();
                }
              }}
              disabled={!user || isSubmitting}
              autoComplete="off"
              spellCheck="false"
              maxLength={500}
            />
            {/* Character counter */}
            {commentText.length > 400 && (
              <Text
                position="absolute"
                bottom="-20px"
                right="8px"
                fontSize="xs"
                color={commentText.length >= 500 ? "red.400" : "gray.500"}
              >
                {commentText.length}/500
              </Text>
            )}
          </Box>
          {commentText.trim() && (
            <Button
              size="sm"
              colorScheme="blue"
              borderRadius="full"
              px={6}
              onClick={handleCommentSubmit}
              isLoading={isSubmitting}
              loadingText="Posting"
              disabled={!commentText.trim() || !user}
              _hover={{ transform: "scale(1.05)" }}
              _active={{ transform: "scale(0.95)" }}
            >
              Post
            </Button>
          )}
        </HStack>
      </Box>
    </Box>
  );

  // Desktop original component
  const DesktopConversation = () => (
    <Box bg="muted" p={4} mt={1} mb={1} borderRadius="base" boxShadow="lg">
      <HStack mb={4} spacing={2}>
        <Text fontSize="2xl" fontWeight="extrabold">
          Conversation
        </Text>
        <Button
          onClick={onBackClick}
          variant="ghost"
          ml="auto"
          aria-label="Close"
          _hover={{ bg: primaryColor + "20" }}
        >
          <CloseIcon color={primaryColor} />
        </Button>
      </HStack>
      <Snap
        discussion={{ ...discussion, depth: 0 } as any}
        onOpen={onOpen}
        setReply={setReply}
        setConversation={setConversation}
        onCommentAdded={handleCommentAdded}
      />
      <Divider my={4} />
      <Box mt={2}>
        <SnapComposer
          pa={discussion.author}
          pp={discussion.permlink}
          onNewComment={
            handleNewReply as (newComment: Partial<Discussion>) => void
          }
          onClose={() => {}}
          post
        />
      </Box>
      <Divider my={4} />
      <VStack spacing={2} align="stretch">
        {[...optimisticReplies, ...replies].map((reply: any) => (
          <Snap
            key={reply.permlink}
            discussion={reply}
            onOpen={onOpen}
            setReply={setReply}
          />
        ))}
      </VStack>
    </Box>
  );

  // For mobile and miniapp, use a full-screen Drawer that slides up from bottom like Instagram
  if (useSmallScreenUI) {
    return (
      <Drawer
        isOpen={isOpen}
        placement="bottom"
        onClose={onBackClick}
        size="full"
        closeOnOverlayClick={true}
        closeOnEsc={true}
      >
        <DrawerOverlay bg="blackAlpha.600" />
        <DrawerContent
          bg={"background"}
          color={textColor}
          borderTopRadius="20px"
          h="90vh"
          maxH="90vh"
          mt="10vh"
          boxShadow="0 -4px 20px rgba(0, 0, 0, 0.3)"
          overflow="hidden"
        >
          <SmallScreenConversation />
        </DrawerContent>
      </Drawer>
    );
  }

  // For desktop, return the original component
  return <DesktopConversation />;
};

export default Conversation;
