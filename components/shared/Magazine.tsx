'use client';
import { useState, useRef, useMemo, useEffect } from 'react';
import { Box, Flex, VStack, Text, Heading, Badge, Divider, HStack, Center, Image } from '@chakra-ui/react';
import HTMLFlipBook from 'react-pageflip';
import { Discussion } from '@hiveio/dhive';
import { getPayoutValue, findPosts } from '@/lib/hive/client-functions';
import AuthorAvatar from '@/components/blog/PostCard'; // Update this import if you have a dedicated AuthorAvatar
import markdownRenderer from '@/lib/utils/MarkdownRenderer';

function useMagazinePosts(query: string, tag: { tag: string; limit: number }[]) {
  const [posts, setPosts] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setPosts([]);
    findPosts(query, tag)
      .then((data) => {
        if (isMounted) {
          setPosts(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Error fetching posts');
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [query, JSON.stringify(tag)]);

  return { posts, error, isLoading };
}

const backgroundGradient = {
  minHeight: '100vh',
  width: '100%',
  height: '100vh',
  p: 0,
  m: 0,
  overflow: 'hidden',
};

const pageStyles = {
  background: 'linear-gradient(135deg,rgb(8, 8, 8) 80%,rgb(51, 54, 57) 100%)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: '32px 28px 48px 28px',
  color: '#232526',
  overflow: 'auto',
  position: 'relative',
  minHeight: 400,
  zIndex: 1,
  border: '1px solid #e0e7ef',
};

const flipbookStyles = {
  width: '100%',
  maxWidth: '900px',
  height: '100vh',
  margin: '0 auto',
  transition: 'none',
};

const retroFont = {
  fontFamily: `'Joystix', 'VT323', 'Fira Mono', 'monospace'`,
  letterSpacing: '0.5px',
};
const neonGreen = '#39FF14';
const neonShadow = '0 0 8px #39FF14, 0 0 16px #39FF14';
const retroBoxShadow = '0 0 0 2px #232526, 0 0 8px #39FF14';

const coverStyles = {
  ...pageStyles,
  borderRadius: '0px 16px 0px 0px',
  background: 'linear-gradient(120deg,rgba(56, 161, 105, 0.6),rgb(5, 5, 5) 100%)',
  color: neonGreen,
  backgroundSize: 'cover',
  textAlign: 'center',
  boxShadow: retroBoxShadow,
  ...retroFont,
};

const backCoverStyles = {
  ...pageStyles,
  background: 'linear-gradient(120deg, #b31217 60%, #e52d27 100%)',
  color: 'white',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundImage:
    'url(https://media1.giphy.com/media/9ZsHm0z5QwSYpV7g01/giphy.gif?cid=6c09b952uxaerotyqa9vct5pkiwvar6l6knjgsctieeg0sh1&ep=v1_gifs_search&rid=giphy.gif&ct=g)',
  backgroundSize: 'cover',
  boxShadow: '0 8px 32px 0 rgba(179,18,23,0.25)',
};

export interface MagazineProps {
  tag: { tag: string; limit: number }[];
  query: string;
}

export default function Magazine({ tag, query }: MagazineProps) {
  const { posts, error, isLoading } = useMagazinePosts(query, tag);
  const flipBookRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Memoize filtered and sorted posts for performance
  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    // TODO: Add your blocked users logic if needed
    return posts.sort((a, b) => Number(getPayoutValue(b as any)) - Number(getPayoutValue(a as any)));
  }, [posts]);

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0.02;
      audioRef.current.play();
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" w="100vw" h="100vh" p={5}>
        <Text color={"white"}>Use your mouse to flip pages and scroll the pages</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex justify="center" align="center" w="100%" h="100%" p={5}>
        <Text color={"white"}>Error loading posts</Text>
      </Flex>
    );
  }

  if (!filteredPosts.length) {
    return (
      <Flex justify="center" align="center" w="100vw" h="100vh" p={5}>
        <Text>No posts available</Text>
      </Flex>
    );
  }

  return (
    <VStack {...backgroundGradient} width="100%" height="100vh" alignItems="stretch" justifyContent="flex-start" spacing={0} p={0} m={0}>
      <audio ref={audioRef} src="/pageflip.mp3" preload="auto" />
      <HTMLFlipBook
        width={window.innerWidth}
        height={window.innerHeight}
        minWidth={0}
        maxWidth={10000}
        minHeight={0}
        maxHeight={10000}
        startPage={0}
        size="stretch"
        drawShadow={false}
        flippingTime={1000}
        usePortrait
        startZIndex={0}
        autoSize={true}
        maxShadowOpacity={0.2}
        showCover={true}
        mobileScrollSupport
        swipeDistance={50}
        clickEventForward={false}
        useMouseEvents
        renderOnlyPageLengthChange={true}
        showPageCorners={false}
        disableFlipByClick={true}
        className="flipbook"
        style={{ width: '100%', height: '100vh', margin: 0, padding: 0, boxSizing: 'border-box' }}
        ref={flipBookRef}
        onInit={(instance) => {
          flipBookRef.current = instance;
        }}
        onFlip={(e) => {
          playSound();
        }}
      >
        <Box sx={coverStyles} width="100%" height="100%" p={0} m={0}>
          <Flex direction="column" alignItems="center" justifyContent="center" width="100%" height="100%">
            <Image src="/cover.png" alt="SkateHive Logo" maxHeight="300px" maxWidth="80%" loading="lazy" borderRadius="lg" boxShadow="xl" mb={6} />
            <Heading size="2xl" fontWeight="extrabold" letterSpacing="tight" mb={2} style={{ ...retroFont, textShadow: neonShadow, color: neonGreen }}>
              SkateHive Magazine
            </Heading>
            <Text fontSize="xl" color={neonGreen} mb={4} style={{ ...retroFont, textShadow: neonShadow }}>
              The Community Skateboarding Zine
            </Text>
            <Badge fontSize="lg" px={4} py={2} borderRadius="md" mb={4} bg={neonGreen} color="#181c1b" boxShadow={neonShadow} style={{ ...retroFont }}>
              Issue ∞
            </Badge>
          </Flex>
        </Box>
        {filteredPosts.map((post: Discussion, index) => {
          const isLeftPage = index % 2 === 0;
          const pageBorderRadius = isLeftPage
            ? '16px 0 0 0px'
            : '0 16px 0px 0';
          return (
            <Box
              key={`${post.id}-${index}`}
              sx={{ ...pageStyles, borderRadius: pageBorderRadius }}
              position="relative"
              width="100%"
              height="100%"
              p={0}
              m={0}
            >
              <Flex align="center" mb={2} gap={2}>
                <Image
                  src={`https://images.hive.blog/u/${post.author}/avatar/small`}
                  alt={post.author}
                  boxSize="32px"
                  borderRadius="full"
                  mr={2}
                />
                <Text fontSize="sm" color={neonGreen} style={retroFont} fontWeight="bold">
                  @{post.author}
                </Text>
                <Text fontSize="xs" color="#A6E22E" style={retroFont} ml={2}>
                  {new Date(post.created).toLocaleDateString()}
                </Text>
                <Badge variant={'solid'} bg={neonGreen} color="#181c1b" h={'24px'} minW={'48px'} px={2} borderRadius={8} display="flex" alignItems="center" justifyContent="center" fontWeight="bold" style={retroFont} ml={2}>
                  ${Number(getPayoutValue(post as any)).toFixed(2)}
                </Badge>
              </Flex>
              <Heading fontSize="lg" color={neonGreen} style={retroFont} mb={2}>
                {post.title}
              </Heading>
              <Divider mt={2} mb={2} />
              <Box flex={1} overflowY="auto" maxH="60vh" sx={{ width: '100%' }}>
                <div dangerouslySetInnerHTML={{ __html: markdownRenderer(post.body) }} />
              </Box>
              <Divider mt={2} mb={2} />
              <Flex justifyContent={'flex-end'} alignItems="center">
                <Text fontSize="xs" color="gray.400">
                  Payout: ${Number(getPayoutValue(post as any)).toFixed(2)}
                </Text>
              </Flex>
            </Box>
          );
        })}
        <Box sx={backCoverStyles}>
          <Heading>Back Cover</Heading>
          <Text>Last Page</Text>
        </Box>
      </HTMLFlipBook>
    </VStack>
  );
} 