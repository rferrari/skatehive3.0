import { Button } from "@chakra-ui/react";
import { useAccount, useDisconnect } from "wagmi";
import { FaEthereum } from "react-icons/fa";
export default function ConnectButton({ onOpen }: { onOpen: () => void }) {
  const { isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();

  return isConnected ? (
    <Button
      leftIcon={<FaEthereum size={20} />}
      onClick={() => disconnect()}
      w="full"
      mb={4}
    >
      Disconnect
    </Button>
  ) : (
    <Button
      leftIcon={<FaEthereum size={20} />}
      onClick={onOpen}
      w="full"
      mb={4}
    >
      Connect Ethereum
    </Button>
  );
}
