import { Box, Heading, Text, Link } from '@chakra-ui/react';

interface PIXFAQProps {
  language: 'en' | 'pt';
}

const PIXFAQ = ({ language }: PIXFAQProps) => {
  const content = {
    en: {
      title: '❓ FAQ',
      question: 'What should I do if my transfer doesn’t work?',
      answer: [
        'Stay calm, it will arrive or we will refund you.',
        'Our team always receives notifications of transactions in case of failure.',
        {
          text: 'If you wish, open a support ticket on our ',
          link: {
            href: 'https://discord.gg/eAQfS97wHK',
            text: 'Discord channel',
          },
        },
      ],
    },
    pt: {
      title: '❓ FAQ',
      question: 'O que eu faço caso minha transferência não funcione?',
      answer: [
        'Calma, ele vai chegar ou vamos te reembolsar.',
        'Nosso time sempre recebe notificações das transações em caso de falha.',
        {
          text: 'Caso queira, abra um ticket de suporte em nosso ',
          link: {
            href: 'https://discord.gg/eAQfS97wHK',
            text: 'Discord',
          },
        },
      ],
    },
  };

  return (
    <Box
      p={4}
      bg="background"
      borderRadius="lg"
      border="1px solid"
      borderColor="muted"
      position="relative"
    >
      <Heading size="sm" mb={4} color="primary" fontFamily="Joystix">
        {content[language].title}
      </Heading>
      <Text as="strong">{content[language].question}</Text>
      {content[language].answer.map((item, index) => (
        <Text key={index} mb={2}>
          {typeof item === 'string' ? (
            item
          ) : (
            <>
              {item.text}
              <Link href={item.link.href} isExternal color="blue.500">
                {item.link.text}
              </Link>
            </>
          )}
        </Text>
      ))}
    </Box>
  );
};

export default PIXFAQ;
