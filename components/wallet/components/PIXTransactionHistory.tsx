"use client";

import { Transaction, getTransactionHistory } from "@/lib/hive/client-functions";
import { KeyTypes } from "@aioha/aioha";
import { useAioha } from "@aioha/react-ui";
import { Tooltip, useToast } from "@chakra-ui/react";
import { useEffect, useCallback, useState } from "react";
import { Box, Spinner, Table, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import { PixDashboardData } from "./PIXTabContent";

const MAX_MEMO_LENGTH = 25;
const CALENDAR_EMOJI = "📅";
const ENDECRYPTED_EMOJI = "🔒";
const DECRYPTED_EMOJI = ""; // "🗝️";

const PIXTransactionHistory = ({ searchAccount, pixDashboardData, language }: { searchAccount: string, pixDashboardData: PixDashboardData | null, language: 'en' | 'pt' }) => {
  const { user, aioha } = useAioha();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalSentToPixbee, setTotalSentToPixbee] = useState<Record<string, number>>({});
  const [totalReceived, setTotalReceived] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [decryptedMemos, setDecryptedMemos] = useState<Record<number, string>>({});
  const toast = useToast();

  const content = {
    en: {
      summaryTitle: '📊 Your PIX Transaction Summary',
      currency: 'Currency',
      totalSent: 'Total Sent',
      nowWorth: 'Now Worth',
      totalReceived: 'Total Received',
      total: 'TOTAL',
      historyTitle: '📜 Your PIX Transaction History',
      from: 'From',
      to: 'To',
      amount: 'Amount',
      memo: 'Memo',
      date: 'Date',
      noTransactions: 'No transactions found.',
      decryptionFailed: 'Decryption Failed',
      unableToDecrypt: 'Unable to decrypt this memo.',
      error: 'Error',
      decryptionError: 'Something went wrong while decrypting.',
    },
    pt: {
      summaryTitle: '📊 Resumo das Suas Transações PIX',
      currency: 'Moeda',
      totalSent: 'Total Enviado',
      nowWorth: 'Valor Atual',
      totalReceived: 'Total Recebido',
      total: 'TOTAL',
      historyTitle: '📜 Histórico das Suas Transações PIX',
      from: 'De',
      to: 'Para',
      amount: 'Quantia',
      memo: 'Memo',
      date: 'Data',
      noTransactions: 'Nenhuma transação encontrada.',
      decryptionFailed: 'Falha na Descriptografia',
      unableToDecrypt: 'Incapaz de descriptografar este memo.',
      error: 'Erro',
      decryptionError: 'Algo deu errado durante a descriptografia.',
    },
  };

  const langContent = content[language];

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
            title: langContent.decryptionFailed,
            description: langContent.unableToDecrypt,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      } catch (err) {
        console.error(err);
        toast({
          title: langContent.error,
          description: langContent.decryptionError,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    },
    [aioha, toast, langContent]
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

        // Calculate total received by user for each currency
        const received = fetchedTransactions.reduce((acc, tx) => {
          if (tx.to === user) {
            const currency = tx.amount.split(" ")[1]; // e.g., "1.000 HIVE" -> "HIVE"
            const amount = parseFloat(tx.amount.split(" ")[0]);
            acc[currency] = (acc[currency] || 0) + amount;
          }
          return acc;
        }, {} as Record<string, number>);
        setTotalReceived(received);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        setTransactions([]);
        setTotalSentToPixbee({});
        setTotalReceived({});
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [user, searchAccount]);

  const replacePixbee = (str: string) =>
    str?.toLowerCase() === "pixbee" ? "skatebank" : str;

  return (
    <Box p={1}>
      {loading ? (
        <Spinner />
      ) : transactions.length > 0 ? (
        <>
          <Box mb={8} w="100%">
            <Text fontSize="lg" fontWeight="bold" mb={2} textAlign="center">
              {langContent.summaryTitle}
            </Text>

            <Table size="sm" variant="simple" w="100%">
              <Thead>
                <Tr>
                  <Th textAlign="center">{langContent.currency}</Th>
                  <Th isNumeric>{langContent.totalSent}</Th>
                  <Th isNumeric>{langContent.nowWorth}</Th>
                  <Th isNumeric>{langContent.totalReceived}</Th>
                  <Th isNumeric>{langContent.nowWorth}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {Object.keys({ ...totalSentToPixbee, ...totalReceived }).map((currency) => {
                  const sentAmount = totalSentToPixbee[currency] || 0;
                  const receivedAmount = totalReceived[currency] || 0;
                  let priceBRL = 0;
                  if (currency === "HBD" && typeof pixDashboardData?.HBDPriceBRL === "number") {
                    priceBRL = pixDashboardData.HBDPriceBRL;
                  }
                  if (currency === "HIVE" && typeof pixDashboardData?.HivePriceBRL === "number") {
                    priceBRL = pixDashboardData.HivePriceBRL;
                  }
                  return (
                    <Tr key={currency}>
                      <Td textAlign="center">{currency}</Td>
                      <Td isNumeric>{sentAmount.toFixed(3)}</Td>
                      <Td isNumeric>{priceBRL ? `R$ ${(sentAmount * priceBRL).toFixed(2)}` : "-"}</Td>
                      <Td isNumeric>{receivedAmount.toFixed(3)}</Td>
                      <Td isNumeric>{priceBRL ? `R$ ${(receivedAmount * priceBRL).toFixed(2)}` : "-"}</Td>
                    </Tr>
                  );
                })}
                <Tr fontWeight="bold">
                  <Td textAlign="center">{langContent.total}</Td>
                  <Td isNumeric>
                  </Td>
                  <Td isNumeric>
                    R${" "}
                    {Object.entries(totalSentToPixbee)
                      .reduce((sum, [currency, amount]) => {
                        let priceBRL = 0;
                        if (currency === "HBD" && typeof pixDashboardData?.HBDPriceBRL === "number") {
                          priceBRL = pixDashboardData.HBDPriceBRL;
                        }
                        if (currency === "HIVE" && typeof pixDashboardData?.HivePriceBRL === "number") {
                          priceBRL = pixDashboardData.HivePriceBRL;
                        }
                        return sum + amount * priceBRL;
                      }, 0)
                      .toFixed(2)}
                  </Td>
                  <Td isNumeric>
                  </Td>
                  <Td isNumeric>
                    R${" "}
                    {Object.entries(totalReceived)
                      .reduce((sum, [currency, amount]) => {
                        let priceBRL = 0;
                        if (currency === "HBD" && typeof pixDashboardData?.HBDPriceBRL === "number") {
                          priceBRL = pixDashboardData.HBDPriceBRL;
                        }
                        if (currency === "HIVE" && typeof pixDashboardData?.HivePriceBRL === "number") {
                          priceBRL = pixDashboardData.HivePriceBRL;
                        }
                        return sum + amount * priceBRL;
                      }, 0)
                      .toFixed(2)}
                  </Td>
                </Tr>
              </Tbody>
            </Table>
          </Box>

            <Text fontSize="lg" fontWeight="bold" mb={2} textAlign="center">
              {langContent.historyTitle}
            </Text>

          <Box overflowX="auto" color="white" width="100%" maxWidth="1200px" mx="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th fontSize="xs" width="20%" textAlign="center">
                    {langContent.from}
                  </Th>
                  <Th fontSize="xs" width="20%" textAlign="center">
                    {langContent.to}
                  </Th>
                  <Th fontSize="xs" width="20%" textAlign="center">
                    {langContent.amount}
                  </Th>
                  <Th fontSize="xs" width="37%" textAlign="center">
                    {langContent.memo}
                  </Th>
                  <Th fontSize="xs" width="3%" textAlign="center">
                    {langContent.date}
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
                      <Td fontSize="xs" px={2} color="primary">
                        {replacePixbee(transaction.from)}
                      </Td>
                      <Td fontSize="xs" px={2} color="primary">
                        {replacePixbee(transaction.to)}
                      </Td>
                      <Td fontSize="xs" px={2} textAlign="right" color="primary">
                        {transaction.amount}
                      </Td>
                      <Td fontSize="xs" px={2} color="primary">
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
                      <Td fontSize="xs" px={2} textAlign="center" color="primary">
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
        <Text>{langContent.noTransactions}</Text>
      )}
    </Box>
  );
};

export default PIXTransactionHistory;
