import { Transaction, getTransactionHistory } from "@/lib/hive/client-functions";
import { KeyTypes } from "@aioha/aioha";
import { useAioha } from "@aioha/react-ui";
import { Tooltip, useToast } from "@chakra-ui/react";
import { useEffect, useCallback, useState } from "react";
import { Box, Spinner, Table, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";

const MAX_MEMO_LENGTH = 25;
const CALENDAR_EMOJI = "📅";
const ENDECRYPTED_EMOJI = "🔒";
const DECRYPTED_EMOJI = "" //"🗝️";

const PIXTransactionHistory = ({ searchAccount }: { searchAccount: string }) => {
  const { user, aioha } = useAioha();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalSentToPixbee, setTotalSentToPixbee] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [decryptedMemos, setDecryptedMemos] = useState<Record<number, string>>({});
  const toast = useToast();

  const handleDecrypt = useCallback(
    async (idx: number, memo: string) => {
      try {
        const decrypted = await aioha.decryptMemo(memo, KeyTypes.Memo);
        if (decrypted.success) {
          // Remove the leading '#' if exists
          const cleaned = decrypted.result.startsWith("#") ? decrypted.result.slice(1) : decrypted.result;
          setDecryptedMemos((prev) => ({ ...prev, [idx]: cleaned }));
        } else {
          toast({
            title: "Decryption Failed",
            description: "Unable to decrypt this memo.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      } catch (err) {
        console.error(err);
        toast({
          title: "Error",
          description: "Something went wrong while decrypting.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    },
    [aioha, toast]
  );

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { transactions: fetchedTransactions, totalSentToPixbee } = await getTransactionHistory(user, searchAccount);
        setTransactions(fetchedTransactions);
        setTotalSentToPixbee(totalSentToPixbee);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        setTransactions([]);
        setTotalSentToPixbee({});
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [user, searchAccount]);

  return (
    <Box p={1}>
      {loading ? (
        <Spinner />
      ) : transactions.length > 0 ? (
        <>
          <Box mb={2}>
            <Text fontSize="sm" fontWeight="bold">
              Total You Sent to pixbee:{" "}
              {Object.entries(totalSentToPixbee).map(([currency, amount]) => (
                <span key={currency}>
                  {amount.toFixed(3)} {currency}{" "}
                </span>
              ))}
            </Text>
          </Box>

          <Box overflowX="auto" color="white" width="100%" maxWidth="1200px" mx="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th fontSize="xs" width="20%" textAlign="center">
                    From
                  </Th>
                  <Th fontSize="xs" width="20%" textAlign="center">
                    To
                  </Th>
                  <Th fontSize="xs" width="20%" textAlign="center">
                    Amount
                  </Th>
                  <Th fontSize="xs" width="37%" textAlign="center">
                    Memo
                  </Th>
                  <Th fontSize="xs" width="3%" textAlign="center">
                    Date
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {transactions.map((transaction, idx) => {
                  const rawMemo = transaction.memo ?? "";
                  const isEncrypted = rawMemo.startsWith("#");
                  const displayMemo = decryptedMemos[idx] ?? rawMemo;
                  const shortMemo =
                    displayMemo.length > MAX_MEMO_LENGTH ? `${displayMemo.substring(0, MAX_MEMO_LENGTH)}…` : displayMemo;

                  return (
                    <Tr key={idx}>
                      <Td fontSize="xs" px={2}>
                        {transaction.from}
                      </Td>
                      <Td fontSize="xs" px={2}>
                        {transaction.to}
                      </Td>
                      <Td fontSize="xs" px={2} textAlign="right">
                        {transaction.amount}
                      </Td>
                      <Td fontSize="xs" px={2}>
                        <Tooltip label={displayMemo} hasArrow placement="top">
                          <Box
                            cursor={isEncrypted ? "pointer" : "default"}
                            onClick={() => {
                              if (isEncrypted && !decryptedMemos[idx]) {
                                handleDecrypt(idx, rawMemo);
                              }
                            }}
                          >
                            {isEncrypted ? (decryptedMemos[idx] ? DECRYPTED_EMOJI : ENDECRYPTED_EMOJI) : ""}{shortMemo}
                          </Box>
                        </Tooltip>
                      </Td>
                      <Td fontSize="xs" px={2} textAlign="center">
                        <Tooltip label={new Date(transaction.timestamp).toLocaleString()} hasArrow>
                          {CALENDAR_EMOJI}
                        </Tooltip>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        </>
      ) : (
        <Text>No transactions found.</Text>
      )}
    </Box>
  );
};

export default PIXTransactionHistory;
