import { Button, HStack, Text } from "@chakra-ui/react";
import { useAccount, useDisconnect } from "wagmi";
import { FaEthereum } from "react-icons/fa";
import {
  Name,
  Avatar,
  IdentityResolver,
} from "@paperclip-labs/whisk-sdk/identity";

export default function ConnectButton({ onOpen }: { onOpen: () => void }) {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  const resolverOrder = [
    IdentityResolver.Nns,
    IdentityResolver.Farcaster,
    IdentityResolver.Ens,
    IdentityResolver.Base,
    IdentityResolver.Lens,
    IdentityResolver.Uni,
    IdentityResolver.World,
  ];

  return isConnected ? (
    <Button
      onClick={() => disconnect()}
      w="full"
      mb={4}
      variant="outline"
      height="auto"
      py={3}
    >
      <HStack spacing={3} w="full" justify="space-between">
        <HStack spacing={2}>
          {address && (
            <>
              <Avatar
                address={address}
                size={24}
                resolverOrder={resolverOrder}
              />
              <Name address={address} resolverOrder={resolverOrder} />
            </>
          )}
        </HStack>
        <Text fontSize="xs" color="muted">
          Disconnect
        </Text>
      </HStack>
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
