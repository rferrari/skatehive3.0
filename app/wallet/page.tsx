import { Metadata } from "next";
import WalletPageClient from "./WalletPageClient";

export const metadata: Metadata = {
  title: "Wallet | Skatehive",
  description: "Manage your wallet on Skatehive.",
};

export default function WalletPage() {
  return <WalletPageClient />;
}
