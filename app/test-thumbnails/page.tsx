'use client';

import { Box, Button, Input, VStack, Text } from '@chakra-ui/react';
import { useState } from 'react';
import VideoWithThumbnail from '@/components/shared/VideoWithThumbnail';

export default function VideoThumbnailTest() {
    const [testVideoUrl, setTestVideoUrl] = useState('');
    const [showVideo, setShowVideo] = useState(false);

    // Example IPFS video URL for testing
    const exampleUrl = 'https://ipfs.skatehive.app/ipfs/QmYourVideoHashHere';

    const handleTest = () => {
        if (testVideoUrl) {
            setShowVideo(true);
            console.log('🧪 Testing video URL:', testVideoUrl);
        }
    };

    return (
        <VStack spacing={6} p={8} maxW="800px" mx="auto">
            <Text fontSize="2xl" fontWeight="bold">
                🧪 Video Thumbnail Test Page
            </Text>

            <Box width="100%">
                <Text mb={2}>Enter IPFS Video URL:</Text>
                <Input
                    value={testVideoUrl}
                    onChange={(e) => setTestVideoUrl(e.target.value)}
                    placeholder="https://ipfs.skatehive.app/ipfs/QmYourHash"
                />
            </Box>

            <Button
                onClick={handleTest}
                colorScheme="blue"
                disabled={!testVideoUrl}
            >
                🔍 Test Thumbnail Loading
            </Button>

            <Text fontSize="sm" color="gray.600">
                Open browser DevTools (F12) to see debugging output and breakpoints
            </Text>

            {showVideo && (
                <Box width="100%" height="400px" border="2px dashed gray">
                    <Text mb={2} fontWeight="bold">Testing: {testVideoUrl}</Text>
                    <VideoWithThumbnail
                        src={testVideoUrl}
                        style={{
                            width: '100%',
                            height: '350px',
                            border: '1px solid #ccc',
                            borderRadius: '8px'
                        }}
                    />
                </Box>
            )}

            <Box p={4} bg="gray.50" borderRadius="md" width="100%">
                <Text fontWeight="bold" mb={2}>🔧 Debug Steps:</Text>
                <ol style={{ paddingLeft: '20px' }}>
                    <li>Open DevTools (F12) and go to Console tab</li>
                    <li>Enter a video URL that you uploaded recently</li>
                    <li>Click &quot;Test Thumbnail Loading&quot;</li>
                    <li>Watch the console logs and step through debugger breakpoints</li>
                    <li>Verify thumbnail appears before video loads</li>
                </ol>
            </Box>
        </VStack>
    );
}
