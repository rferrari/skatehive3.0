import {
  Button,
  Textarea,
  VStack,
  Box,
  Text,
  useColorModeValue,
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
  const secondaryColor = useColorModeValue("secondary", "secondary");
  const errorColor = useColorModeValue("error", "error");
  const isMobile = useIsMobile();

  return (
    <SkateModal
      isOpen={isOpen}
      onClose={onClose}
      title="edit-post"
      size={isMobile ? "full" : "xl"}
      footer={
        <VStack spacing={3} align="stretch">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSaving}
            color={errorColor}
            bg="transparent"
            _hover={{
              bg: "transparent",
              color: errorColor,
            }}
            _active={{
              bg: "transparent",
              color: errorColor,
            }}
          >
            Cancel
          </Button>
          <Button
            bg={secondaryColor}
            onClick={onSave}
            isLoading={isSaving}
            loadingText="Saving..."
            _hover={{ bg: "primary" }}
            width="full"
          >
            Save Changes
          </Button>
        </VStack>
      }
    >
      <Box p={4}>
        <VStack spacing={4} align="stretch">
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder="Edit your post content..."
            minHeight="300px"
            resize="vertical"
            bg="inputBg"
            borderColor="inputBorder"
            color="inputText"
            fontSize={isMobile ? "16px" : "md"}
            _placeholder={{ color: "inputPlaceholder" }}
            _focus={{ borderColor: "accent" }}
          />
          <Box
            width="100%"
            p={4}
            bg="panel"
            borderRadius="md"
            border="1px solid"
            borderColor="border"
          >
            <Text fontSize="sm" fontWeight="bold" mb={2} color="primary">
              Preview:
            </Text>
            <Box
              sx={{
                p: { marginBottom: "1rem", lineHeight: "1.6" },
                color: "text",
              }}
            >
              <EnhancedMarkdownRenderer content={editedContent} />
            </Box>
          </Box>
        </VStack>
      </Box>
    </SkateModal>
  );
};

export default EditPostModal;
