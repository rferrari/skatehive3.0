"use client";
import React from "react";
import { Flex, Button } from "@chakra-ui/react";
import { FaCog } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useAioha } from "@aioha/react-ui";

interface ProfileActionsProps {
    isOwner: boolean;
    isMobile: boolean;
}

export default function ProfileActions({ isOwner, isMobile }: ProfileActionsProps) {
    const router = useRouter();
    const { aioha } = useAioha();

    if (!isOwner || !isMobile) {
        return null;
    }

    return (
        <Flex display={{ base: "flex", md: "none" }} justify="center" align="center" my={4} gap={2}>
            <Button
                colorScheme="red"
                variant="solid"
                size="md"
                onClick={async () => {
                    try {
                        await aioha.logout();
                    } catch (error) {
                        console.error('Error during logout:', error);
                        // Optionally show user-friendly message
                        // Could add toast notification here if needed
                    }
                }}
            >
                Logout
            </Button>
            <Button
                colorScheme="gray"
                variant="outline"
                borderColor="gray.300"
                size="md"
                onClick={() => router.push("/settings")}
                leftIcon={<FaCog />}
                aria-label="Settings"
            >
                Settings
            </Button>
        </Flex>
    );
}
