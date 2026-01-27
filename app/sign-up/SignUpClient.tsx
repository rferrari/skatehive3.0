"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import NextLink from "next/link";
import { Box, Link, Text, VStack } from "@chakra-ui/react";
import { useTranslations } from "@/lib/i18n/hooks";
import UserbaseSignUpForm from "@/components/userbase/UserbaseSignUpForm";

export default function SignUpClient() {
  const t = useTranslations("signUp");
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const redirect = useMemo(() => {
    if (!redirectParam) return null;
    if (!redirectParam.startsWith("/")) return null;
    if (redirectParam.startsWith("//")) return null;
    if (redirectParam.includes("\\")) return null;
    return redirectParam;
  }, [redirectParam]);

  return (
    <Box px={4} py={16} display="flex" justifyContent="center">
      <Box
        w="full"
        maxW="520px"
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

          <UserbaseSignUpForm redirect={redirect} />

          <Box borderTop="1px solid" borderColor="border" pt={4}>
            <Link as={NextLink} href="/sign-in" color="primary">
              {t("backToSignIn")}
            </Link>
            <Text color="dim" fontSize="sm" mt={2}>
              <Link as={NextLink} href="/" color="primary">
                {t("backHome")}
              </Link>
            </Text>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
}
