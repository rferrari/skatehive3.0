import React, { useState, useEffect } from 'react';
import { Box, Image, Text, Link, VStack, HStack, Skeleton } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';

interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url: string;
  siteName?: string;
}

interface OpenGraphPreviewProps {
  url: string;
}

const OpenGraphPreview: React.FC<OpenGraphPreviewProps> = ({ url }) => {
  const [ogData, setOgData] = useState<OpenGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchOpenGraphData = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // Use a service to fetch OpenGraph data
        // For now, we'll create a simple fallback with domain extraction
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');
        
        // Try to fetch from our API endpoint (you'll need to create this)
        try {
          const response = await fetch(`/api/opengraph?url=${encodeURIComponent(url)}`);
          if (response.ok) {
            const data = await response.json();
            setOgData(data);
          } else {
            throw new Error('API failed');
          }
        } catch (apiError) {
          // Fallback to basic URL data
          setOgData({
            title: domain,
            description: url,
            url: url,
            siteName: domain,
          });
        }
      } catch (err) {
        setError(true);
        console.error('Error fetching OpenGraph data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOpenGraphData();
  }, [url]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={2} mb={2}>
        <Box
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          overflow="hidden"
          maxW="400px"
        >
          <Skeleton height="200px" />
          <Box p={3}>
            <Skeleton height="20px" mb={2} />
            <Skeleton height="16px" width="80%" />
          </Box>
        </Box>
      </Box>
    );
  }

  if (error || !ogData) {
    return null;
  }

  return (
    <Box display="flex" justifyContent="center" mt={2} mb={2}>
      <Link href={url} isExternal _hover={{ textDecoration: 'none' }}>
        <Box
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          overflow="hidden"
          maxW="400px"
          cursor="pointer"
          transition="all 0.2s"
          _hover={{
            borderColor: 'primary',
            transform: 'translateY(-2px)',
            boxShadow: 'md',
          }}
        >
        {ogData.image && (
          <Image
            src={ogData.image}
            alt={ogData.title || 'Preview'}
            width="100%"
            height="200px"
            objectFit="cover"
            fallback={
              <Box
                width="100%"
                height="200px"
                bg="gray.100"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <ExternalLinkIcon color="gray.400" boxSize={8} />
              </Box>
            }
          />
        )}
        <Box p={3}>
          <VStack align="start" spacing={1}>
            {ogData.title && (
              <Text
                fontWeight="semibold"
                fontSize="sm"
                noOfLines={2}
                color="primary"
              >
                {ogData.title}
              </Text>
            )}
            {ogData.description && (
              <Text
                fontSize="xs"
                color="gray.600"
                noOfLines={2}
                lineHeight="1.3"
              >
                {ogData.description}
              </Text>
            )}
            <HStack spacing={1} align="center">
              <ExternalLinkIcon color="gray.400" boxSize={3} />
              <Text fontSize="xs" color="gray.500">
                {ogData.siteName || new URL(url).hostname.replace('www.', '')}
              </Text>
            </HStack>
          </VStack>
        </Box>
      </Box>
    </Link>
    </Box>
  );
};

export default OpenGraphPreview;
