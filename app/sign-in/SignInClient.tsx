"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import NextLink from "next/link";
import {
  Box,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useTranslations } from "@/lib/i18n/hooks";
import UserbaseEmailLoginForm from "@/components/userbase/UserbaseEmailLoginForm";

export default function SignInClient() {
  const t = useTranslations("signIn");
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const redirect = useMemo(() => {
    if (!redirectParam) return null;
    if (!redirectParam.startsWith("/")) return null;
    if (redirectParam.startsWith("//")) return null;
    // Reject paths with backslashes or encoded slashes that could bypass validation
    if (/[\\]|%2f|%5c/i.test(redirectParam)) return null;
    // Ensure it's a valid relative path
    try {
      const url = new URL(redirectParam, "http://localhost");
      if (url.origin !== "http://localhost") return null;
    } catch {
      return null;
    }
    return redirectParam;
  }, [redirectParam]);

  return (
    <Box px={4} py={16} display="flex" justifyContent="center">
      <Box
        w="full"
        maxW="460px"
        bg="panel"
        border="1px solid"
        borderColor="border"
        borderRadius="md"
        p={8}
      >
        <VStack spacing={5} align="stretch">
          <Box>
            <Text fontSize="2xl" fontWeight="bold" color="text">
              {t("title")}
            </Text>
            <Text color="dim" mt={1}>
              {t("subtitle")}
            </Text>
          </Box>

          <UserbaseEmailLoginForm redirect={redirect} variant="full" />

          <Box borderTop="1px solid" borderColor="border" pt={4}>
            <Text color="dim" fontSize="sm" mb={2}>
              {t("noAccountPrompt")}{" "}
              <Link as={NextLink} href="/sign-up" color="primary">
                {t("createAccount")}
              </Link>
            </Text>
            <Link as={NextLink} href="/" color="primary">
              {t("backHome")}
            </Link>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
}
