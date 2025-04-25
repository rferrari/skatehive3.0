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
        border={isNew ? "tb1" : "gray"}
        borderRadius="base"
        bg="muted"
        w="full"
        align="stretch"
      >
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
          {parentPost && (
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
                    {/* Only show post content for non-reblog notifications */}
                    {notification.type !== "reblog" && (
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
                    )}
                  </>
                )}
              </VStack>
            </>
          )}
          <HStack spacing={2} mt={2} justifyContent={"flex-start"}>
            <Text fontSize="xs" color={isNew ? "accent" : "primary"} mt={1}>
              {formattedDate}
            </Text>
            <Link href={"/" + notification.url} isExternal>
              <IconButton
                aria-label="Open notification"
                icon={<ExternalLinkIcon />}
                variant="ghost"
                size="sm"
                isRound
                alignSelf="center"
                color={isNew ? "accent" : "primary"}
              />
            </Link>
            {(notification.type === "reply" ||
              notification.type === "reply_comment") && (
              <HStack>
                <Text onClick={handleReplyClick} fontSize="sm" cursor="pointer">
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
              </HStack>
            )}
          </HStack>
        </Box>
        {notification.type === "reply" && magPostThumbnail && (
          <Image
            src={magPostThumbnail}
            alt="Post thumbnail"
            h="100%"
            w="20%"
            objectFit="cover"
            borderRadius="md"
            flexShrink={0}
          />
        )}
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
