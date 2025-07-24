import { Wallet, ConnectWallet } from "@coinbase/onchainkit/wallet";
import { Avatar, Name } from "@coinbase/onchainkit/identity";

export default function ConnectButton() {
  return (
    <Wallet>
      <ConnectWallet disconnectedLabel="Connect Ethereum">
        <Avatar className="h-10 w-10 rounded-full" />
        <Name />
      </ConnectWallet>
    </Wallet>
  );
}
