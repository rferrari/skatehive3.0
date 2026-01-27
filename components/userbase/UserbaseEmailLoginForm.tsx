"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useTranslations } from "@/lib/i18n/hooks";
import { useAioha } from "@aioha/react-ui";
import { useAccount, useEnsAvatar, useEnsName } from "wagmi";
import { useFarcasterSession } from "@/hooks/useFarcasterSession";

type RequestStatus = "idle" | "loading" | "success" | "error";
type LookupStatus = "idle" | "checking" | "found" | "new" | "error";

interface UserbaseEmailLoginFormProps {
  redirect?: string | null;
  variant?: "full" | "compact";
}

export default function UserbaseEmailLoginForm({
  redirect,
  variant = "full",
}: UserbaseEmailLoginFormProps) {
  const t = useTranslations("signIn");
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
  const [handle, setHandle] = useState("");
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState("");
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>("idle");
  const [lookupError, setLookupError] = useState("");
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup: abort any in-flight request on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

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

  const handleHandleChange = (value: string) => {
    setHandle(value);
    resetStatus();
  };

  const trimmedEmail = email.trim();
  const trimmedHandle = handle.trim();
  const isEmailValid = /.+@.+\..+/.test(trimmedEmail);
  const shouldShowHandle = lookupStatus === "new";

  useEffect(() => {
    if (!trimmedEmail || !isEmailValid) {
      setLookupStatus("idle");
      setLookupError("");
      setHandleAvailable(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setLookupStatus("checking");
        setLookupError("");
        const response = await fetch("/api/userbase/auth/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: trimmedEmail,
            handle: trimmedHandle || undefined,
          }),
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || t("errorFallback"));
        }

        const exists = Boolean(data?.exists);
        setLookupStatus(exists ? "found" : "new");
        if (typeof data?.handle_available === "boolean") {
          setHandleAvailable(data.handle_available);
        } else {
          setHandleAvailable(null);
        }
      } catch (lookupError: any) {
        if (controller.signal.aborted) return;
        setLookupStatus("error");
        setLookupError(lookupError?.message || t("errorFallback"));
        setHandleAvailable(null);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedEmail, trimmedHandle, isEmailValid, t]);

  const sendMagicLink = async () => {
    if (!trimmedEmail) {
      setStatus("error");
      setError(t("emailRequired"));
      return;
    }

    // Abort any previous in-flight request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setStatus("loading");
      setError("");

      const payload: Record<string, string> = {
        identifier: trimmedEmail,
      };

      if (trimmedHandle) {
        payload.handle = trimmedHandle;
      }

      if (preferredAvatarUrl) {
        payload.avatar_url = preferredAvatarUrl;
      }

      if (redirect) {
        payload.redirect = redirect;
      }

      const response = await fetch("/api/userbase/auth/magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      // Skip state updates if aborted
      if (controller.signal.aborted) return;

      const data = await response.json();

      // Skip state updates if aborted
      if (controller.signal.aborted) return;

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
      // Skip state updates if request was aborted
      if (controller.signal.aborted) return;
      if (requestError instanceof Error && requestError.name === "AbortError") return;

      console.error("Magic link request failed:", requestError);
      setStatus("error");
      setError(t("errorFallback"));
    }
  };

  const successEmail = trimmedEmail;
  const expiresLabel = useMemo(() => {
    if (!expiresAt) return null;
    return new Date(expiresAt).toLocaleString();
  }, [expiresAt]);

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

  const isCompact = variant === "compact";
  const canSend =
    isEmailValid &&
    (lookupStatus === "found" ||
      (lookupStatus === "new" &&
        trimmedHandle.length > 0 &&
        handleAvailable !== false));

  return (
    <VStack spacing={4} align="stretch">
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
          size={isCompact ? "sm" : "md"}
        />
        {lookupStatus === "checking" && (
          <FormHelperText color="dim">{t("checkingAccount")}</FormHelperText>
        )}
        {lookupStatus === "found" && (
          <FormHelperText color="success">{t("accountFound")}</FormHelperText>
        )}
        {lookupStatus === "new" && (
          <FormHelperText color="warning">
            {t("accountNotFound")}
          </FormHelperText>
        )}
        {lookupStatus === "error" && lookupError && (
          <FormHelperText color="warning">{lookupError}</FormHelperText>
        )}
      </FormControl>

      {shouldShowHandle && (
        <FormControl>
          <FormLabel color="text">{t("handleLabel")}</FormLabel>
          <Input
            type="text"
            value={handle}
            onChange={(event) => handleHandleChange(event.target.value)}
            placeholder={t("handlePlaceholder")}
            bg="inputBg"
            borderColor="inputBorder"
            color="inputText"
            _placeholder={{ color: "inputPlaceholder" }}
            autoComplete="username"
            size={isCompact ? "sm" : "md"}
          />
          <FormHelperText color="dim">{t("handleHelper")}</FormHelperText>
          {handleAvailable === false && (
            <FormHelperText color="warning">
              {t("handleUnavailable")}
            </FormHelperText>
          )}
        </FormControl>
      )}

      <Button
        onClick={sendMagicLink}
        isLoading={status === "loading"}
        loadingText={t("sending")}
        size={isCompact ? "sm" : "md"}
        isDisabled={lookupStatus === "checking" || status === "loading" || !canSend}
      >
        {status === "success" ? t("resend") : t("submit")}
      </Button>
    </VStack>
  );
}
