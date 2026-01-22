import {
  Button,
  Text,
  VStack,
  HStack,
  Box,
  Icon,
} from "@chakra-ui/react";
import { FaBookOpen, FaTrophy, FaCoins } from "react-icons/fa";
import { useState } from "react";
import MagazineModal from "./MagazineModal";
import { HIVE_CONFIG } from "@/config/app.config";
import SkateModal from "./SkateModal";

interface SkateHiveMagazineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SkateHiveMagazineModal({
  isOpen,
  onClose,
}: SkateHiveMagazineModalProps) {
  const [isMagazineOpen, setIsMagazineOpen] = useState(false);

  const handleOpenMagazine = () => {
    setIsMagazineOpen(true);
    onClose();
  };

  const handleCloseMagazine = () => {
    setIsMagazineOpen(false);
  };

  const communityTag = HIVE_CONFIG.COMMUNITY_TAG;
  const magazineTag = [{ tag: communityTag, limit: 20 }]; // Bridge API max limit is 20
  const magazineQuery = "trending";

  return (
    <>
      <SkateModal
        isOpen={isOpen}
        onClose={onClose}
        title="SkateHive Magazine: Infinity Mag"
        size="lg"
        footer={
          <Button
            colorScheme="green"
            size="lg"
            onClick={handleOpenMagazine}
            leftIcon={<Icon as={FaBookOpen} />}
            w="full"
          >
            View Infinity Mag
          </Button>
        }
      >
        <Box p={6}>
          <VStack spacing={6} align="stretch">
            <Text
              fontSize="md"
              color="text"
              textAlign="center"
              lineHeight="tall"
            >
              The Skatehive App is more than just a platform; it&apos;s a
              digital skateboard magazine where skaters contribute to the
              pages of its Infinity Mag. Each post, trick clip, or story
              shared becomes part of a living, evolving publication created
              entirely by skaters, for skaters.
            </Text>

            <VStack spacing={4} align="stretch">
              <HStack spacing={4} align="center">
                <Icon as={FaBookOpen} color="blue.500" boxSize={6} />
                <Box flex={1}>
                  <Text fontWeight="bold" color="primary">
                    Made by Skaters
                  </Text>
                  <Text fontSize="sm" color="dim">
                    Every piece of content is created by the skateboarding
                    community
                  </Text>
                </Box>
              </HStack>

              <HStack spacing={4} align="center">
                <Icon as={FaTrophy} color="orange.500" boxSize={6} />
                <Box flex={1}>
                  <Text fontWeight="bold" color="primary">
                    Curated by Skaters
                  </Text>
                  <Text fontSize="sm" color="dim">
                    Community votes and engagement determine what gets
                    featured
                  </Text>
                </Box>
              </HStack>

              <HStack spacing={4} align="center">
                <Icon as={FaCoins} color="yellow.500" boxSize={6} />
                <Box flex={1}>
                  <Text fontWeight="bold" color="primary">
                    Monetized by Page
                  </Text>
                  <Text fontSize="sm" color="dim">
                    Contributors earn rewards for their content and engagement
                  </Text>
                </Box>
              </HStack>
            </VStack>
          </VStack>
        </Box>
      </SkateModal>

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
