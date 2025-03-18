'use client';
import { useState, useEffect } from 'react';
import { Box, Container, Flex } from '@chakra-ui/react';
import Sidebar from '@/components/layout/Sidebar';
import FooterNavigation from '@/components/layout/FooterNavigation';
import SplashScreen from '@/components/layout/SplashScreen';
import { Providers } from './providers';

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate a loading delay for splash screen
        setTimeout(() => setLoading(false), 2000); // Adjust duration if needed
    }, []);

    return (
        <>
            {loading && <SplashScreen onFinish={() => setLoading(false)} />}
            {!loading && (
                <Providers>
                    <Container maxW={{ base: '100%', md: 'container.xl' }} p={0}>
                        <Flex direction={{ base: 'column', md: 'row' }} minH="100vh">
                            <Sidebar />
                            <Box flex="1">{children}</Box>
                        </Flex>
                        <FooterNavigation />
                    </Container>
                </Providers>
            )}
        </>
    );
}
