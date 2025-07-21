import { Wallet, ConnectWallet } from "@coinbase/onchainkit/wallet";
import { Avatar, Name } from "@coinbase/onchainkit/identity";

export default function ConnectButton() {
  return (
    <Wallet>
      <ConnectWallet disconnectedLabel="Connect3333 Wallet">
        {/* Only show minimal identity info in the button to avoid nested buttons */}
        <Avatar className="h-6 w-6" />
        <Name />
      </ConnectWallet>
    </Wallet>
  );
}
