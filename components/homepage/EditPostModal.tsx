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
import markdownRenderer from "@/lib/markdown/MarkdownRenderer";

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={bgColor} borderColor={mutedColor}>
        <ModalHeader color={primaryColor}>Edit Post</ModalHeader>
        <ModalCloseButton
          color="red.500"
          bg="none"
          _hover={{
            bg: "none",
            color: "red.600",
          }}
          _active={{
            bg: "none",
            color: "red.700",
          }}
        />
        <ModalBody>
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
                dangerouslySetInnerHTML={{
                  __html: markdownRenderer(editedContent),
                }}
                sx={{
                  p: { marginBottom: "1rem", lineHeight: "1.6" },
                  color: primaryColor,
                }}
              />
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter borderTopColor={mutedColor}>
          <Button
            variant="ghost"
            mr={3}
            onClick={onClose}
            disabled={isSaving}
            color="red.500"
            bg="none"
            _hover={{
              bg: "none",
              color: "red.600",
            }}
            _active={{
              bg: "none",
              color: "red.700",
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
            _hover={{ bg: primaryColor, color: mutedColor }}
            _active={{ bg: primaryColor }}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditPostModal;
