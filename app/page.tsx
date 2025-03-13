'use client';

import { Container, Flex } from '@chakra-ui/react';
import TweetList from '@/components/homepage/TweetList';
import RightSidebar from '@/components/layout/RightSideBar';
import { useState } from 'react';
import { Comment } from '@hiveio/dhive'; // Ensure this import is consistent
import Conversation from '@/components/homepage/Conversation';
import TweetReplyModal from '@/components/homepage/TweetReplyModal';
import { useSnaps } from '@/hooks/useSnaps';

export default function Home() {
  //console.log('author', process.env.NEXT_PUBLIC_THREAD_AUTHOR);
  const thread_author = 'peak.snaps';
  const thread_permlink = 'snaps';

  const [conversation, setConversation] = useState<Comment | undefined>();
  const [reply, setReply] = useState<Comment>();
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState<Comment | null>(null); // Define the state

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const handleNewComment = (newComment: Partial<Comment> | CharacterData) => {
    setNewComment(newComment as Comment);
  };

  const snaps = useSnaps();

  return (
    <Flex direction={{ base: 'column', md: 'row' }}>
      <Container
        maxW={{ base: '100%', md: '720px' }}
        h="100vh"
        overflowY="auto"
        pr={2}
        pt={2}
        position={"sticky"}
        top={0}
        justifyContent="center"
        flex="1"
        sx={
          {
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            scrollbarWidth: 'none',
          }
        }
        id='scrollableDiv'>
        {!conversation ? (


          <TweetList
            author={thread_author}
            permlink={thread_permlink}
            setConversation={setConversation}
            onOpen={onOpen}
            setReply={setReply}
            newComment={newComment}
            setNewComment={setNewComment} // Add the missing prop
            data={snaps}
          />
        ) : (
          <Conversation comment={conversation} setConversation={setConversation} onOpen={onOpen} setReply={setReply} />
        )}
      </Container>
      <RightSidebar />
      {isOpen && <TweetReplyModal isOpen={isOpen} onClose={onClose} comment={reply} onNewReply={handleNewComment} />}
    </Flex>
  );
}