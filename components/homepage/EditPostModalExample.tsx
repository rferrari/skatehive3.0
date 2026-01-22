"use client";
import React from "react";
import {
  Button,
  Textarea,
  VStack,
  Box,
  Text,
  useToken,
} from "@chakra-ui/react";
import { Discussion } from "@hiveio/dhive";
import { EnhancedMarkdownRenderer } from "@/components/markdown/EnhancedMarkdownRenderer";
import useIsMobile from "@/hooks/useIsMobile";
import SkateModal from "@/components/shared/SkateModal";

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  discussion: Discussion;
  editedContent: string;
  setEditedContent: (content: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

const EditPostModal = ({
  isOpen,
  onClose,
  discussion,
  editedContent,
  setEditedContent,
  onSave,
  isSaving,
}: EditPostModalProps) => {
  const isMobile = useIsMobile();
  const [accentColor] = useToken("colors", ["accent"]);

  return (
    <SkateModal
      isOpen={isOpen}
      onClose={onClose}
      title="edit-post"
      size={isMobile ? "full" : "xl"}
      footer={
        <VStack spacing={3} align="stretch">
          <Button
            onClick={onSave}
            isLoading={isSaving}
            loadingText="Saving..."
            bg="primary"
            color="background"
            _hover={{ bg: "accent" }}
            width="full"
          >
            Save Changes
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            borderColor="muted"
            width="full"
          >
            Cancel
          </Button>
        </VStack>
      }
    >
      <Box p={4}>
        <VStack spacing={4} align="stretch">
          <Box>
            <Text color="primary" fontSize="sm" mb={2}>
              Original Author: <strong>{discussion.author}</strong>
            </Text>
            <Text color="primary" fontSize="sm">
              Permlink: <strong>{discussion.permlink}</strong>
            </Text>
          </Box>

          {/* Editor Section */}
          <Box>
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Edit your post content..."
              size="lg"
              minH="200px"
              bg="inputBg"
              color="inputText"
              borderColor="inputBorder"
              _focus={{
                borderColor: "accent",
                boxShadow: `0 0 0 1px ${accentColor}`,
              }}
              fontFamily="mono"
            />
          </Box>

          {/* Preview Section */}
          {editedContent && (
            <Box>
              <Text color="primary" fontWeight="semibold" mb={2}>
                Preview:
              </Text>
              <Box
                bg="panel"
                border="1px solid"
                borderColor="border"
                borderRadius="md"
                p={4}
                maxH="300px"
                overflowY="auto"
              >
                <EnhancedMarkdownRenderer content={editedContent} />
              </Box>
            </Box>
          )}
        </VStack>
      </Box>
    </SkateModal>
  );
};

export default EditPostModal;