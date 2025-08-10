import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  HStack,
  Box,
  useColorModeValue,
  Icon,
} from "@chakra-ui/react";
import { FaBookOpen, FaTrophy, FaCoins } from "react-icons/fa";
import { useState } from "react";
import MagazineModal from "./MagazineModal";

interface SkateHiveMagazineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SkateHiveMagazineModal({
  isOpen,
  onClose,
}: SkateHiveMagazineModalProps) {
  const [isMagazineOpen, setIsMagazineOpen] = useState(false);

  const borderColor = useColorModeValue("gray.200", "gray.600");
  const accentColor = useColorModeValue("green.500", "green.300");
  const textColor = useColorModeValue("gray.700", "gray.200");

  const handleOpenMagazine = () => {
    setIsMagazineOpen(true);
    onClose();
  };

  const handleCloseMagazine = () => {
    setIsMagazineOpen(false);
  };

  const communityTag =
    process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG || "hive-173115";
  const magazineTag = [{ tag: communityTag, limit: 30 }];
  const magazineQuery = "trending";

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
        <ModalContent
          bg="background"
          border="1px solid"
          borderColor={borderColor}
          borderRadius="xl"
          boxShadow="2xl"
        >
          <ModalHeader
            textAlign="center"
            fontSize="2xl"
            fontWeight="bold"
            color={accentColor}
            pb={2}
          >
            📖 SkateHive Magazine: &ldquo;Infinity Mag&rdquo;
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody pb={6}>
            <VStack spacing={6} align="stretch">
              <Text
                fontSize="md"
                color={textColor}
                textAlign="center"
                lineHeight="tall"
              >
                The Skatehive App is more than just a platform; it&apos;s a digital
                skateboard magazine where skaters contribute to the pages of its
                Infinity Mag. Each post, trick clip, or story shared becomes
                part of a living, evolving publication created entirely by
                skaters, for skaters.
              </Text>

              <VStack spacing={4} align="stretch">
                <HStack spacing={4} align="center">
                  <Icon as={FaBookOpen} color="blue.500" boxSize={6} />
                  <Box flex={1}>
                    <Text fontWeight="bold" color={accentColor}>
                      Made by Skaters
                    </Text>
                    <Text fontSize="sm" color={textColor}>
                      Every piece of content is created by the skateboarding
                      community
                    </Text>
                  </Box>
                </HStack>

                <HStack spacing={4} align="center">
                  <Icon as={FaTrophy} color="orange.500" boxSize={6} />
                  <Box flex={1}>
                    <Text fontWeight="bold" color={accentColor}>
                      Curated by Skaters
                    </Text>
                    <Text fontSize="sm" color={textColor}>
                      Community votes and engagement determine what gets
                      featured
                    </Text>
                  </Box>
                </HStack>

                <HStack spacing={4} align="center">
                  <Icon as={FaCoins} color="yellow.500" boxSize={6} />
                  <Box flex={1}>
                    <Text fontWeight="bold" color={accentColor}>
                      Monetized by Page
                    </Text>
                    <Text fontSize="sm" color={textColor}>
                      Contributors earn rewards for their content and engagement
                    </Text>
                  </Box>
                </HStack>
              </VStack>
            </VStack>
          </ModalBody>

          <ModalFooter justifyContent="center">
            <Button
              colorScheme="green"
              size="lg"
              onClick={handleOpenMagazine}
              leftIcon={<Icon as={FaBookOpen} />}
            >
              View Infinity Mag
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Magazine Modal */}
      <MagazineModal
        isOpen={isMagazineOpen}
        onClose={handleCloseMagazine}
        magazineTag={magazineTag}
        magazineQuery={magazineQuery}
      />
    </>
  );
}
