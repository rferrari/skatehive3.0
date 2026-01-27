import { Suspense } from "react";
import { Box, Spinner } from "@chakra-ui/react";
import SignInClient from "./SignInClient";

export const metadata = {
  title: "Sign In | Skatehive",
  description: "Request a Skatehive magic link to sign in.",
};

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          minH="60vh"
        >
          <Spinner size="xl" />
        </Box>
      }
    >
      <SignInClient />
    </Suspense>
  );
}
