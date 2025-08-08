import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Center,
  Heading,
  Input,
  Select,
  Spinner,
  Text,
  useToast,
  VStack,
  HStack,
  Tooltip,
  OrderedList,
  ListItem,
} from "@chakra-ui/react";
import PIXTransactionHistory from "./PIXTransationHistory";
import { Asset } from "@aioha/aioha";
import { useAioha } from "@aioha/react-ui";
import useHiveAccount from "@/hooks/useHiveAccount";

export interface PixDashboardData {
  pixbeePixKey: string;
  HivePriceBRL: number;
  BRLPriceHive: number;
  HivePriceUSD: number;
  HBDPriceBRL: number;
  BRLPriceHBD: number;
  minRefundHive: number;
  minRefundHbd: number;
  minRefundPix: number;
  depositMinLimit: number;
  balancePix: number;
  balanceHbd: number;
  balanceHive: number;
  balanceTotal: number;
  OurExchangePer: number;
  OurExchangeFee: number;
  OurRefundPer: number;
}

const glowinOptions = {
  method: "GET",
  headers: {
    "ngrok-skip-browser-warning": "69420",
    "Content-Type": "application/json",
  },
};

// 🐝 PIX Form Component
type PIXFormProps = {
  pixDashboardData: PixDashboardData | null;
};

function PIXForm({ pixDashboardData }: PIXFormProps) {
  // Move all hooks to the top level
  const { user, aioha } = useAioha();
  const { hiveAccount, isLoading, error } = useHiveAccount(user || "");
  const [currency, setCurrency] = useState("HBD");
  const [amount, setAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [previewData, setPreviewData] = useState<{
    resAmount: string;
    resMemo: string;
    isValid: boolean;
    translatedNote?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Declare userAvailableHbd before useEffect
  const userAvailableHbd = hiveAccount?.hbd_balance
    ? Number(String(hiveAccount.hbd_balance).split(" ")[0])
    : 0;

  // Use userAvailableHbd in useEffect
  useEffect(() => {
    if (userAvailableHbd > 0) {
      setAmount(String(userAvailableHbd.toFixed(3)));
    }
  }, [userAvailableHbd]);

  // Early return after hooks
  if (!pixDashboardData) {
    return <Text color="red.400">Loading dashboard data...</Text>;
  }

  const checkMemoValidity = (memo: string): { isValid: boolean; translatedNote?: string } => {
    const lowerMemo = memo.toLowerCase();

    if (lowerMemo.includes("inválida") || lowerMemo.includes("nao") || lowerMemo.includes("não")) {
      return {
        isValid: false,
        translatedNote: "❌ Invalid PIX key or PIX amount not available.",
      };
    }

    if (lowerMemo.includes("menor")) {
      return {
        isValid: false,
        translatedNote: "⚠️ Amount is less than the minimum deposit.",
      };
    }

    return { isValid: true };
  };

  const handlePreview = async () => {
    if (!amount || Number(amount) <= 0) {
      toast({ title: "Invalid amount", status: "error", duration: 3000 });
      return;
    }
    if (!pixKey) {
      toast({ title: "PIX key is required", status: "error", duration: 3000 });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("https://aphid-glowing-fish.ngrok-free.app/simulatehbd2pix", {
        method: "POST",
        body: JSON.stringify({ Memo: pixKey, Amount: amount }),
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      const data = await response.json();
      const { resAmount, resMemo } = data;

      const { isValid, translatedNote } = checkMemoValidity(resMemo);

      setPreviewData({
        resAmount,
        resMemo,
        isValid,
        translatedNote,
      });
    } catch (error) {
      toast({ title: "Preview failed", description: String(error), status: "error" });
      setPreviewData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!previewData?.isValid) return;

    try {
      const amountNumber = Number(amount);
      if (isNaN(amountNumber) || amountNumber <= 0) {
        toast({
          title: "Invalid amount",
          status: "error",
          duration: 3000,
        });
        return;
      }

      const memo = `#${pixKey}`; // Encrypt the PIX key
      const xferResult = await aioha.transfer("pixbee", amountNumber, Asset.HBD, memo);

      if (xferResult?.success) {
        toast({
          title: "PIX Transfer Successful",
          description: `Sent ${amount} HBD to pixbee`,
          status: "success",
          duration: 4000,
        });

        setAmount("");
        setPixKey("");
        setPreviewData(null);
      } else {
        toast({
          title: "Transfer Failed",
          description: xferResult?.message || "Unknown error",
          status: "error",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Transfer error", error);
      toast({
        title: "Transfer Error",
        description: String(error),
        status: "error",
        duration: 4000,
      });
    }
  };

  return (
    <VStack spacing={3} align="stretch">
      <Box fontSize="xs" color="gray.400">
        Your HBD Balance: {userAvailableHbd.toFixed(3)} HBD<br />
        Minimal Deposit: {pixDashboardData.depositMinLimit} PIX
      </Box>

      <Select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        size="sm"
        fontFamily="Joystix"
        fontWeight="bold"
        borderColor="muted"
      >
        <option value="HBD">HBD</option>
      </Select>

      <HStack>
        <Input
          placeholder="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          size="sm"
          fontFamily="Joystix"
          borderColor="muted"
          flex="1"
        />
        <Button
          size="sm"
          fontFamily="Joystix"
          fontWeight="bold"
          onClick={() => setAmount(String(userAvailableHbd.toFixed(3)))}
          isDisabled={userAvailableHbd === 0}
        >
          MAX
        </Button>
      </HStack>

      <Input
        placeholder="PIX key"
        value={pixKey}
        onChange={(e) => setPixKey(e.target.value)}
        size="sm"
        fontFamily="Joystix"
        borderColor="muted"
      />

      <Button
        size="sm"
        colorScheme="green"
        onClick={handlePreview}
        isLoading={loading}
        fontFamily="Joystix"
        fontWeight="bold"
      >
        👀 Preview
      </Button>

      {previewData && (
        <Box
          mt={3}
          p={3}
          border="1px solid"
          borderColor="muted"
          borderRadius="md"
          backgroundImage="url('/images/brl.webp')"
          backgroundSize="cover"
          backgroundPosition="left"
          backgroundRepeat="no-repeat"
          position="relative"
          minHeight="250px"
          _before={{
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            zIndex: 1,
          }}
        >
          <Box position="relative" zIndex={2}>
            <Text fontSize="md">
              <strong>Preview:</strong>
            </Text>
            <br />
            <Text fontSize="sm">
              💸 <strong>{previewData.resAmount}</strong>
            </Text>
            <Text fontSize="sm">
              📝 <strong>{previewData.resMemo}</strong>
            </Text>

            {!previewData.isValid && (
              <Text fontSize="sm" color="red.400" mt={2}>
                {previewData.translatedNote}
              </Text>
            )}

            <Button
              mt={2}
              size="sm"
              colorScheme="blue"
              onClick={handleSend}
              fontFamily="Joystix"
              fontWeight="bold"
              isDisabled={!previewData.isValid}
            >
              💸 Sign & Send
            </Button>
          </Box>
        </Box>
      )}
    </VStack>
  );
}

// 📊 Balance Bar Graph
function BalanceBarGraph({ data }: { data: PixDashboardData }) {
  const hiveBRL = data.balanceHive * data.HivePriceBRL;
  const hbdBRL = data.balanceHbd * ((data.HBDPriceBRL + data.BRLPriceHBD) / 2);
  const pixBRL = data.balancePix;

  const total = hiveBRL + hbdBRL + pixBRL;

  const hivePerc = (hiveBRL / total) * 100;
  const hbdPerc = (hbdBRL / total) * 100;
  const pixPerc = (pixBRL / total) * 100;

  return (
    <Box>
      <Text fontWeight="bold" mb={1}>
        💰 Skatebank Balance (BRL {total.toFixed(2)})
      </Text>
      <HStack
        h="24px"
        w="100%"
        borderRadius="md"
        overflow="hidden"
        border="1px solid"
        borderColor="muted"
        spacing={0}
      >
        <Tooltip label={`PIX: R$ ${pixBRL.toFixed(2)} (${pixPerc.toFixed(1)}%)`} hasArrow>
          <Box w={`${pixPerc}%`} bg="blue.400" h="full" />
        </Tooltip>
        <Tooltip label={`HBD: R$ ${hbdBRL.toFixed(2)} (${hbdPerc.toFixed(1)}%)`} hasArrow>
          <Box w={`${hbdPerc}%`} bg="green.400" h="full" />
        </Tooltip>
        <Tooltip label={`HIVE: R$ ${hiveBRL.toFixed(2)} (${hivePerc.toFixed(1)}%)`} hasArrow>
          <Box w={`${hivePerc}%`} bg="red.400" h="full" />
        </Tooltip>
      </HStack>

      <HStack spacing={4} mt={2} fontSize="xs" color="text">
        <HStack>
          <Box w={3} h={3} bg="blue.400" borderRadius="sm" />
          <Text>{pixBRL.toFixed(2)} PIX</Text>
        </HStack>
        <HStack>
          <Box w={3} h={3} bg="green.400" borderRadius="sm" />
          <Text>{data.balanceHbd.toFixed(3)} HBD</Text>
        </HStack>
        <HStack>
          <Box w={3} h={3} bg="red.400" borderRadius="sm" />
          <Text>{data.balanceHive.toFixed(3)} HIVE</Text>
        </HStack>
      </HStack>
    </Box>
  );
}

// 🧠 Main Component
export default function PIXTabContent() {
  const [pixDashboardData, setDashboardData] = useState<PixDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          (process.env.NEXT_PUBLIC_PIXBEE_ENDPOINT || "https://aphid-glowing-fish.ngrok-free.app") + "/skatebank",
          glowinOptions
        );

        if (!res.ok) {
          throw new Error("Pixbee offline");
        }

        const json = await res.json();

        // Convert to numbers if some are strings
        const parsedData = {
          ...json,
          balanceHive: Number(json.balanceHive),
          balanceHbd: Number(json.balanceHbd),
          balancePix: Number(json.balancePix),
          balanceTotal: Number(json.balanceTotal),
          OurExchangePer: Number(json.OurExchangePer),
          OurRefundPer: Number(json.OurRefundPer),
        };

        setDashboardData(parsedData);
      } catch (error) {
        console.error("Failed to load PIX data", error);
        toast({ title: "Failed to load PIX data", status: "error", duration: 3000 });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [toast]);

  return (
    <VStack spacing={4} align="stretch">
      {loading ? (
        <Center>
          <Spinner />
        </Center>
      ) : pixDashboardData ? (
        <>
          <BalanceBarGraph data={pixDashboardData} />

          {/* HBD to PIX Form */}
          <Box
            p={4}
            bg="background"
            borderRadius="lg"
            border="1px solid"
            borderColor="muted"
          >
            <Heading size="sm" mb={4} color="primary" fontFamily="Joystix">
              💸 HBD to PIX Transfer
            </Heading>
            <PIXForm pixDashboardData={pixDashboardData} />
          </Box>

          {/* PIX to HBD Transfer Guide */}
          <Box
            p={4}
            bg="background"
            borderRadius="lg"
            border="1px solid"
            borderColor="muted"
          >
            <Heading size="sm" mb={4} color="primary" fontFamily="Joystix">
              💸 PIX to HBD Transfer
            </Heading>
            <OrderedList pl={4} color="text">
              <ListItem mb={1}>
                Send a PIX transfer to this PIX Key:<br />
                <strong>{pixDashboardData.pixbeePixKey}</strong>
              </ListItem>
              <ListItem mb={1}>
                In the PIX MESSAGE, specify the HIVE account to be credited to. Example: skatehive
              </ListItem>
              {/* <ListItem mb={1}>
                If you want to buy Hive, add " hive" after your username In the PIX MESSAGE. Example: skatedev hive
              </ListItem> */}
              <ListItem mb={1}>
                Send the PIX transfer and wait for the HBD to be received.
              </ListItem>
            </OrderedList>
          </Box>

          {/* Transaction History */}
          <Box>
            <Heading size="sm" mb={4} color="primary" fontFamily="Joystix">
              📜 Your Withdraw History
            </Heading>
            <PIXTransactionHistory searchAccount={"pixbee"} pixDashboardData={pixDashboardData} />
          </Box>

          {/* FAQ */}
          <Box>
            <Heading size="sm" mb={4} color="primary" fontFamily="Joystix">
              ❓ FAQ
            </Heading>
            <Text mt={2} color="text">
              <strong>O que eu faço caso minha transferencia não funcione?</strong>
              <br />
              Calma, ele vai chegar ou vamos te reembolsar.
              <br />
              Nosso time sempre recebe notificoes das transacoes em caso de falha.
              <br />
              Caso queira, abra um ticket de suporte em nosso{" "}
              <a href="https://discord.gg/eAQfS97wHK">canal do Discord</a>.
              <br />
            </Text>
          </Box>

          <Box>
            <Heading size="sm" mb={4} color="primary" fontFamily="Joystix">
              ❓ FAQ
            </Heading>
            <Text mt={2} color="text">
              <strong>What should I do if my transfer doesn’t work?</strong>
              <br />
              Stay calm, it will arrive or we will refund you.
              <br />
              Our team always receives notifications of transactions in case of failure.
              <br />
              If you wish, open a support ticket on our{" "}
              <a href="https://discord.gg/eAQfS97wHK">Discord channel</a>.
              <br />
            </Text>
          </Box>
        </>
      ) : (
        <Text color="red.400">Pixbee is offline now. Try later</Text>
      )}
    </VStack>
  );
}