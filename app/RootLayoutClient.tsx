'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Flex,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react';
import Sidebar from '@/components/layout/Sidebar';
import FooterNavButtons from '@/components/layout/FooterNavButtons';
import SplashScreen from '@/components/layout/SplashScreen';
import SearchOverlay from '@/components/shared/SearchOverlay';
import AirdropModal from '@/components/airdrop/AirdropModal';
import { Providers } from './providers';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { Analytics } from '@vercel/analytics/next';
import InitFrameSDK from '@/hooks/init-frame-sdk';
import { SkaterData } from '@/types/leaderboard';

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<SkaterData[]>([]);
  const [errorLeaderboard, setErrorLeaderboard] = useState<string | null>(null);
  const {
    isOpen: isAirdropOpen,
    onOpen: onAirdropOpen,
    onClose: onAirdropClose,
  } = useDisclosure();

  // Fetch leaderboard data when AirdropModal opens
  const fetchLeaderboardData = async () => {
    setErrorLeaderboard(null);
    try {
      const res = await fetch('https://api.skatehive.app/api/skatehive', {
        next: { revalidate: 300 },
      });
      if (res.ok) {
        const data = await res.json();
        setLeaderboardData(Array.isArray(data) ? data : []);
      } else {
        setErrorLeaderboard(`Failed to fetch leaderboard data: ${res.status}`);
      }
    } catch (error) {
      setErrorLeaderboard('Error fetching leaderboard data');
    }
  };

  useEffect(() => {
    if (isAirdropOpen && leaderboardData.length === 0 && !errorLeaderboard) {
      fetchLeaderboardData();
    }
  }, [isAirdropOpen, leaderboardData.length, errorLeaderboard]);

  // Global keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Theme and splash screen handling
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'skate';
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.add('show-splash');

    const splash = document.getElementById('splash-root');
    const app = document.getElementById('app-root');
    if (splash && app) {
      splash.style.display = 'none';
      app.style.display = '';
      document.body.classList.remove('show-splash');
    }
  }, []);

  if (!isHydrated) {
    return (
      <>
        <Analytics />
        <Providers>
          <NotificationProvider>
            <InnerLayout
              searchProps={{ isSearchOpen, setIsSearchOpen }}
              airdropProps={{
                isAirdropOpen,
                onAirdropOpen,
                onAirdropClose,
                leaderboardData,
                errorLeaderboard,
                retryFetchLeaderboard: fetchLeaderboardData,
              }}
            >
              {children}
            </InnerLayout>
          </NotificationProvider>
        </Providers>
      </>
    );
  }

  if (loading) return <SplashScreen onFinish={() => setLoading(false)} />;

  return (
    <>
      <InitFrameSDK />
      <Analytics />
      <Providers>
        <NotificationProvider>
          <InnerLayout
            searchProps={{ isSearchOpen, setIsSearchOpen }}
            airdropProps={{
              isAirdropOpen,
              onAirdropOpen,
              onAirdropClose,
              leaderboardData,
              errorLeaderboard,
              retryFetchLeaderboard: fetchLeaderboardData,
            }}
          >
            {children}
          </InnerLayout>
        </NotificationProvider>
      </Providers>
    </>
  );
}

function InnerLayout({
  children,
  searchProps,
  airdropProps,
}: {
  children: React.ReactNode;
  searchProps?: {
    isSearchOpen: boolean;
    setIsSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  };
  airdropProps?: {
    isAirdropOpen: boolean;
    onAirdropOpen: () => void;
    onAirdropClose: () => void;
    leaderboardData: SkaterData[];
    errorLeaderboard: string | null;
    retryFetchLeaderboard: () => void;
  };
}) {
  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleOpenAirdrop = () => {
    if (searchProps) {
      searchProps.setIsSearchOpen(false);
    }
    if (airdropProps) {
      airdropProps.onAirdropOpen();
    }
  };

  return (
    <Container
      maxW="full"
      overflowX="hidden"
      sx={{
        '&::-webkit-scrollbar': { display: 'none' },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {searchProps && (
        <SearchOverlay
          isOpen={searchProps.isSearchOpen}
          onClose={() => searchProps.setIsSearchOpen(false)}
          onOpenAirdrop={handleOpenAirdrop}
        />
      )}

      {airdropProps && (
        <AirdropModal
          isOpen={airdropProps.isAirdropOpen}
          onClose={airdropProps.onAirdropClose}
          leaderboardData={airdropProps.leaderboardData}
          errorLeaderboard={airdropProps.errorLeaderboard}
          retryFetchLeaderboard={airdropProps.retryFetchLeaderboard}
        />
      )}

      <Flex direction={{ base: 'column', md: 'row' }} minH="100vh">
        <Sidebar />
        <Box
          flex="1"
          w="full"
          overflowY="auto"
          overflowX="hidden"
          minH="100vh"
          sx={{
            '&::-webkit-scrollbar': {
              display: 'none',
              width: '0',
              height: '0',
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {children}
        </Box>
      </Flex>
      {isMobile && <FooterNavButtons />}
    </Container>
  );
}
