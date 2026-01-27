"use client";

import { InfoIcon } from "@chakra-ui/icons";
import {
  Box,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react";
import { useMemo } from "react";
import { useTranslations } from "@/lib/i18n/hooks";

interface ProfileDebugControlProps {
  payload?: Record<string, any> | null;
}

export default function ProfileDebugControl({
  payload,
}: ProfileDebugControlProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const t = useTranslations("profileDebug");
  const json = useMemo(
    () => {
      if (!payload) return "";
      try {
        return JSON.stringify(payload, null, 2);
      } catch {
        return "[Error: Unable to serialize payload]";
      }
    },
    [payload]
  );

  return (
    <>
      <Tooltip label={t("open")} placement="top">
        <IconButton
          aria-label={t("open")}
          icon={<InfoIcon />}
          size="xs"
          variant="ghost"
          color="primary"
          borderRadius="none"
          border="1px solid"
          borderColor="whiteAlpha.300"
          bg="whiteAlpha.200"
          _hover={{ borderColor: "primary", bg: "whiteAlpha.300" }}
          onClick={onOpen}
        />
      </Tooltip>

      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent bg="background" color="text">
          <ModalHeader>{t("title")}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {json ? (
              <Box
                as="pre"
                fontSize="sm"
                whiteSpace="pre-wrap"
                wordBreak="break-word"
                bg="panel"
                border="1px solid"
                borderColor="border"
                borderRadius="md"
                p={4}
                maxH="60vh"
                overflow="auto"
              >
                {json}
              </Box>
            ) : (
              <Box color="dim" fontSize="sm">
                {t("empty")}
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
