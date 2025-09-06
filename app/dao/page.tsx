import { Metadata } from "next";
import { Box } from "@chakra-ui/react";
import DAOAssets from "@/components/dao/DAOAssets";

export const metadata: Metadata = {
  title: "DAO - Under Construction",
  description:
    "The Skatehive DAO is currently under construction. Stay tuned for updates!",
  openGraph: {
    title: "DAO - Under Construction | Skatehive",
    description:
      "The Skatehive DAO is currently under construction. Stay tuned for updates!",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DAO - Under Construction | Skatehive",
    description:
      "The Skatehive DAO is currently under construction. Stay tuned for updates!",
  },
};

export default function DAOPage() {
  return (
    <Box minH="100vh">
      {/* DAO Assets Panel */}
      <DAOAssets />
    </Box>
  );
}
