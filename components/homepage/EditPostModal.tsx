import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
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
  const bgColor = useColorModeValue("background", "background");
  const primaryColor = useColorModeValue("primary", "primary");
  const mutedColor = useColorModeValue("muted", "muted");
  const secondaryColor = useColorModeValue("secondary", "secondary");
  const errorColor = useColorModeValue("error", "error");
  const isMobile = useIsMobile();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={isMobile ? "full" : "xl"}>
      <ModalOverlay />
      <ModalContent
        bg={bgColor}
        borderColor={mutedColor}
        h={isMobile ? "100vh" : "auto"}
        borderRadius={isMobile ? "0" : "md"}
        display="flex"
        flexDirection="column"
      >
        <ModalHeader color={primaryColor} flexShrink={0}>
          Edit Post
        </ModalHeader>
        <ModalCloseButton
          color={errorColor}
          bg="none"
          _hover={{
            bg: "none",
            color: errorColor,
          }}
          _active={{
            bg: "none",
            color: errorColor,
          }}
        />
        <ModalBody flex="1" overflowY="auto">
          <VStack spacing={4}>
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Edit your post content..."
              minHeight="300px"
              resize="vertical"
              bg={bgColor}
              borderColor={mutedColor}
              color={primaryColor}
              fontSize={isMobile ? "16px" : "md"}
              _placeholder={{ color: mutedColor }}
              _focus={{ borderColor: secondaryColor }}
            />
            <Box
              width="100%"
              p={4}
              bg={mutedColor}
              borderRadius="md"
              border="1px solid"
              borderColor={mutedColor}
            >
              <Text fontSize="sm" fontWeight="bold" mb={2} color={primaryColor}>
                Preview:
              </Text>
              <Box
                sx={{
                  p: { marginBottom: "1rem", lineHeight: "1.6" },
                  color: primaryColor,
                }}
              >
                <EnhancedMarkdownRenderer content={editedContent} />
              </Box>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter
          borderTopColor={mutedColor}
          flexShrink={0}
          pb={isMobile ? "calc(1.5rem + env(safe-area-inset-bottom))" : 4}
        >
          <Button
            variant="ghost"
            mr={3}
            onClick={onClose}
            disabled={isSaving}
            color={errorColor}
            bg="none"
            _hover={{
              bg: "none",
              color: errorColor,
            }}
            _active={{
              bg: "none",
              color: errorColor,
            }}
          >
            Cancel
          </Button>
          <Button
            bg={secondaryColor}
            color={primaryColor}
            onClick={onSave}
            isLoading={isSaving}
            loadingText="Saving..."
            _hover={{ bg: primaryColor, color: bgColor }}
            _active={{ bg: primaryColor, color: bgColor }}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditPostModal;
