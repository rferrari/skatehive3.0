'use client';

import { Box, Button, HStack, Text, VStack, useToast } from '@chakra-ui/react';
import { SignInButton, useProfile, useSignIn } from '@farcaster/auth-kit';

interface FarcasterSignInProps {
    onSuccess?: (profile: { fid: number; username: string }) => void;
    onError?: (error?: Error) => void;
    variant?: 'button' | 'card';
    showStatus?: boolean;
    customButtonText?: string;
    size?: 'sm' | 'md' | 'lg';
}

export default function FarcasterSignIn({
    onSuccess,
    onError,
    variant = 'button',
    showStatus = true,
    customButtonText,
    size = 'md'
}: FarcasterSignInProps) {
    const { isAuthenticated, profile } = useProfile();
    const { signOut } = useSignIn({});
    const toast = useToast();

    const handleSuccess = (res: { fid?: number; username?: string }) => {
        if (res.fid && res.username) {
            const profileData = { fid: res.fid, username: res.username };

            if (onSuccess) {
                onSuccess(profileData);
            } else {
                toast({
                    status: "success",
                    title: "Connected to Farcaster!",
                    description: `Welcome @${res.username}! Your Farcaster account is now connected.`,
                });
            }
        } else {
            const error = new Error("Missing FID or username from Farcaster");
            if (onError) {
                onError(error);
            } else {
                toast({
                    status: "error",
                    title: "Authentication incomplete",
                    description: error.message,
                });
            }
        }
    };

    const handleError = (error?: Error) => {
        if (onError) {
            onError(error);
        } else {
            toast({
                status: "error",
                title: "Farcaster connection failed",
                description: error?.message || "Failed to connect to Farcaster",
            });
        }
    };

    const handleSignOut = () => {
        signOut();
        toast({
            status: "success",
            title: "Signed out from Farcaster",
            description: "You have been disconnected from Farcaster"
        });
    };

    if (variant === 'card') {
        return (
            <Box
                p={4}
                bg="background"
                borderRadius="lg"
                border="1px solid"
                borderColor="muted"
            >
                <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                        <Text fontSize="md" fontWeight="bold" color="primary">
                            🛹 Farcaster
                        </Text>
                        {isAuthenticated && showStatus && (
                            <Text fontSize="xs" color="green.500">Connected</Text>
                        )}
                    </HStack>

                    {isAuthenticated ? (
                        <VStack spacing={2} align="stretch">
                            <Text fontSize="sm" color="text">
                                Connected as @{profile?.username}
                            </Text>
                            <Button
                                size="sm"
                                variant="outline"
                                colorScheme="red"
                                onClick={handleSignOut}
                            >
                                Disconnect
                            </Button>
                        </VStack>
                    ) : (
                        <Box>
                            <Text fontSize="sm" color="text" mb={3}>
                                Connect your Farcaster account to unlock social features
                            </Text>
                            <SignInButton
                                onSuccess={handleSuccess}
                                onError={handleError}
                            />
                        </Box>
                    )}
                </VStack>
            </Box>
        );
    }

    // Button variant
    if (isAuthenticated) {
        return (
            <Button
                size={size}
                variant="outline"
                color="primary"
                leftIcon={<Text fontSize="lg">🛹</Text>}
                justifyContent="flex-start"
                isDisabled={!showStatus}
            >
                <HStack w="full" justify="space-between">
                    <Text>{customButtonText || `@${profile?.username}`}</Text>
                    {showStatus && <Text fontSize="xs" color="green.500">Connected</Text>}
                </HStack>
            </Button>
        );
    }

    return (
        <SignInButton
            onSuccess={handleSuccess}
            onError={handleError}
        />
    );
}
