import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  VStack,
  IconButton,
  useClipboard,
  HStack,
  Center,
  ModalFooter,
} from "@chakra-ui/react";
import { FaFacebook, FaTwitter, FaLink, FaGlasses } from "react-icons/fa";
import { MdCastConnected } from "react-icons/md"; // Example icon for Farcaster

interface SocialMediaShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  comment: { author: string; permlink: string };
}

const SocialMediaShareModal = ({
  isOpen,
  onClose,
  comment,
}: SocialMediaShareModalProps) => {
  // Validate permlink to prevent [object Object] URLs
  if (typeof comment.permlink !== "string") {
    console.error(
      "🚨 SocialMediaShareModal: Invalid permlink type:",
      typeof comment.permlink
    );
    return null; // Prevent rendering with invalid data
  }

  const postLink = `${window.location.origin}/post/${comment.author}/${comment.permlink}`;
  const { onCopy } = useClipboard(postLink);

  const handleShare = (platform: string) => {
    let shareUrl = "";
    if (platform === "facebook") {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        postLink
      )}`;
    } else if (platform === "x") {
      shareUrl = `https://twitter.com/intent/Snap?url=${encodeURIComponent(
        postLink
      )}`;
    } else if (platform === "farcaster") {
      shareUrl = `https://warpcast.com/share?text=${encodeURIComponent(
        postLink
      )}`; // Hypothetical URL
    }
    if (platform !== "copy") {
      window.open(shareUrl, "_blank");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent bg={"background"}>
        <ModalHeader>Share Post</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Center>
            <HStack spacing={4}>
              <IconButton
                aria-label="Share on Facebook"
                icon={<FaFacebook />}
                onClick={() => handleShare("facebook")}
                colorScheme="primary"
                isRound
              />
              <IconButton
                aria-label="Share on X"
                icon={<FaTwitter />}
                onClick={() => handleShare("x")}
                colorScheme="secondary"
                isRound
              />
              <IconButton
                aria-label="Share on Farcaster"
                icon={<FaGlasses />}
                onClick={() => handleShare("farcaster")}
                colorScheme="accent"
                isRound
              />
              <IconButton
                aria-label="Copy URL"
                icon={<FaLink />}
                onClick={() => {
                  onCopy();
                  alert("URL copied to clipboard!");
                }}
                colorScheme="primary"
                isRound
              />
            </HStack>
          </Center>
        </ModalBody>
        <ModalFooter></ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SocialMediaShareModal;
