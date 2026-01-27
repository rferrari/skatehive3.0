"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Image,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useTranslations } from "@/lib/i18n/hooks";
import { useAioha } from "@aioha/react-ui";
import { useAccount, useEnsAvatar, useEnsName } from "wagmi";
import { useFarcasterSession } from "@/hooks/useFarcasterSession";

type RequestStatus = "idle" | "loading" | "success" | "error";

interface UserbaseSignUpFormProps {
  redirect?: string | null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function getAvatarUrl(seed: string) {
  const safeSeed = encodeURIComponent(seed || "skatehive");
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${safeSeed}`;
}

export default function UserbaseSignUpForm({ redirect }: UserbaseSignUpFormProps) {
  const t = useTranslations("signUp");
  const { user: hiveUser } = useAioha();
  const { address } = useAccount();
  const { data: ensName } = useEnsName({ address, chainId: 1 });
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName ?? undefined,
    chainId: 1,
    query: {
      enabled: !!ensName,
    },
  });
  const { profile: farcasterProfile } = useFarcasterSession();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const handle = useMemo(() => slugify(name), [name]);
  const hiveHandle =
    typeof hiveUser === "string"
      ? hiveUser
      : hiveUser?.name || hiveUser?.username || null;
  const preferredAvatarUrl = useMemo(() => {
    const hiveAvatar = hiveHandle
      ? `https://images.hive.blog/u/${hiveHandle}/avatar`
      : null;
    const farcasterAvatar = farcasterProfile?.pfpUrl || null;
    return hiveAvatar || ensAvatar || farcasterAvatar || null;
  }, [hiveHandle, ensAvatar, farcasterProfile]);
  const avatarUrl = useMemo(() => {
    if (preferredAvatarUrl) return preferredAvatarUrl;
    const seed = handle || email.trim().toLowerCase() || name.trim();
    return getAvatarUrl(seed);
  }, [preferredAvatarUrl, handle, email, name]);

  const resetStatus = () => {
    if (status !== "idle") {
      setStatus("idle");
      setError("");
      setExpiresAt(null);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    resetStatus();
  };

  const handleNameChange = (value: string) => {
    setName(value);
    resetStatus();
  };

  const sendSignUp = async () => {
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail) {
      setStatus("error");
      setError(t("emailRequired"));
      return;
    }

    if (!trimmedName) {
      setStatus("error");
      setError(t("nameRequired"));
      return;
    }

    if (!handle) {
      setStatus("error");
      setError(t("handleInvalid"));
      return;
    }

    try {
      setStatus("loading");
      setError("");

      const payload: Record<string, string> = {
        email: trimmedEmail,
        display_name: trimmedName,
        handle,
        avatar_url: avatarUrl,
      };

      if (redirect) {
        payload.redirect = redirect;
      }

      const response = await fetch("/api/userbase/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        const details =
          typeof data?.details === "string"
            ? data.details
            : data?.details
            ? JSON.stringify(data.details)
            : null;
        const baseError = data?.error || t("errorFallback");
        const errorMessage = details ? `${baseError} (${details})` : baseError;
        setStatus("error");
        setError(errorMessage);
        return;
      }

      setStatus("success");
      setExpiresAt(typeof data?.expires_at === "string" ? data.expires_at : null);
    } catch (requestError) {
      console.error("Sign up request failed:", requestError);
      setStatus("error");
      setError(t("errorFallback"));
    }
  };

  const successEmail = email.trim();
  const expiresLabel = useMemo(() => {
    if (!expiresAt) return null;
    return new Date(expiresAt).toLocaleString();
  }, [expiresAt]);

  return (
    <VStack spacing={5} align="stretch">
      {status === "error" && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Text>{error}</Text>
        </Alert>
      )}

      {status === "success" && (
        <Alert status="success" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">{t("successTitle")}</Text>
            <Text>
              {t("successBody")}{" "}
              <Text as="span" fontWeight="bold">
                {successEmail}
              </Text>
            </Text>
            {expiresLabel && (
              <Text color="dim" fontSize="sm" mt={1}>
                {t("expiresAt")} {expiresLabel}
              </Text>
            )}
            <Text color="dim" fontSize="sm" mt={1}>
              {t("spamNote")}
            </Text>
          </Box>
        </Alert>
      )}

      <FormControl isRequired>
        <FormLabel color="text">{t("emailLabel")}</FormLabel>
        <Input
          type="email"
          value={email}
          onChange={(event) => handleEmailChange(event.target.value)}
          placeholder={t("emailPlaceholder")}
          bg="inputBg"
          borderColor="inputBorder"
          color="inputText"
          _placeholder={{ color: "inputPlaceholder" }}
          autoComplete="email"
        />
      </FormControl>

      <FormControl isRequired>
        <FormLabel color="text">{t("nameLabel")}</FormLabel>
        <Input
          type="text"
          value={name}
          onChange={(event) => handleNameChange(event.target.value)}
          placeholder={t("namePlaceholder")}
          bg="inputBg"
          borderColor="inputBorder"
          color="inputText"
          _placeholder={{ color: "inputPlaceholder" }}
          autoComplete="name"
        />
        <FormHelperText color="dim">{t("nameHelper")}</FormHelperText>
      </FormControl>

      <Box border="1px solid" borderColor="border" p={3}>
        <HStack spacing={3}>
          <Image src={avatarUrl} alt="Avatar preview" boxSize="48px" />
          <Box>
            <Text fontSize="sm" color="text">
              {t("avatarLabel")}
            </Text>
            <Text fontSize="sm" color="dim">
              {handle ? t("handleHint").replace("{handle}", handle) : t("handlePending")}
            </Text>
          </Box>
        </HStack>
      </Box>

      <Button
        onClick={sendSignUp}
        isLoading={status === "loading"}
        loadingText={t("sending")}
      >
        {status === "success" ? t("resend") : t("submit")}
      </Button>
    </VStack>
  );
}
