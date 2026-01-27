"use client";

import React, { useCallback, useEffect, useState } from "react";
import NextLink from "next/link";
import {
  Box,
  Button,
  Divider,
  HStack,
  Heading,
  Link,
  Spinner,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useUserbaseAuth } from "@/contexts/UserbaseAuthContext";
import { useTranslations } from "@/contexts/LocaleContext";
import UserbaseIdentityLinker from "@/components/layout/UserbaseIdentityLinker";

interface IdentityRow {
  id: string;
  type: string;
  handle: string | null;
  address: string | null;
  external_id: string | null;
  verified_at: string | null;
  is_primary: boolean;
  metadata: Record<string, any>;
}

interface UserbaseIdentitiesSectionProps {
  variant?: "settings" | "modal";
  showSignOut?: boolean;
  onChange?: () => void;
}

export default function UserbaseIdentitiesSection({
  variant = "settings",
  showSignOut = false,
  onChange,
}: UserbaseIdentitiesSectionProps) {
  const t = useTranslations();
  const toast = useToast();
  const { user, signOut, bumpIdentitiesVersion } = useUserbaseAuth();
  const [identities, setIdentities] = useState<IdentityRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchIdentities = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/userbase/identities", {
        cache: "no-store",
      });
      const data = await response.json();
      if (response.ok) {
        setIdentities(data?.identities || []);
        onChange?.();
      } else {
        throw new Error(data?.error || t("settings.identityLoadError"));
      }
    } catch (error: any) {
      toast({
        title: t("settings.identityLoadError"),
        description: error?.message,
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, t, onChange]);

  useEffect(() => {
    if (user) {
      fetchIdentities();
    } else {
      setIdentities([]);
    }
  }, [user, fetchIdentities]);

  const handleUnlink = async (identityId: string) => {
    try {
      const response = await fetch("/api/userbase/identities", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: identityId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || t("settings.unlinkFailed"));
      }
      await fetchIdentities();
      bumpIdentitiesVersion();
    } catch (error: any) {
      toast({
        title: t("settings.unlinkFailed"),
        description: error?.message,
        status: "error",
        duration: 3000,
      });
    }
  };

  if (!user) {
    return (
      <Box>
        <Text color="primary" fontSize="sm" mb={2}>
          {t("settings.signInToManage")}
        </Text>
        <Link as={NextLink} href="/sign-in" color="primary">
          {t("userbaseAuth.signIn")}
        </Link>
      </Box>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={3}>
        <Heading size="sm" color="primary">
          {t("settings.linkedIdentities")}
        </Heading>
        {isLoading && <Spinner size="sm" />}
      </HStack>

      {identities.length === 0 ? (
        <Text color="primary" fontSize="sm">
          {t("settings.noIdentities")}
        </Text>
      ) : (
        <VStack spacing={3} align="stretch">
          {identities.map((identity) => (
            <Box key={identity.id} border="1px solid" borderColor="border" p={3}>
              <HStack justify="space-between" align="start">
                <Box>
                  <Text fontWeight="bold" color="text">
                    {identity.type.toUpperCase()}
                  </Text>
                  {identity.handle && (
                    <Text color="text">@{identity.handle}</Text>
                  )}
                  {identity.address && (
                    <Text color="text" fontSize="sm">
                      {identity.address}
                    </Text>
                  )}
                  {identity.external_id && (
                    <Text color="text" fontSize="sm">
                      FID: {identity.external_id}
                    </Text>
                  )}
                </Box>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => handleUnlink(identity.id)}
                >
                  {t("settings.unlink")}
                </Button>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}

      <Divider my={4} borderColor="border" />
      <UserbaseIdentityLinker
        onLinked={() => {
          fetchIdentities();
        }}
      />

      {showSignOut && (
        <Button
          size="xs"
          variant="outline"
          mt={4}
          onClick={signOut}
          width={variant === "modal" ? "full" : "auto"}
        >
          {t("userbaseAuth.signOut")}
        </Button>
      )}
    </Box>
  );
}
