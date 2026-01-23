import { useState } from "react";
import {
  Box,
  Button,
  Input,
  Text,
  IconButton,
  Flex,
  Avatar,
  HStack,
  Center,
  VStack,
  Tooltip,
} from "@chakra-ui/react";
import { ArrowForwardIcon, LockIcon, ViewIcon } from "@chakra-ui/icons";
import useIsMobile from "@/hooks/useIsMobile";
import { HiveAccount } from "@/hooks/useHiveAccount";
import SkateModal from "@/components/shared/SkateModal";
import { useTranslations } from "@/contexts/LocaleContext";

interface HiveWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  showMemoField?: boolean;
  showUsernameField?: boolean; // New prop to show the username field
  hiveAccount?: HiveAccount | undefined;
  onConfirm: (
    amount: number,
    direction: "HIVE_TO_HBD" | "HBD_TO_HIVE",
    username?: string,
    memo?: string
  ) => void; // direction is now before optional params
}

export default function HiveWalletModal({
  isOpen,
  onClose,
  title,
  description,
  showMemoField = false,
  showUsernameField = false,
  hiveAccount,
  onConfirm,
}: HiveWalletModalProps) {
  const t = useTranslations();
  const [amount, setAmount] = useState<string>("");
  const [memo, setMemo] = useState<string>("");
  const [username, setUsername] = useState<string>(""); // State to hold username
  const [direction, setDirection] = useState<"HIVE_TO_HBD" | "HBD_TO_HIVE">(
    "HIVE_TO_HBD"
  );
  const [encryptMemo, setEncryptMemo] = useState<boolean>(false); // NEW

  const isMobile = useIsMobile();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleMemoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMemo(e.target.value);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value.trim().toLowerCase());
  };

  const toggleEncrypt = () => {
    setEncryptMemo((prev) => !prev);
  };

  const handleConfirm = () => {
    const parsedAmount = parseFloat(amount);
    onConfirm(
      isNaN(parsedAmount) ? 0 : parsedAmount,
      direction,
      showUsernameField ? username : undefined,
      // showMemoField ? memo : undefined
      showMemoField && memo
        ? encryptMemo
          ? `#${memo}`
          : memo
        : undefined
    );
  };

  return (
    <SkateModal
      isOpen={isOpen}
      onClose={onClose}
      title={title.toLowerCase().replace(/\s+/g, '-')}
      size={isMobile ? "full" : "md"}
      footer={
        <VStack spacing={3} align="stretch">
          <Button
            variant="ghost"
            onClick={onClose}
            color="primary"
            _hover={{ color: "background", bg: "primary" }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            color="background"
            bg="primary"
            _hover={{ bg: "accent" }}
            width="full"
          >
            {t('common.confirm')}
          </Button>
        </VStack>
      }
    >
      <Box p={4}>
        {description && (
          <Text fontSize={"small"} mb={4} color="primary">
            {description}
          </Text>
        )}
        {title.toLowerCase().includes("convert") && (
          <Flex mb={4} align="center" justify="center" gap={4}>
            <Text fontWeight="bold" fontSize="lg" color="primary">
              HIVE
            </Text>
            <IconButton
              aria-label={t('wallet.flipDirection')}
              icon={<ArrowForwardIcon />}
              onClick={() =>
                setDirection(
                  direction === "HIVE_TO_HBD" ? "HBD_TO_HIVE" : "HIVE_TO_HBD"
                )
              }
              variant="ghost"
              fontSize="2xl"
              color="primary"
              _hover={{ color: "background", bg: "primary" }}
              sx={{
                transition: "transform 0.3s",
                transform:
                  direction === "HIVE_TO_HBD"
                    ? "rotate(0deg)"
                    : "rotate(180deg)",
              }}
            />
            <Text fontWeight="bold" fontSize="lg" color="primary">
              HBD
            </Text>
          </Flex>
        )}

        {hiveAccount && (
          <VStack mb={4}>
            <Text mb={0} fontSize={"medium"} color="primary">
              {title.toLowerCase().includes("hive")
                ? String(hiveAccount.balance)
                : String(hiveAccount.hbd_balance)}</Text>
            <Text mt={0} fontSize={"small"} color="primary">{t('wallet.balance')}</Text>
          </VStack>
        )}

        {showUsernameField && (
          <Box mb={4}>
            <HStack>
              <Avatar
                src={`https://images.hive.blog/u/${username}/avatar/small`}
                name={username}
                size={isMobile ? "xs" : "sm"}
              />
              <Input
                placeholder={t('forms.placeholders.enterUsername')}
                value={username}
                onChange={handleUsernameChange}
                bg="inputBg"
                border="1px solid"
                borderColor="inputBorder"
                color="inputText"
                fontSize={isMobile ? "16px" : "md"}
              />
            </HStack>
          </Box>
        )}

        <Box mb={4}>
          <HStack>
            <Input
              type="number"
              placeholder={t('forms.placeholders.enterAmount')}
              value={amount}
              onChange={handleAmountChange}
              min={0}
              bg="inputBg"
              border="1px solid"
              borderColor="inputBorder"
              color="inputText"
              fontSize={isMobile ? "16px" : "md"}
            />
            {hiveAccount && (
              <Button
                size="sm"
                variant="outline"
                colorScheme="blue"
                onClick={() => {
                  const balance = title.toLowerCase().includes("hive")
                    ? parseFloat(String(hiveAccount.balance).split(" ")[0])
                    : parseFloat(String(hiveAccount.hbd_balance).split(" ")[0]);
                  setAmount(balance.toString());
                }}
              >
                🔝
              </Button>
            )}
          </HStack>
        </Box>

        {showMemoField && (
          <Box mb={4}>
            <HStack>
              <Input
                placeholder={t('forms.placeholders.enterMemo')}
                value={memo}
                onChange={handleMemoChange}
                bg="inputBg"
                border="1px solid"
                borderColor="inputBorder"
                color="inputText"
                fontSize={isMobile ? "16px" : "md"}
              />
              <Tooltip
                label={encryptMemo ? t('wallet.encryptedMemo') : t('wallet.publicMemo')}
                placement="left"
              >
                <IconButton
                  aria-label={encryptMemo ? t('wallet.disableEncryption') : t('wallet.enableEncryption')}
                  icon={encryptMemo ? <LockIcon /> : <ViewIcon />}
                  onClick={toggleEncrypt}
                  colorScheme={encryptMemo ? "blue" : "gray"}
                  variant="outline"
                  size={isMobile ? "sm" : "md"}
                />
              </Tooltip>

            </HStack>
          </Box>
        )}
      </Box>
    </SkateModal>
  );
}
