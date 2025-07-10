"use client";
import React from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    IconButton,
} from "@chakra-ui/react";
import { ArrowBackIcon } from '@chakra-ui/icons';
import Magazine from "../shared/Magazine";

interface MagazineModalProps {
    isOpen: boolean;
    onClose: () => void;
    username: string;
}

export default function MagazineModal({ isOpen, onClose, username }: MagazineModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="full" motionPreset="none">
            <ModalOverlay />
            <ModalContent p={0} m={0} maxW="100vw" maxH="100vh" borderRadius={0} overflow="hidden" bg="background" position="relative">
                <IconButton
                    aria-label="Back"
                    icon={<ArrowBackIcon />}
                    position="absolute"
                    top={4}
                    left={4}
                    zIndex={10}
                    onClick={onClose}
                    bg="background"
                    color="primary"
                    _hover={{ bg: "muted" }}
                    size="lg"
                />
                <Magazine tag={[{ tag: username, limit: 30 }]} query="created" />
            </ModalContent>
        </Modal>
    );
}
