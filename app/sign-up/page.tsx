import { Suspense } from "react";
import { Box, Spinner } from "@chakra-ui/react";
import SignUpClient from "./SignUpClient";

export const metadata = {
  title: "Sign Up | Skatehive",
  description: "Create a Skatehive account with email and a name.",
};

export default function SignUpPage() {
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
      <SignUpClient />
    </Suspense>
  );
}
