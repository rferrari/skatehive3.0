import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  HStack,
  Avatar,
  Link,
  IconButton,
  Box,
  Text,
} from "@chakra-ui/react";
import React from "react";
import SnapComposer from "./SnapComposer";
import { Discussion } from "@hiveio/dhive";
import { CloseIcon } from "@chakra-ui/icons";
import markdownRenderer from "@/lib/utils/MarkdownRenderer";
import { getPostDate } from "@/lib/utils/GetPostDate";

interface SnapReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  discussion?: Discussion;
  onNewReply: (newComment: Partial<Discussion>) => void;
}

export default function SnapReplyModal({
  isOpen,
  onClose,
  discussion,
  onNewReply,
}: SnapReplyModalProps) {
  if (!discussion) {
    return <div></div>;
  }

  const commentDate = getPostDate(discussion.created);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay bg="rgba(0, 0, 0, 0.6)" backdropFilter="blur(10px)" />
      <ModalContent bg="background" color="text" position="relative">
        <IconButton
          aria-label="Close"
          icon={<CloseIcon />}
          onClick={onClose}
          position="absolute"
          top={2}
          right={2}
          variant="unstyled"
          size="lg"
        />
        <ModalHeader>
          <HStack mb={2}>
            <Avatar
              size="sm"
              name={discussion.author}
              src={`https://images.hive.blog/u/${discussion.author}/avatar/sm`}
            />
            <Box ml={3}>
              <Text fontWeight="medium" fontSize="sm">
                <Link href={`/user/${discussion.author}`}>
                  @{discussion.author}
                </Link>
              </Text>
              <Text fontWeight="medium" fontSize="sm" color="primary">
                {commentDate}
              </Text>
            </Box>
          </HStack>
        </ModalHeader>
        <ModalBody>
          <Box
            dangerouslySetInnerHTML={{
              __html: markdownRenderer(discussion.body),
            }}
            pb={6}
          />
          <SnapComposer
            pa={discussion.author}
            pp={discussion.permlink}
            onNewComment={onNewReply}
            post={true}
            onClose={onClose}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
