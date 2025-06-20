'use client';
import React, { useEffect, useState } from 'react';
import { Box, Select, Text, useToast, VStack, Heading, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react';
import { useTheme, ThemeName, themeMap } from '../themeProvider';
import LottieAnimation from '@/components/shared/LottieAnimation';
import UpvoteSnapContainer from '@/components/settings/UpvoteSnapContainer';

const Settings = () => {
    const { themeName, setThemeName } = useTheme();
    const [selectedTheme, setSelectedTheme] = useState<ThemeName>(themeName);
    const toast = useToast();

    useEffect(() => {
        setSelectedTheme(themeName);
    }, [themeName]);

    const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newTheme = event.target.value as ThemeName;
        setSelectedTheme(newTheme);
        setThemeName(newTheme);
        toast({
            title: 'Theme Updated!',
            description: `Successfully switched to ${newTheme} theme`,
            status: 'success',
            duration: 3000,
            isClosable: true,
        });
    };

    // Format theme name for display
    const formatThemeName = (name: string) => {
        return name
            .split(/(?=[A-Z])|[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    return (
        <Box p={8} maxW="container.md" mx="auto">
            <VStack spacing={6} align="stretch">
                <Heading size="lg" mb={2}>
                    Settings
                </Heading>
                
                <Box>
                    <Text mb={2} fontWeight="medium">Theme Selection</Text>
                    <Select 
                        value={selectedTheme} 
                        onChange={handleThemeChange} 
                        size="lg"
                    >
                        {Object.keys(themeMap).map((theme) => (
                            <option key={theme} value={theme}>
                                {formatThemeName(theme)}
                            </option>
                        ))}
                    </Select>
                </Box>

                <UpvoteSnapContainer />

                <LottieAnimation src="https://lottie.host/911167fe-726b-4e03-a295-56839461ebc4/WOauo8GTeO.lottie" />

                <Accordion allowToggle>
                    <AccordionItem border="none">
                        <h2>
                            <AccordionButton>
                                <Box flex="1" textAlign="left">
                                    <Heading size="md">Generate Private Keys (BETA)</Heading>
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                        </h2>
                        <AccordionPanel pb={4}>
                            <Box mt={2} p={4} borderRadius="md" bg="background">
                                <Text mb={2}>
                                    <b>Security Notice:</b> When your account was created, the Skatehive team temporarily stored your private keys in a Gmail account to deliver them to you. <b>This is not secure.</b> It is strongly recommended that you generate new private keys and update your Hive account, then store your new keys in a safe place only you control.
                                </Text>
                                <Text color="orange.300" mb={4}>
                                    Permanently change your keys and keep them safe. Never share your private keys with anyone.
                                </Text>
                                <Box textAlign="center">
                                    <Text fontWeight="bold" fontSize="lg" color="gray.500">Coming Soon...</Text>
                                </Box>
                            </Box>
                        </AccordionPanel>
                    </AccordionItem>
                </Accordion>
            </VStack>
        </Box>
    );
};

export default Settings;
