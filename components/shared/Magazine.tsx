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
import { useTheme } from '@/app/themeProvider';

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
          // Normalize data to always be an array
          let postsArray = [];
          if (Array.isArray(data)) {
            postsArray = data;
          } else if (data && typeof data === 'object') {
            postsArray = [data];
          }
          setPosts(postsArray);
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

const magazineGrayGradient = (theme: any) => `linear-gradient(135deg, ${theme.colors.background} 80%, ${theme.colors.muted} 100%)`;
const magazineAccentGradient = (theme: any) => `linear-gradient(135deg, ${theme.colors.primary} 60%, ${theme.colors.accent} 100%)`;

const backgroundGradient = {
  minHeight: '100%',
  width: '100%',
  p: 0,
  m: 0,
  overflow: 'hidden',
};

const pageStyles = (theme: any) => ({
  background: `linear-gradient(135deg,${theme.colors.background} 80%,${theme.colors.muted} 100%)`,
  borderRadius: '16px',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: '32px 28px 48px 28px',
  color: theme.colors.text,
  overflow: 'auto',
  position: 'relative',
  minHeight: 400,
  zIndex: 1,
  border: `1px solid ${theme.colors.border || '#e0e7ef'}`,
});

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
const retroBoxShadow = (theme: any) => `0 0 0 2px ${theme.colors.text}, 0 0 8px ${theme.colors.primary}`;

const coverStyles = (theme: any) => ({
  ...pageStyles(theme),
  borderRadius: '0px 16px 0px 0px',
  background: 'transparent',
  color: theme.colors.primary,
  backgroundSize: 'cover',
  textAlign: 'center',
  boxShadow: retroBoxShadow(theme),
  fontFamily: `'Joystix', 'VT323', 'Fira Mono', 'monospace'`,
  letterSpacing: '0.5px',
});

const backCoverStyles = (theme: any) => ({
  ...pageStyles(theme),
  background: `linear-gradient(120deg, ${theme.colors.primary} 60%, ${theme.colors.accent} 100%)`,
  color: theme.colors.text,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundImage:
    'url(https://media1.giphy.com/media/9ZsHm0z5QwSYpV7g01/giphy.gif?cid=6c09b952uxaerotyqa9vct5pkiwvar6l6knjgsctieeg0sh1&ep=v1_gifs_search&rid=giphy.gif&ct=g)',
  backgroundSize: 'cover',
  boxShadow: '0 8px 32px 0 rgba(179,18,23,0.25)',
});

export interface MagazineProps {
  posts?: Discussion[];
  isLoading?: boolean;
  error?: string | null;
  // For community magazine, still accept tag/query
  tag?: { tag: string; limit: number }[];
  query?: string;
}

// Add a function to ensure all YouTube iframes have enablejsapi=1 in their src
function addEnableJsApiToYouTubeIframes(html: string) {
  return html.replace(
    /<iframe([^>]+src="https:\/\/www\.youtube\.com\/embed\/[^\"]+)([^>]*)>/g,
    (match, beforeSrc, afterSrc) => {
      if (beforeSrc.includes('enablejsapi=1')) return match;
      if (beforeSrc.includes('?')) {
        return `<iframe${beforeSrc}&enablejsapi=1${afterSrc}>`;
      } else {
        return `<iframe${beforeSrc}?enablejsapi=1${afterSrc}>`;
      }
    }
  );
}

export default function Magazine(props: MagazineProps) {
  const { theme } = useTheme();
  const flipBookRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // If tag and query are provided, use the hook to fetch posts
  const magazinePosts = useMagazinePosts(props.query!, props.tag!);
  const posts = props.tag && props.query ? magazinePosts.posts : props.posts || [];
  const isLoading = props.tag && props.query ? magazinePosts.isLoading : props.isLoading || false;
  const error = props.tag && props.query ? magazinePosts.error : props.error || null;

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
    <VStack
      {...backgroundGradient}
      width="100%"
      height="100%"
      alignItems="flex-start"
      justifyContent="flex-start"
      spacing={0}
      sx={{
        '&::-webkit-scrollbar': { display: 'none' },
        scrollbarWidth: 'none',
        overflowY: 'hidden',
      }}
    >
      <audio ref={audioRef} src="/pageflip.mp3" preload="auto" />
      <HTMLFlipBook
        className="flipbook hide-scrollbar"
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
        style={{ width: '100%', height: '100vh' }}
        ref={flipBookRef}
        onInit={(instance) => {
          flipBookRef.current = instance;
        }}
        onFlip={(e) => {
          playSound();
          // Pause all native videos
          const videos = document.querySelectorAll('.flipbook video');
          videos.forEach((video) => {
            const vid = video as HTMLVideoElement;
            if (!vid.paused) {
              vid.pause();
            }
          });
          // Pause all iframe videos
          const iframes = document.querySelectorAll('.flipbook iframe');
          iframes.forEach((iframe) => {
            const ifr = iframe as HTMLIFrameElement;
            if (ifr.src.includes('youtube.com/embed')) {
              ifr.contentWindow?.postMessage(
                JSON.stringify({
                  event: 'command',
                  func: 'pauseVideo',
                  args: [],
                }),
                '*'
              );
            } else if (ifr.src.includes('skatehype.com/ifplay.php') || ifr.src.includes('3speak.tv')) {
              const oldSrc = ifr.src;
              ifr.src = '';
              setTimeout(() => {
                ifr.src = oldSrc;
              }, 100);
            }
          });
        }}
        onUpdate={() => {}}
      >
        <Box sx={coverStyles(theme)} width="100%" height="100%" position="relative" overflow="hidden">
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
                style={{ fontFamily: `'Joystix', 'VT323', 'Fira Mono', 'monospace'`, textShadow: '0 4px 32px #000, 0 8px 48px #000, 0 0 8px #000, 0 0 2px #000', color: theme.colors.primary }}
              >
                SkateHive Magazine
              </Heading>
              <Text
                fontSize="xl"
                color={theme.colors.primary}
                mb={4}
                style={{ fontFamily: `'Joystix', 'VT323', 'Fira Mono', 'monospace'`, textShadow: '0 4px 32px #000, 0 8px 48px #000, 0 0 8px #000, 0 0 2px #000' }}
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
              sx={{ ...pageStyles(theme), borderRadius: pageBorderRadius }}
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
                <Text fontSize="sm" color={theme.colors.primary} style={{ fontFamily: `'Joystix', 'VT323', 'Fira Mono', 'monospace'`, letterSpacing: '0.5px' }} fontWeight="bold">
                  @{post.author}
                </Text>
                <Text fontSize="xs" color={theme.colors.accent} style={{ fontFamily: `'Joystix', 'VT323', 'Fira Mono', 'monospace'`, letterSpacing: '0.5px' }} ml={2}>
                  {new Date(post.created).toLocaleDateString()}
                </Text>
                <Badge variant={'solid'} bg={theme.colors.primary} color={theme.colors.background} h={'24px'} minW={'48px'} px={2} borderRadius={8} display="flex" alignItems="center" justifyContent="center" fontWeight="bold" style={{ fontFamily: `'Joystix', 'VT323', 'Fira Mono', 'monospace'`, letterSpacing: '0.5px' }} ml={2}>
                  ${Number(getPayoutValue(post as any)).toFixed(2)}
                </Badge>
              </Flex>
              <Heading fontSize="lg" color={theme.colors.primary} style={{ fontFamily: `'Joystix', 'VT323', 'Fira Mono', 'monospace'`, letterSpacing: '0.5px' }} mb={2}>
                {post.title}
              </Heading>
              <Divider mt={2} mb={2} />
              <Box flex="1 1 0%" minHeight={0} overflowY="auto" overflowX="hidden" width="100%" className="hide-scrollbar">
                <div className="magazine-content" dangerouslySetInnerHTML={{ __html: addEnableJsApiToYouTubeIframes(markdownRenderer(post.body)) }} />
              </Box>
            </Box>
          );
        })}
        <Box sx={backCoverStyles(theme)}>
          <Heading color={theme.colors.primary}>Back Cover</Heading>
          <Text color={theme.colors.text}>Last Page</Text>
        </Box>
      </HTMLFlipBook>
      <style jsx global>{`
        .magazine-content {
          color: var(--chakra-colors-text, #fff);
        }
        .magazine-content iframe {
          max-width: 100%;
          width: 100%;
          display: block;
          margin: 0 auto;
        }
        /* Hide vertical scrollbar for the post body area */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
        /* Aggressively hide all scrollbars within the flipbook and its children */
        .flipbook, .flipbook * {
          scrollbar-width: none !important;      /* Firefox */
          -ms-overflow-style: none !important;   /* IE and Edge */
        }
        .flipbook::-webkit-scrollbar, .flipbook *::-webkit-scrollbar {
          display: none !important;              /* Chrome, Safari */
        }
      `}</style>
    </VStack>
  );
} 