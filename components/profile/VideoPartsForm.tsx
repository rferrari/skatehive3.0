"use client";
import { HiveAccount } from "@/hooks/useHiveAccount";
import {
  Button,
  Center,
  FormControl,
  FormLabel,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  VStack,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { VideoPart } from "@/types/VideoPart";

interface VideoPartsFormProps {
  onNewVideoPart: (videoPart: VideoPart) => void;
  isOpen: boolean;
  onClose: () => void;
}

const VideoPartsForm = ({ onNewVideoPart, isOpen, onClose }: VideoPartsFormProps) => {
  const [videoPart, setVideoPart] = useState<VideoPart>({
    name: "",
    filmmaker: [""],
    friends: [""],
    year: new Date().getFullYear(),
    url: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof VideoPart) => {
    setVideoPart({
      ...videoPart,
      [field]: field === "filmmaker" || field === "friends" ? e.target.value.split(",") : e.target.value,
    });
  };

  const submitVideoPart = () => {
    onNewVideoPart(videoPart);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        color="white"
        bg="black"
        border="0.6px solid grey"
        maxWidth="container.lg" // Constrain to page width
      >
        <ModalHeader>
          <Center>Submit Video Part</Center>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <Image
              src="https://media.giphy.com/media/qTNIlLJNOwdNK/giphy.gif"
              alt="skateboard"
              boxSize={["100px", "200px"]}
              maxWidth="100%" // Prevent image from stretching modal
            />
            <FormControl>
              <FormLabel>Video Name</FormLabel>
              <Input
                value={videoPart.name}
                onChange={(e) => handleChange(e, "name")}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Filmmaker(s)</FormLabel>
              <Input
                value={videoPart.filmmaker.join(",")}
                onChange={(e) => handleChange(e, "filmmaker")}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Friends</FormLabel>
              <Input
                value={videoPart.friends.join(",")}
                onChange={(e) => handleChange(e, "friends")}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Year</FormLabel>
              <Input
                type="number"
                value={videoPart.year}
                onChange={(e) => handleChange(e, "year")}
              />
            </FormControl>
            <FormControl>
              <FormLabel>URL</FormLabel>
              <Input
                value={videoPart.url}
                onChange={(e) => handleChange(e, "url")}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button w="100%" colorScheme="green" mr={3} onClick={submitVideoPart}>
            Submit Video Part
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default VideoPartsForm;
