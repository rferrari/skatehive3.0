'use client';

import { Flex, Box } from '@chakra-ui/react';
import SnapList from '@/components/homepage/SnapList';
import RightSidebar from '@/components/layout/RightSideBar';
import { useState } from 'react';
import { Discussion } from '@hiveio/dhive';
import Conversation from '@/components/homepage/Conversation';
import SnapReplyModal from '@/components/homepage/SnapReplyModal';
import { useSnaps } from '@/hooks/useSnaps';

export default function HomePageClient() {
  const thread_author = 'peak.snaps';
  const thread_permlink = 'snaps';

  const [conversation, setConversation] = useState<Discussion | undefined>();
  const [reply, setReply] = useState<Discussion>();
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState<Discussion | null>(null);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const handleNewComment = (newComment: Partial<Discussion> | CharacterData) => {
    setNewComment(newComment as Discussion);
  };

  const snaps = useSnaps();

  return (
    <Flex
      direction={{ base: 'column', md: 'row' }}
      justifyContent="center"
      w="full"
      h="100vh"
      mt={0}
      gap={{ md: 4 }} // 16px gap between SnapList and RightSidebar on md and above
    >
      <Box
        maxH="calc(100vh - 0px)" // Account for potential 40px top + 40px bottom padding
        overflowY="auto"
        overflowX="hidden" // Prevent horizontal overflow from media
        w={{ base: '100%', md: 'calc(100% - 300px)', lg: 'calc(100% - 350px)' }}
        maxW={{ md: '700px', lg: '800px' }} // Limit SnapList container size
        p={{ base: 0, md: 2 }}
        pt={0}
        mt={0}
        boxSizing="border-box"
        sx={{
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
        }}
        id="scrollableDiv"
      >
        {!conversation ? (
          <SnapList
            author={thread_author}
            permlink={thread_permlink}
            setConversation={setConversation}
            onOpen={onOpen}
            setReply={setReply}
            newComment={newComment}
            setNewComment={setNewComment}
            data={snaps}
          />
        ) : (
          <Conversation
            discussion={conversation}
            setConversation={setConversation}
            onOpen={onOpen}
            setReply={setReply}
          />
        )}
      </Box>
      <Box
        display={{ base: 'none', md: 'block', lg: 'block' }}
        w={{ md: '300px', lg: '350px' }} // Increased RightSidebar width
        maxW={{ md: '30%', lg: '35%' }} // Adjusted max width
      >
        <RightSidebar />
      </Box>
      {isOpen && (
        <SnapReplyModal
          isOpen={isOpen}
          onClose={onClose}
          discussion={reply}
          onNewReply={handleNewComment}
        />
      )}
    </Flex>
  );
}
