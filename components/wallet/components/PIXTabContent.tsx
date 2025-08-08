import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Center,
  Heading,
  Input,
  Select,
  // SimpleGrid,
  Spinner,
  Text,
  useToast,
  VStack,
  HStack,
  Tooltip,
  FormLabel,
} from "@chakra-ui/react";
import PIXTransactionHistory from "./PIXTransationHistory";
import { Asset } from "@aioha/aioha";
import { useAioha } from "@aioha/react-ui";
import useHiveAccount from "@/hooks/useHiveAccount";

// devs in localhost no pixbee acces due CORS
// const mockData = {
//   pixbeePixKey: "816b8bac-bf1f-4689-80c2-c2bc2e2a8d7a",
//   HivePriceBRL: 1.159,
//   BRLPriceHive: 1.132,
//   HivePriceUSD: 0.212,
//   HBDPriceBRL: 5.555,
//   BRLPriceHBD: 5.555,
//   minRefundHive: 5,
//   minRefundHbd: 2,
//   minRefundPix: 10,
//   depositMinLimit: 5,
//   balancePix: 836.86,
//   balanceHbd: 87.025,
//   balanceHive: 0.107,
//   balanceTotal: 1299.52,
//   OurExchangePer: 0.01,
//   OurExchangeFee: 2,
//   OurRefundPer: 0.01,
// };


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
  if (!pixDashboardData) {
    return <div>Loading dashboard data...</div>;
  }

  const { user, aioha } = useAioha();
  const { hiveAccount, isLoading, error } = useHiveAccount(user || "");
  const [currency, setCurrency] = useState("HIVE");
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

  const userAvailableHbd = hiveAccount?.hbd_balance
    ? Number(String(hiveAccount.hbd_balance).split(" ")[0])
    : 0;

  useEffect(() => {
    if (userAvailableHbd > 0) {
      setAmount(String(userAvailableHbd.toFixed(3)));
    }
  }, [userAvailableHbd]);

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
        Minimal Deposit: R$ {pixDashboardData.depositMinLimit}
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
            backgroundColor: "rgba(0, 0, 0, 0.8)", // Semi-transparent black overlay (adjust opacity as needed)
            zIndex: 1,
          }}
        >
          <Box position="relative" zIndex={2}> {/* Ensure content is above the overlay */}
            <Text fontSize="md"><strong>Preview:</strong></Text><br />
            <Text fontSize="sm">💸 <strong>{previewData.resAmount}</strong></Text>
            <Text fontSize="sm">📝 <strong>{previewData.resMemo}</strong></Text>

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
  const hbdBRL = data.balanceHbd * data.HBDPriceBRL;
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

      {/* Updated Legend */}
      <HStack spacing={4} mt={2} fontSize="xs" color="text">
        <HStack>
          <Box w={3} h={3} bg="blue.400" borderRadius="sm" />
          <Text>PIX: R$ {pixBRL.toFixed(2)}</Text>
        </HStack>
        <HStack>
          <Box w={3} h={3} bg="green.400" borderRadius="sm" />
          <Text>HBD: R$ {hbdBRL.toFixed(2)}</Text>
        </HStack>
        <HStack>
          <Box w={3} h={3} bg="red.400" borderRadius="sm" />
          <Text>HIVE: R$ {hiveBRL.toFixed(2)}</Text>
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
        // console.log("📡 Fetching PIX dashboard data...");
        let json;

        try {
          const res = await fetch(
            (process.env.NEXT_PUBLIC_PIXBEE_ENDPOINT || "https://aphid-glowing-fish.ngrok-free.app") + "/skatebank",
            glowinOptions
          );

          if (!res.ok) {
            console.warn("❌ Server responded with error, use mock data.");
            // json = mockData;
            throw new Error("Pixbee offline");
          } else {
            json = await res.json();
          }
        } catch (err) {
          console.error("❌ Fetch failed, use mock data.", err);
          // json = mockData;
          throw new Error("Pixbee offline");
        }
        // console.log("✅ PIX Data received:", json);

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
        console.error("❌ Failed to load PIX data", error);
        toast({ title: "Failed to load PIX data", status: "error" });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <VStack spacing={4} align="stretch">
      {loading ? (
        <Center><Spinner /></Center>
      ) : pixDashboardData ? (
        <>
          <BalanceBarGraph data={pixDashboardData} />

          {/* PIX Form */}
          <Box
            p={4}
            bg="background"
            borderRadius="lg"
            border="1px solid"
            borderColor="muted"
          >
            <Heading size="sm" mb={4} color="primary" fontFamily="Joystix">
              💸 Send PIX Transfer
            </Heading>
            <PIXForm pixDashboardData={pixDashboardData} />
          </Box>
        </>
      ) : (
        <Text color="red.400">Pixbee is offline now. Try later</Text>
      )}

      <Box>
        <PIXTransactionHistory searchAccount={"pixbee"} pixDashboardData={pixDashboardData} />
      </Box>

    </VStack>
  );
}
