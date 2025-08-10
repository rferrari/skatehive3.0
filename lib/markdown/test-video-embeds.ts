import markdownRenderer from './MarkdownRenderer';

// Test cases to verify video embeds still work after sanitization
export function testVideoEmbeds() {
    const testCases = [
        {
            name: '3Speak Video',
            input: '[![3Speak](https://img.3speak.tv/thumbnail/somevideo/default.png)](https://3speak.tv/watch?v=user/somevideo)',
            expected: 'should contain 3speak.tv/embed iframe'
        },
        {
            name: 'YouTube Video',
            input: '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>',
            expected: 'should contain youtube.com/embed iframe'
        },
        {
            name: 'Vimeo Video', 
            input: '<iframe src="https://player.vimeo.com/video/123456789" frameborder="0" allowfullscreen></iframe>',
            expected: 'should contain vimeo.com iframe'
        },
        {
            name: 'IPFS Video',
            input: '![Video](https://ipfs.skatehive.app/ipfs/QmVideoHash123.mp4)',
            expected: 'should contain ipfs.skatehive.app video element'
        },
        {
            name: 'Malicious Script (should be removed)',
            input: '<script>alert("XSS")</script><iframe src="https://malicious.com"></iframe>',
            expected: 'should NOT contain script or malicious iframe'
        }
    ];

    console.log('Testing video embeds after DOMPurify sanitization...\n');
    
    testCases.forEach(testCase => {
        const result = markdownRenderer(testCase.input);
        console.log(`Test: ${testCase.name}`);
        console.log(`Input: ${testCase.input}`);
        console.log(`Output: ${result}`);
        console.log(`Expected: ${testCase.expected}`);
        console.log('---\n');
    });
}

// Export for potential use in development
if (typeof window !== 'undefined' && (window as any).testSkateHiveVideos) {
    (window as any).testSkateHiveVideos = testVideoEmbeds;
}
