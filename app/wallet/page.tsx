import { Metadata } from "next";
import MainWallet from "@/components/wallet/MainWallet";

export const metadata: Metadata = {
  title: "Wallet | Skatehive",
  description: "Manage your wallet on Skatehive.",
};

export default function WalletPage() {
  return <MainWallet />;
}
