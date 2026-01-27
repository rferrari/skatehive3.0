"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useTranslations } from "@/contexts/LocaleContext";
import { useAioha } from "@aioha/react-ui";
import { KeyTypes } from "@aioha/aioha";
import { useAccount, useSignMessage } from "wagmi";
import { useUserbaseAuth } from "@/contexts/UserbaseAuthContext";

type MergeType = "hive" | "evm";

interface MergePreview {
  exists: boolean;
  same_user?: boolean;
  source_user_id?: string | null;
  counts?: {
    identities?: number;
    auth_methods?: number;
    sessions?: number;
    soft_posts?: number;
    soft_votes?: number;
  };
}

export default function UserbaseMergePanel() {
  const t = useTranslations();
  const { user: hiveUser, aioha } = useAioha();
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { refresh } = useUserbaseAuth();

  const hiveHandle =
    typeof hiveUser === "string"
      ? hiveUser
      : hiveUser?.name || hiveUser?.username || "";
  const evmAddress = address ? address.toLowerCase() : "";

  const [type, setType] = useState<MergeType>("hive");
  const [identifier, setIdentifier] = useState("");
  const [preview, setPreview] = useState<MergePreview | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "merging">(
    "idle"
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (type === "hive" && hiveHandle && !identifier) {
      setIdentifier(hiveHandle);
    }
    if (type === "evm" && evmAddress && !identifier) {
      setIdentifier(evmAddress);
    }
  }, [type, hiveHandle, evmAddress, identifier]);

  const resetState = () => {
    setPreview(null);
    setError("");
  };

  const handleTypeChange = (value: MergeType) => {
    setType(value);
    setIdentifier("");
    resetState();
  };

  const handleIdentifierChange = (value: string) => {
    setIdentifier(value);
    resetState();
  };

  const loadPreview = useCallback(async () => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      setError(t("settings.mergeMissingIdentifier"));
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/userbase/merge/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, identifier: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || t("settings.mergePreviewError"));
      }
      setPreview(data);
    } catch (err: any) {
      setError(err?.message || t("settings.mergePreviewError"));
    } finally {
      setStatus("idle");
    }
  }, [identifier, type, t]);

  const handleMerge = useCallback(async () => {
    if (!preview?.source_user_id) {
      setError(t("settings.mergeNoSource"));
      return;
    }

    const trimmed = identifier.trim();
    if (!trimmed) {
      setError(t("settings.mergeMissingIdentifier"));
      return;
    }

    setStatus("merging");
    setError("");

    try {
      if (type === "hive") {
        const challengeResponse = await fetch(
          "/api/userbase/identities/hive/challenge",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ handle: trimmed }),
          }
        );
        const challengeData = await challengeResponse.json();
        if (!challengeResponse.ok) {
          throw new Error(
            challengeData?.error || t("settings.mergeChallengeError")
          );
        }

        const signResult = await aioha.signMessage(
          challengeData.message,
          KeyTypes.Posting
        );
        if (!signResult?.success) {
          throw new Error(signResult?.error || t("settings.mergeChallengeError"));
        }
        if (!signResult.publicKey) {
          throw new Error(t("settings.mergeChallengeError"));
        }

        const mergeResponse = await fetch("/api/userbase/merge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "hive",
            identifier: trimmed,
            source_user_id: preview.source_user_id,
            signature: signResult.result,
            public_key: signResult.publicKey,
          }),
        });
        const mergeData = await mergeResponse.json();
        if (!mergeResponse.ok) {
          throw new Error(mergeData?.error || t("settings.mergeError"));
        }
      } else {
        const challengeResponse = await fetch(
          "/api/userbase/identities/evm/challenge",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: trimmed }),
          }
        );
        const challengeData = await challengeResponse.json();
        if (!challengeResponse.ok) {
          throw new Error(
            challengeData?.error || t("settings.mergeChallengeError")
          );
        }

        const signature = await signMessageAsync({
          message: challengeData.message,
        });

        const mergeResponse = await fetch("/api/userbase/merge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "evm",
            identifier: trimmed,
            source_user_id: preview.source_user_id,
            signature,
          }),
        });
        const mergeData = await mergeResponse.json();
        if (!mergeResponse.ok) {
          throw new Error(mergeData?.error || t("settings.mergeError"));
        }
      }

      await refresh();
      setPreview(null);
      setIdentifier("");
    } catch (err: any) {
      setError(err?.message || t("settings.mergeError"));
    } finally {
      setStatus("idle");
    }
  }, [
    preview,
    identifier,
    type,
    aioha,
    signMessageAsync,
    refresh,
    t,
  ]);

  const previewCounts = useMemo(() => {
    if (!preview?.counts) return [];
    return [
      { label: t("settings.mergeCountIdentities"), value: preview.counts.identities || 0 },
      { label: t("settings.mergeCountAuthMethods"), value: preview.counts.auth_methods || 0 },
      { label: t("settings.mergeCountSessions"), value: preview.counts.sessions || 0 },
      { label: t("settings.mergeCountSoftPosts"), value: preview.counts.soft_posts || 0 },
      { label: t("settings.mergeCountSoftVotes"), value: preview.counts.soft_votes || 0 },
    ];
  }, [preview, t]);

  return (
    <Box border="1px solid" borderColor="muted" p={4}>
      <VStack spacing={4} align="stretch">
        <Box>
          <Text fontWeight="bold" color="text">
            {t("settings.mergeTitle")}
          </Text>
          <Text color="dim" fontSize="sm" mt={1}>
            {t("settings.mergeDescription")}
          </Text>
        </Box>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Text>{error}</Text>
          </Alert>
        )}

        <FormControl>
          <FormLabel color="text">{t("settings.mergeTypeLabel")}</FormLabel>
          <Select
            value={type}
            onChange={(event) => handleTypeChange(event.target.value as MergeType)}
            bg="inputBg"
            borderColor="inputBorder"
            color="inputText"
          >
            <option value="hive">{t("settings.mergeTypeHive")}</option>
            <option value="evm">{t("settings.mergeTypeEvm")}</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel color="text">{t("settings.mergeIdentifierLabel")}</FormLabel>
          <Input
            value={identifier}
            onChange={(event) => handleIdentifierChange(event.target.value)}
            placeholder={
              type === "hive"
                ? t("settings.mergeIdentifierPlaceholderHive")
                : t("settings.mergeIdentifierPlaceholderEvm")
            }
            bg="inputBg"
            borderColor="inputBorder"
            color="inputText"
            _placeholder={{ color: "inputPlaceholder" }}
          />
        </FormControl>

        <Button
          onClick={loadPreview}
          isLoading={status === "loading"}
          loadingText={t("settings.mergeChecking")}
        >
          {t("settings.mergeCheck")}
        </Button>

        {preview && preview.exists === false && (
          <Text color="dim">{t("settings.mergeNotFound")}</Text>
        )}

        {preview && preview.same_user && (
          <Text color="dim">{t("settings.mergeSameUser")}</Text>
        )}

        {preview && preview.exists && !preview.same_user && (
          <Box border="1px solid" borderColor="border" p={3}>
            <Text fontWeight="bold" color="text" mb={2}>
              {t("settings.mergeFoundTitle")}
            </Text>
            <VStack align="start" spacing={1} mb={3}>
              {previewCounts.map((item) => (
                <Text key={item.label} fontSize="sm" color="dim">
                  {item.label}: {item.value}
                </Text>
              ))}
            </VStack>
            <Button
              onClick={handleMerge}
              isLoading={status === "merging"}
              loadingText={t("settings.mergeMerging")}
            >
              {t("settings.mergeAction")}
            </Button>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
