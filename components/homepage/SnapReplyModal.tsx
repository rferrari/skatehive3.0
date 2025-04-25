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
  Discussion?: Discussion;
  onNewReply: (newComment: Partial<Discussion>) => void;
}

export default function SnapReplyModal({
  isOpen,
  onClose,
  Discussion,
  onNewReply,
}: SnapReplyModalProps) {
  if (!Discussion) {
    return <div></div>;
  }

  const commentDate = getPostDate(Discussion.created);

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
              name={Discussion.author}
              src={`https://images.hive.blog/u/${Discussion.author}/avatar/sm`}
            />
            <Box ml={3}>
              <Text fontWeight="medium" fontSize="sm">
                <Link href={`/@${Discussion.author}`}>
                  @{Discussion.author}
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
              __html: markdownRenderer(Discussion.body),
            }}
            pb={6}
          />
          <SnapComposer
            pa={Discussion.author}
            pp={Discussion.permlink}
            onNewComment={onNewReply}
            post={true}
            onClose={onClose}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
