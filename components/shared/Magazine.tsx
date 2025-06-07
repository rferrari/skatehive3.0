'use client';
import { useState, useRef, useMemo, useEffect } from 'react';
import { Box, Flex, VStack, Text, Heading, Badge, Divider, HStack, Center, Image } from '@chakra-ui/react';
import HTMLFlipBook from 'react-pageflip';
import { Discussion } from '@hiveio/dhive';
import { getPayoutValue, findPosts } from '@/lib/hive/client-functions';
import AuthorAvatar from '@/components/blog/PostCard'; // Update this import if you have a dedicated AuthorAvatar
import markdownRenderer from '@/lib/utils/MarkdownRenderer';
import LoadingComponent from '../homepage/loadingComponent';
import MatrixOverlay from '@/components/graphics/MatrixOverlay';

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
  width: '100vw',
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
const blackShadow = '0 4px 32px #000, 0 8px 48px #000, 0 0 8px #000, 0 0 2px #000';
const retroBoxShadow = '0 0 0 2px #232526, 0 0 8px #39FF14';

const coverStyles = {
  ...pageStyles,
  borderRadius: '0px 16px 0px 0px',
  background: 'transparent',
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

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.2; // Set to 20% volume
    }
  }, []);

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
    return <LoadingComponent />;
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
    <VStack {...backgroundGradient} width="100%" height="100vh" alignItems="flex-start" justifyContent="flex-start" spacing={0}>
      <audio ref={audioRef} src="/pageflip.mp3" preload="auto" />
      <HTMLFlipBook
        width={1000}
        height={1300}
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
        showCover={false}
        mobileScrollSupport
        swipeDistance={50}
        clickEventForward={false}
        useMouseEvents
        renderOnlyPageLengthChange={true}
        showPageCorners={false}
        disableFlipByClick={true}
        className="flipbook"
        style={{ width: '100%', height: '100vh' }}
        ref={flipBookRef}
        onInit={(instance) => {
          flipBookRef.current = instance;
        }}
        onFlip={(e) => {
          playSound();
        }}
      >
        <Box sx={coverStyles} width="100%" height="100%" position="relative" overflow="hidden">
          {/* Matrix effect as background */}
          <Box
            position="absolute"
            top={0}
            left={0}
            width="100%"
            height="100%"
            zIndex={0}
            pointerEvents="none"
          >
            <MatrixOverlay coverMode />
          </Box>
          <Flex
            direction="column"
            alignItems="center"
            justifyContent="center"
            width="100%"
            height="100%"
            position="relative"
            zIndex={1}
          >
            {/* Text content above image, overlapping bottom of image */}
            <Box
              zIndex={2}
              position="relative"
              mb={-16}
              textAlign="center"
            >
              <Heading
                size="2xl"
                fontWeight="extrabold"
                letterSpacing="tight"
                mb={2}
                style={{ ...retroFont, textShadow: blackShadow, color: neonGreen }}
              >
                SkateHive Magazine
              </Heading>
              <Text
                fontSize="xl"
                color={neonGreen}
                mb={4}
                style={{ ...retroFont, textShadow: blackShadow }}
              >
                The Community Skateboarding Zine
              </Text>
            </Box>
            {/* Cover image */}
            <Image
              src="/images/covers/nogenta_cover.png"
              alt="SkateHive Cover"
              maxHeight="500px"
              maxWidth="100%"
              width="auto"
              loading="lazy"
              borderRadius="lg"
              boxShadow="xl"
              zIndex={1}
            />
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
              overflow="hidden"
              display="flex"
              flexDirection="column"
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
              <Box flex="1 1 0%" minHeight={0} overflowY="auto" overflowX="hidden" width="100%">
                <div className="magazine-content" dangerouslySetInnerHTML={{ __html: markdownRenderer(post.body) }} />
              </Box>
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