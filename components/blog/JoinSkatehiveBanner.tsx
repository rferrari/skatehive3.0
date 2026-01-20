import { useEffect, useState } from 'react';
import { Box, Button, Alert, AlertDescription, IconButton, Spinner, Flex } from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { useAioha } from '@aioha/react-ui';
import { checkCommunitySubscription, communitySubscribeKeyChain } from '@/lib/hive/client-functions';

export default function JoinSkatehiveBanner() {
  const { user } = useAioha();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (user) {
      setChecking(true);
      checkCommunitySubscription(user).then((sub) => {
        if (mounted) {
          setShow(!sub);
          setChecking(false);
        }
      });
    } else {
      setShow(false);
      setChecking(false);
    }
    return () => { mounted = false; };
  }, [user]);

  const handleJoin = async () => {
    if (!user) return;
    setLoading(true);
    await communitySubscribeKeyChain(user);
    // After joining, re-check subscription
    const sub = await checkCommunitySubscription(user);
    setShow(!sub);
    setLoading(false);
  };

  if (!user || !show) return null;
  if (checking) return <Box w="full" mb={2}><Spinner size="sm" /></Box>;

  return (
    <Flex justify="flex-start" w="100%" mb={2}>
      <Alert
        status="info"
        variant="left-accent"
        borderRadius="none"
        alignItems="center"
        colorScheme="primary"
        w={{ base: '95%', md: '75%' }}
        maxW="800px"
      >
        <IconButton
          aria-label="Close"
          icon={<CloseIcon boxSize={3} />}
          size="sm"
          variant="ghost"
          colorScheme="primary"
          onClick={() => setShow(false)}
          mr={2}
        />
        <AlertDescription flex="1">
          Join Skatehive to participate in the leaderboard
        </AlertDescription>
        <Button colorScheme="primary" size="sm" onClick={handleJoin} isLoading={loading} ml={4}>
          Join
        </Button>
      </Alert>
    </Flex>
  );
} 