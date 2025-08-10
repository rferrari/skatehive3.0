import { Box, Heading, OrderedList, ListItem } from '@chakra-ui/react';
import { PixDashboardData } from './PIXTabContent';

interface PixTransferGuideProps {
  pixDashboardData: PixDashboardData;
  language: 'en' | 'pt';
}

const PixTransferGuide = ({ pixDashboardData, language }: PixTransferGuideProps) => {
  const content = {
    en: {
      title: '💲 PIX to HBD',
      steps: [
        `Send a PIX transfer to this Key: <strong>${pixDashboardData.pixbeePixKey}</strong>`,
        'In the PIX MESSAGE, specify the HIVE account to be credited with HBD. Example: "skater"',
        'To buy HIVE, specify hive after your account. Example: "skater420 hive"',
        'Check <i>Skatebank Balance</i> above. If greater than our balance, your PIX will be refunded.',
        'Send the PIX transfer and wait for the transfer.',
      ],
    },
    pt: {
      title: '💲 PIX para HBD',
      steps: [
        `Envie uma transferência para esta Chave PIX: <strong>${pixDashboardData.pixbeePixKey}</strong>`,
        'Na MENSAGEM PIX, especifique a conta HIVE a ser creditada com HBD. Exemplo: "skater"',
        'Se quiser comprar HIVE, especifique hive após sua conta. Exemplo: "skater420 hive"',
        'Verifique o <i>Saldo Skatebank</i> acima. Se for superior ao saldo, seu PIX será reembolsado.',
        'Envie a transferência PIX e aguarde a transferência.',
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
      <OrderedList pl={4} color="text">
        {content[language].steps.map((step, index) => (
          <ListItem key={index} mb={1} dangerouslySetInnerHTML={{ __html: step }} />
        ))}
      </OrderedList>
    </Box>
  );
};

export default PixTransferGuide;
