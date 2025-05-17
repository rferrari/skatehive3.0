import {
  Box,
  Avatar,
  Text,
  HStack,
  IconButton,
  Link,
  Image,
  VStack,
  Divider,
  Button,
  Skeleton,
  Flex,
} from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Discussion, Notifications } from "@hiveio/dhive";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useState, useEffect, useRef } from "react";
import {
  getPost,
  checkFollow,
  changeFollow,
  vote,
} from "../../lib/hive/client-functions";
import SnapComposer from "../homepage/SnapComposer";

interface NotificationItemProps {
  notification: Notifications;
  lastReadDate: string;
  currentUser: string; // Added currentUser prop
}

export default function NotificationItem({
  notification,
  lastReadDate,
  currentUser,
}: NotificationItemProps) {
  const author = notification.msg.trim().replace(/^@/, "").split(" ")[0];
  const [displayCommentPrompt, setDisplayCommentPrompt] =
    useState<boolean>(false);
  const [postContent, setPostContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const formattedDate = new Date(notification.date + "Z").toLocaleString(
    "en-US",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }
  );

  const notificationDateStr = notification.date.endsWith("Z")
    ? notification.date
    : `${notification.date}Z`;
  const notificationDate = new Date(notificationDateStr);
  const lastRead = new Date(lastReadDate);
  const isNew = notificationDate > lastRead;
  const [rawPostAuthor, postId] = notification.url.split("/");
  const postAuthor = rawPostAuthor.replace(/^@/, "");
  const [parentPost, setParentPost] = useState<Discussion | null>(null);
  const [magPostThumbnail, setMagPostThumbnail] = useState<string>("");
  const [reply, setReply] = useState<Discussion | null>(null);
  const [originalApp, setOriginalApp] = useState<string>("");
  const [isFollowingBack, setIsFollowingBack] = useState<boolean>(false);

  // Add a cache for posts
  const postCache = useRef<Record<string, Discussion>>({});

  // Add helper to fetch comment content
  async function fetchCommentContent() {
    try {
      setIsLoading(true);
      const replyKey = `${postAuthor}_${postId}`;
      let post: Discussion;
      if (postCache.current[replyKey]) {
        post = postCache.current[replyKey];
      } else {
        post = await getPost(postAuthor, postId);
        postCache.current[replyKey] = post;
      }
      setReply(post);

      // Check if user has voted on this post
      setHasVoted(checkIfUserVoted(post));

      // Set the post content regardless of type
      setPostContent(post.body || "No content available");

      if (
        notification.type === "reply" ||
        notification.type === "reply_comment" ||
        notification.type === "mention" ||
        notification.type === "vote" ||
        notification.type === "reblog"
      ) {
        // Check if it's a comment (has parent_author) or a root post
        if (post.parent_author && post.parent_permlink) {
          // It's a comment - fetch its parent
          const parentKey = `${post.parent_author}_${post.parent_permlink}`;
          let parentPostData: Discussion;
          if (postCache.current[parentKey]) {
            parentPostData = postCache.current[parentKey];
          } else {
            parentPostData = await getPost(
              post.parent_author,
              post.parent_permlink
            );
            postCache.current[parentKey] = parentPostData;
          }
          setParentPost(parentPostData);
          console.log("Fetched parent post:", parentPostData);

          // Get metadata from parent post
          try {
            const post_metadata =
              parentPostData && parentPostData.json_metadata
                ? JSON.parse(parentPostData.json_metadata)
                : {};
            if (
              post_metadata &&
              post_metadata.image &&
              post_metadata.image.length > 0
            ) {
              setMagPostThumbnail(post_metadata.image[0]);
              setOriginalApp(post_metadata.app || "");
            } else {
              setMagPostThumbnail(
                "https://images.hive.blog/u/" + post.author + "/avatar"
              );
            }
          } catch (err) {
            console.error("Error parsing parent post metadata:", err);
            setMagPostThumbnail(
              "https://images.hive.blog/u/" + post.author + "/avatar"
            );
          }
        } else {
          // It's a root post - use the post itself as "parent"
          setParentPost(post);
          console.log("Using root post as parent:", post);

          // Get metadata from the post itself
          try {
            const post_metadata = post.json_metadata
              ? JSON.parse(post.json_metadata)
              : {};
            if (
              post_metadata &&
              post_metadata.image &&
              post_metadata.image.length > 0
            ) {
              setMagPostThumbnail(post_metadata.image[0]);
              setOriginalApp(post_metadata.app || "");
            } else {
              setMagPostThumbnail(
                "https://images.hive.blog/u/" + post.author + "/avatar"
              );
            }
          } catch (err) {
            console.error("Error parsing post metadata:", err);
            setMagPostThumbnail(
              "https://images.hive.blog/u/" + post.author + "/avatar"
            );
          }
        }
      }
    } catch (error) {
      setPostContent("Error loading content");
      console.error("Error in fetchCommentContent:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Replace the existing handleReplyClick with this version
  function handleReplyClick() {
    if (!displayCommentPrompt) {
      setDisplayCommentPrompt(true);
      fetchCommentContent();
      window.dispatchEvent(
        new CustomEvent("activeComposerChange", { detail: notification.url })
      );
    } else {
      setDisplayCommentPrompt(false);
      // Optionally dispatch a null detail if needed; others remain closed anyway.
      window.dispatchEvent(
        new CustomEvent("activeComposerChange", { detail: null })
      );
    }
  }

  // Add a global listener to collapse this composer when another is opened
  useEffect(() => {
    function handleActiveComposerChange(e: CustomEvent) {
      if (e.detail && e.detail !== notification.url) {
        setDisplayCommentPrompt(false);
      }
    }
    window.addEventListener(
      "activeComposerChange",
      handleActiveComposerChange as EventListener
    );
    return () => {
      window.removeEventListener(
        "activeComposerChange",
        handleActiveComposerChange as EventListener
      );
    };
  }, [notification.url]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Use IntersectionObserver to lazy load comment/parent content when visible
  useEffect(() => {
    if (
      ["reply", "reply_comment", "mention", "vote", "reblog"].includes(
        notification.type
      ) &&
      containerRef.current
    ) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              fetchCommentContent();
              observer.disconnect();
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [notification.type, notification.url]);

  // For follow notifications, check follow state on mount
  useEffect(() => {
    if (notification.type === "follow" && currentUser) {
      checkFollow(currentUser, author)
        .then((result: boolean) => setIsFollowingBack(result))
        .catch(() => setIsFollowingBack(false));
    }
  }, [notification.type, currentUser, author]);

  async function handleFollowBack() {
    await changeFollow(currentUser, author);
    setIsFollowingBack(true);
  }

  // Add helper to check if user has voted on the reply
  const checkIfUserVoted = (post: Discussion | null) => {
    if (!post || !post.active_votes || !currentUser) return false;

    return post.active_votes.some((vote) => vote.voter === currentUser);
  };

  // Handle upvote function
  const handleUpvote = async () => {
    if (!reply || !currentUser || isVoting) return;

    try {
      setIsVoting(true);

      const voteResult = await vote({
        username: currentUser,
        author: reply.author,
        permlink: reply.permlink,
        weight: hasVoted ? 0 : 10000, // Toggle between vote and unvote
      });

      if (voteResult && voteResult.success) {
        setHasVoted(!hasVoted);

        // Refresh the post to get updated vote data
        const updatedPost = await getPost(reply.author, reply.permlink);
        setReply(updatedPost);
      }
    } catch (error) {
      console.error("Voting error:", error);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div ref={containerRef}>
      <HStack
        spacing={3}
        p={3}
        bg="muted"
        w="full"
        align="stretch"
        position="relative"
        sx={isNew ? {
          boxShadow: '0 -1px 4px 0 #39ff14, 0 1px 4px 0 #39ff14',
          animation: 'pulseGlowTB 1.5s infinite',
        } : {}}
        _before={isNew ? {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '6px',
          background: 'linear-gradient(180deg, #39ff14 0%, #00ff99 100%)',
          boxShadow: '0 0 8px 2px #39ff14',
        } : {}}
      >
        <style>{`
          @keyframes pulseGlowTB {
            0% { box-shadow: 0 -1px 4px 0 #39ff14, 0 1px 4px 0 #39ff14; }
            50% { box-shadow: 0 -2px 8px 0 #39ff14, 0 2px 8px 0 #39ff14; }
            100% { box-shadow: 0 -1px 4px 0 #39ff14, 0 1px 4px 0 #39ff14; }
          }
        `}</style>
        <Box flex="1">
          <HStack>
            <Avatar
              src={`https://images.hive.blog/u/${author}/avatar/sm`}
              name=""
              size={"xs"}
            />
            {notification.type === "follow" ? (
              <HStack spacing={2}>
                <Text color={isNew ? "accent" : "primary"} fontSize="sm">
                  {notification.msg.replace(/^@/, "")}
                </Text>
                {isFollowingBack ? (
                  <Text fontSize="sm" color="primary">
                    Following
                  </Text>
                ) : (
                  <Button size="sm" onClick={handleFollowBack}>
                    Follow Back
                  </Button>
                )}
              </HStack>
            ) : notification.type === "vote" ? (
              <Box>
                <Text color={isNew ? "accent" : "primary"} fontSize="sm" display="flex" alignItems="center" flexWrap="wrap">
                  <Link href={`/@${author}`} color={isNew ? "accent" : "primary"} fontWeight="bold" _hover={{ textDecoration: 'underline' }}>
                    {notification.msg.replace(/^@/, "").split(' ')[0]}
                  </Link>
                  <Text as="span" ml={1}>upvoted your</Text>
                  <Link href={`/${notification.url}`} color={isNew ? "accent" : "primary"} fontWeight="bold" _hover={{ textDecoration: 'underline' }} ml={1}>
                    post
                  </Link>
                  {':'}
                  <Text as="span" color="green.300" fontWeight="bold" ml={1}>
                    {(() => {
                      const match = notification.msg.match(/\(([^)]+)\)/);
                      return match && match[1] ? `(${match[1]})` : "";
                    })()}
                  </Text>
                  <Text as="span" fontSize="xs" color="gray.400" ml={2}>
                    {formattedDate}
                  </Text>
                </Text>
                {reply && (
                  <Text fontSize="sm" color="primary">
                    {reply.title}
                  </Text>
                )}
              </Box>
            ) : notification.type === "reply_comment" ? (
              <Box>
                <Text color={isNew ? "accent" : "primary"} fontSize="sm" display="flex" alignItems="center" flexWrap="wrap">
                  <Link href={`/@${author}`} color={isNew ? "accent" : "primary"} fontWeight="bold" _hover={{ textDecoration: 'underline' }}>
                    {notification.msg.replace(/^@/, "").split(' ')[0]}
                  </Link>
                  <Text as="span" ml={1}>replied to your</Text>
                  <Link href={`/${notification.url}`} color={isNew ? "accent" : "primary"} fontWeight="bold" _hover={{ textDecoration: 'underline' }} ml={1}>
                    comment
                  </Link>
                  {':'}
                  {parentPost?.body &&
                    ` "${parentPost.body.replace(/\n/g, ' ').slice(0, 100)}${parentPost.body.length > 100 ? '…' : ''}"`}
                  <Text as="span" fontSize="xs" color="gray.400" ml={2}>
                    {formattedDate}
                  </Text>
                </Text>
                {reply && (
                  <Text fontSize="lg" color="green.300" mt={1}>
                    {postContent}
                  </Text>
                )}
              </Box>
            ) : notification.type === "mention" ? (
              <Box>
                <Text color={isNew ? "accent" : "primary"} fontSize="sm" display="flex" alignItems="center" flexWrap="wrap">
                  <Link href={`/@${author}`} color={isNew ? "accent" : "primary"} fontWeight="bold" _hover={{ textDecoration: 'underline' }}>
                    {notification.msg.replace(/^@/, "").split(' ')[0]}
                  </Link>
                  <Text as="span" ml={1}>mentioned you in</Text>
                  {parentPost?.title && (
                    <Link href={`/${notification.url}`} color={isNew ? "accent" : "primary"} fontWeight="bold" _hover={{ textDecoration: 'underline' }} ml={1}>
                      {parentPost.title}
                    </Link>
                  )}
                  {':'}
                  <Text as="span" fontSize="xs" color="gray.400" ml={2}>
                    {formattedDate}
                  </Text>
                </Text>
              </Box>
            ) : notification.type === "reply" ? (
              <Box>
                <Text color={isNew ? "accent" : "primary"} fontSize="sm" display="flex" alignItems="center" flexWrap="wrap">
                  <Link href={`/@${author}`} color={isNew ? "accent" : "primary"} fontWeight="bold" _hover={{ textDecoration: 'underline' }}>
                    {notification.msg.replace(/^@/, "").split(' ')[0]}
                  </Link>
                  <Text as="span" ml={1}>replied to your</Text>
                  <Link href={`/${notification.url}`} color={isNew ? "accent" : "primary"} fontWeight="bold" _hover={{ textDecoration: 'underline' }} ml={1}>
                    post
                  </Link>
                  {':'}
                  {parentPost?.title &&
                    ` "${parentPost.title.slice(0, 100)}${parentPost.title.length > 100 ? '…' : ''}"`}
                  <Text as="span" fontSize="xs" color="gray.400" ml={2}>
                    {formattedDate}
                  </Text>
                </Text>
                {reply && (
                  <Text fontSize="lg" color="green.300" mt={1}>
                    {postContent}
                  </Text>
                )}
              </Box>
            ) : (
              <Text
                color={isNew ? "accent" : "primary"}
                fontSize="sm"
                noOfLines={2}
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {notification.msg.replace(/^@/, "")} - {parentPost?.title}
                {(notification.type === "reply" ||
                  notification.type === "reply_comment") &&
                  ` using ${originalApp}`}
              </Text>
            )}
          </HStack>
          {/* Only show post summary for non-vote, non-reblog, non-reply, non-reply_comment, non-mention notifications */}
          {parentPost && !["vote", "reblog", "reply", "reply_comment", "mention"].includes(notification.type) && (
            <>
              <Divider my={2} />
              <VStack align="start" spacing={2} w="100%">
                {isLoading ? (
                  <>
                    <Skeleton height="20px" width="100%" />
                    <Skeleton height="20px" width="100%" />
                  </>
                ) : (
                  <>
                    <Text
                      fontSize="sm"
                      color="primary"
                      ml={5}
                      noOfLines={3}
                      overflow="hidden"
                      textOverflow="ellipsis"
                      w="90%"
                      wordBreak="break-word"
                    >
                      {postContent}
                    </Text>
                  </>
                )}
              </VStack>
            </>
          )}
          {/* Indent Reply and heart to align with main text, not all the way right */}
          {(notification.type === "reply" || notification.type === "reply_comment") && (
            <Flex mt={2} alignItems="center" w="100%" ml={8}>
              <Text onClick={handleReplyClick} fontSize="sm" cursor="pointer" mr={2}>
                Reply
              </Text>
              <IconButton
                aria-label={hasVoted ? "Unlike" : "Like"}
                icon={hasVoted ? <FaHeart /> : <FaRegHeart />}
                variant="ghost"
                size="sm"
                isRound
                alignSelf="center"
                color={hasVoted ? "red.500" : isNew ? "accent" : "primary"}
                onClick={handleUpvote}
                isLoading={isVoting}
              />
            </Flex>
          )}
        </Box>
        {/* No thumbnail for reply notifications */}
      </HStack>
      {displayCommentPrompt && (
        <SnapComposer
          pa={postAuthor}
          pp={postId}
          onNewComment={() => {}}
          onClose={() => null}
        />
      )}
    </div>
  );
}
