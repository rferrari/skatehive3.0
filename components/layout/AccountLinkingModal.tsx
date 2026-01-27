"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  HStack,
  VStack,
  Text,
  Icon,
  useToast,
  Spinner,
  Badge,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import SkateModal from "@/components/shared/SkateModal";
import { useAioha } from "@aioha/react-ui";
import { KeyTypes } from "@aioha/aioha";
import { useSignMessage } from "wagmi";
import { FaEthereum, FaHive, FaLink, FaCheck } from "react-icons/fa";
import { SiFarcaster } from "react-icons/si";
import { useUserbaseAuth } from "@/contexts/UserbaseAuthContext";
import { useFarcasterSession } from "@/hooks/useFarcasterSession";
import {
  useAccountLinkingOpportunities,
  LinkingOpportunity,
} from "@/hooks/useAccountLinkingOpportunities";

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function OpportunityRow({
  opportunity,
  onLink,
  isLinking,
}: {
  opportunity: LinkingOpportunity;
  onLink: () => void;
  isLinking: boolean;
}) {
  const iconMap = {
    hive: FaHive,
    evm: FaEthereum,
    farcaster: SiFarcaster,
  };

  const colorMap = {
    hive: "red.400",
    evm: "blue.300",
    farcaster: "purple.400",
  };

  const sourceLabel = {
    wallet: "connected",
    hive_metadata: "from hive profile",
    farcaster_verifications: "farcaster verified · no signature needed",
  };

  const displayName =
    opportunity.handle ||
    (opportunity.address ? shortenAddress(opportunity.address) : opportunity.externalId);

  return (
    <HStack
      py={2}
      px={2}
      bg={opportunity.alreadyLinked ? "whiteAlpha.50" : "whiteAlpha.100"}
      borderRadius="sm"
      border="1px solid"
      borderColor={opportunity.alreadyLinked ? "whiteAlpha.100" : "primary"}
      opacity={opportunity.alreadyLinked ? 0.6 : 1}
    >
      <Icon
        as={iconMap[opportunity.type]}
        boxSize={4}
        color={colorMap[opportunity.type]}
      />
      <VStack align="start" spacing={0} flex={1}>
        <HStack spacing={2}>
          <Text fontFamily="mono" fontSize="sm" color="text">
            {displayName}
          </Text>
          {opportunity.alreadyLinked && (
            <Icon as={FaCheck} boxSize={3} color="green.400" />
          )}
        </HStack>
        <Text fontFamily="mono" fontSize="2xs" color="gray.500">
          {sourceLabel[opportunity.source]}
        </Text>
      </VStack>
      {opportunity.alreadyLinked ? (
        <Text fontFamily="mono" fontSize="2xs" color="green.400">
          linked
        </Text>
      ) : (
        <Button
          size="xs"
          variant="outline"
          fontFamily="mono"
          fontSize="2xs"
          color="primary"
          borderColor="primary"
          onClick={onLink}
          isLoading={isLinking}
          _hover={{ bg: "primary", color: "background" }}
        >
          link →
        </Button>
      )}
    </HStack>
  );
}

interface AccountLinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountLinkingModal({
  isOpen,
  onClose,
}: AccountLinkingModalProps) {
  const toast = useToast();
  const { aioha, user: hiveUser } = useAioha();
  const { signMessageAsync } = useSignMessage();
  const { profile: farcasterProfile } = useFarcasterSession();
  const { bumpIdentitiesVersion, refresh: refreshUserbase } = useUserbaseAuth();
  const { opportunities, isLoading, refresh } = useAccountLinkingOpportunities();
  
  const [linkingType, setLinkingType] = useState<string | null>(null);

  // Filter to only show unlinked opportunities
  const unlinkedOpportunities = opportunities.filter((o) => !o.alreadyLinked);
  const linkedOpportunities = opportunities.filter((o) => o.alreadyLinked);

  const linkHive = useCallback(async (handle: string) => {
    setLinkingType("hive");
    try {
      // Get challenge
      const challengeRes = await fetch("/api/userbase/identities/hive/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });
      const challengeData = await challengeRes.json();
      if (!challengeRes.ok) throw new Error(challengeData?.error || "Challenge failed");

      // Sign with Aioha
      const signResult = await aioha.signMessage(challengeData.message, KeyTypes.Posting);
      if (!signResult?.success) throw new Error(signResult?.error || "Signing failed");

      // Verify
      const verifyRes = await fetch("/api/userbase/identities/hive/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle,
          signature: signResult.result,
          public_key: signResult.publicKey,
        }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        // Check for merge required
        if (verifyRes.status === 409 && verifyData?.merge_required) {
          const shouldMerge = window.confirm(
            `This Hive account is already linked to another user. Merge accounts?`
          );
          if (shouldMerge) {
            const mergeRes = await fetch("/api/userbase/merge", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "hive",
                identifier: handle,
                source_user_id: verifyData.existing_user_id,
                signature: signResult.result,
                public_key: signResult.publicKey,
              }),
            });
            if (!mergeRes.ok) {
              const mergeData = await mergeRes.json();
              throw new Error(mergeData?.error || "Merge failed");
            }
            toast({ status: "success", title: "accounts merged" });
            await refreshUserbase();
          }
        } else {
          throw new Error(verifyData?.error || "Verification failed");
        }
      } else {
        toast({ status: "success", title: `linked: @${handle}` });
      }

      bumpIdentitiesVersion();
      await refresh();
    } catch (error: any) {
      toast({
        status: "error",
        title: "linking failed",
        description: error?.message,
      });
    } finally {
      setLinkingType(null);
    }
  }, [aioha, toast, bumpIdentitiesVersion, refresh, refreshUserbase]);

  const linkEvm = useCallback(async (address: string, opportunity?: LinkingOpportunity) => {
    setLinkingType("evm");
    try {
      // Check if this is a Farcaster-verified address
      const isFarcasterVerified = opportunity?.source === "farcaster_verifications";

      if (isFarcasterVerified && farcasterProfile?.fid) {
        // For Farcaster-verified addresses, we can link directly without signature
        const verifyRes = await fetch("/api/userbase/identities/evm/verify-farcaster", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            address,
            farcaster_fid: farcasterProfile.fid,
          }),
        });
        const verifyData = await verifyRes.json();

        if (!verifyRes.ok) {
          if (verifyRes.status === 409 && verifyData?.merge_required) {
            const shouldMerge = window.confirm(
              `This wallet is already linked to another user. Merge accounts?`
            );
            if (shouldMerge) {
              const mergeRes = await fetch("/api/userbase/merge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "evm",
                  identifier: address,
                  source_user_id: verifyData.existing_user_id,
                  farcaster_verified: true,
                  farcaster_fid: farcasterProfile.fid,
                }),
              });
              if (!mergeRes.ok) {
                const mergeData = await mergeRes.json();
                throw new Error(mergeData?.error || "Merge failed");
              }
              toast({ status: "success", title: "accounts merged" });
              await refreshUserbase();
            }
          } else {
            throw new Error(verifyData?.error || "Verification failed");
          }
        } else {
          toast({ status: "success", title: `linked: ${shortenAddress(address)}` });
        }
      } else {
        // Original flow: require wallet signature
        // Get challenge
        const challengeRes = await fetch("/api/userbase/identities/evm/challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });
        const challengeData = await challengeRes.json();
        if (!challengeRes.ok) throw new Error(challengeData?.error || "Challenge failed");

        // Sign with wallet
        const signature = await signMessageAsync({ message: challengeData.message });

        // Verify
        const verifyRes = await fetch("/api/userbase/identities/evm/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, signature }),
        });
        const verifyData = await verifyRes.json();

        if (!verifyRes.ok) {
          if (verifyRes.status === 409 && verifyData?.merge_required) {
            const shouldMerge = window.confirm(
              `This wallet is already linked to another user. Merge accounts?`
            );
            if (shouldMerge) {
              const mergeRes = await fetch("/api/userbase/merge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "evm",
                  identifier: address,
                  source_user_id: verifyData.existing_user_id,
                  signature,
                }),
              });
              if (!mergeRes.ok) {
                const mergeData = await mergeRes.json();
                throw new Error(mergeData?.error || "Merge failed");
              }
              toast({ status: "success", title: "accounts merged" });
              await refreshUserbase();
            }
          } else {
            throw new Error(verifyData?.error || "Verification failed");
          }
        } else {
          toast({ status: "success", title: `linked: ${shortenAddress(address)}` });
        }
      }

      bumpIdentitiesVersion();
      await refresh();
    } catch (error: any) {
      toast({
        status: "error",
        title: "linking failed",
        description: error?.message,
      });
    } finally {
      setLinkingType(null);
    }
  }, [signMessageAsync, farcasterProfile, toast, bumpIdentitiesVersion, refresh, refreshUserbase]);

  const linkFarcaster = useCallback(async (
    handle: string | undefined,
    externalId: string | undefined
  ) => {
    if (!externalId || !farcasterProfile) return;
    setLinkingType("farcaster");
    try {
      const res = await fetch("/api/userbase/identities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "farcaster",
          handle: handle || farcasterProfile.username,
          external_id: externalId,
          address: farcasterProfile.custody,
          metadata: {
            verifications: farcasterProfile.verifications || [],
            pfp_url: farcasterProfile.pfpUrl,
            display_name: farcasterProfile.displayName,
          },
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data?.merge_required) {
          const shouldMerge = window.confirm(
            `This Farcaster account is already linked to another user. Merge accounts?`
          );
          if (shouldMerge) {
            const mergeRes = await fetch("/api/userbase/merge", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "farcaster",
                identifier: externalId,
                source_user_id: data.existing_user_id,
              }),
            });
            if (!mergeRes.ok) {
              const mergeData = await mergeRes.json();
              throw new Error(mergeData?.error || "Merge failed");
            }
            toast({ status: "success", title: "accounts merged" });
            await refreshUserbase();
          }
        } else {
          throw new Error(data?.error || "Linking failed");
        }
      } else {
        toast({ status: "success", title: `linked: @${handle}` });
      }

      bumpIdentitiesVersion();
      await refresh();
    } catch (error: any) {
      toast({
        status: "error",
        title: "linking failed",
        description: error?.message,
      });
    } finally {
      setLinkingType(null);
    }
  }, [farcasterProfile, toast, bumpIdentitiesVersion, refresh, refreshUserbase]);

  const handleLink = useCallback((opportunity: LinkingOpportunity) => {
    if (opportunity.type === "hive" && opportunity.handle) {
      linkHive(opportunity.handle);
    } else if (opportunity.type === "evm" && opportunity.address) {
      linkEvm(opportunity.address, opportunity);
    } else if (opportunity.type === "farcaster") {
      linkFarcaster(opportunity.handle, opportunity.externalId);
    }
  }, [linkHive, linkEvm, linkFarcaster]);

  const handleLinkAll = useCallback(async () => {
    for (const op of unlinkedOpportunities) {
      await handleLink(op);
    }
  }, [unlinkedOpportunities, handleLink]);

  if (opportunities.length === 0 && !isLoading) {
    return null;
  }

  return (
    <SkateModal
      isOpen={isOpen}
      onClose={onClose}
      title="link accounts"
      isCentered
    >
      <Box
        position="absolute"
        inset={0}
        opacity={0.03}
        pointerEvents="none"
        bgImage="url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')"
      />

      <Box p={4} position="relative">
        <VStack spacing={4} align="stretch">
          {/* Header */}
          <VStack spacing={1}>
            <HStack spacing={2}>
              <Icon as={FaLink} boxSize={4} color="primary" />
              <Text fontFamily="mono" fontSize="sm" color="primary">
                detected connections
              </Text>
            </HStack>
            <Text fontFamily="mono" fontSize="xs" color="gray.400" textAlign="center">
              link your accounts for a unified experience
            </Text>
          </VStack>

          {isLoading ? (
            <HStack justify="center" py={4}>
              <Spinner size="sm" color="primary" />
              <Text fontFamily="mono" fontSize="xs" color="gray.500">
                scanning...
              </Text>
            </HStack>
          ) : (
            <>
              {/* Unlinked opportunities */}
              {unlinkedOpportunities.length > 0 && (
                <VStack spacing={2} align="stretch">
                  <HStack>
                    <Text fontFamily="mono" fontSize="xs" color="gray.500">
                      ready to link
                    </Text>
                    <Badge
                      bg="primary"
                      color="background"
                      fontFamily="mono"
                      fontSize="2xs"
                      animation={`${pulse} 2s ease-in-out infinite`}
                    >
                      {unlinkedOpportunities.length}
                    </Badge>
                  </HStack>
                  {unlinkedOpportunities.map((op, i) => (
                    <OpportunityRow
                      key={`${op.type}-${op.handle || op.address || op.externalId}-${i}`}
                      opportunity={op}
                      onLink={() => handleLink(op)}
                      isLinking={linkingType === op.type}
                    />
                  ))}
                </VStack>
              )}

              {/* Already linked */}
              {linkedOpportunities.length > 0 && (
                <VStack spacing={2} align="stretch">
                  <Text fontFamily="mono" fontSize="xs" color="gray.500">
                    already linked
                  </Text>
                  {linkedOpportunities.map((op, i) => (
                    <OpportunityRow
                      key={`${op.type}-${op.handle || op.address || op.externalId}-${i}`}
                      opportunity={op}
                      onLink={() => {}}
                      isLinking={false}
                    />
                  ))}
                </VStack>
              )}

              {/* Actions */}
              {unlinkedOpportunities.length > 0 && (
                <VStack spacing={2} pt={2}>
                  {unlinkedOpportunities.length > 1 && (
                    <Button
                      w="full"
                      size="sm"
                      bg="primary"
                      color="background"
                      fontFamily="mono"
                      fontSize="xs"
                      onClick={handleLinkAll}
                      isLoading={!!linkingType}
                      _hover={{ opacity: 0.9 }}
                    >
                      link all ({unlinkedOpportunities.length})
                    </Button>
                  )}
                  <Button
                    w="full"
                    size="sm"
                    variant="ghost"
                    fontFamily="mono"
                    fontSize="xs"
                    color="gray.500"
                    onClick={onClose}
                    _hover={{ color: "text" }}
                  >
                    skip for now
                  </Button>
                </VStack>
              )}

              {unlinkedOpportunities.length === 0 && (
                <VStack spacing={2} pt={2}>
                  <Text fontFamily="mono" fontSize="xs" color="green.400" textAlign="center">
                    ✓ all accounts linked
                  </Text>
                  <Button
                    w="full"
                    size="sm"
                    variant="outline"
                    fontFamily="mono"
                    fontSize="xs"
                    color="primary"
                    borderColor="primary"
                    onClick={onClose}
                    _hover={{ bg: "primary", color: "background" }}
                  >
                    done
                  </Button>
                </VStack>
              )}
            </>
          )}
        </VStack>
      </Box>
    </SkateModal>
  );
}
