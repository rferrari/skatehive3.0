"use client";

import {
  Box,
  Center,
  Flex,
  Image,
  Text,
  VStack,
  useTheme,
  useDisclosure,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import SkateHiveMagazineModal from "./SkateHiveMagazineModal";
import { HIVE_CONFIG } from "@/config/app.config";
import { useTranslations } from "@/contexts/LocaleContext";

const SKATEHIVE_TAG = HIVE_CONFIG.COMMUNITY_TAG;

function CommunityTotalPayout() {
  const t = useTranslations();
  const [totalHBDPayout, setTotalHBDPayout] = useState<number>(0);
  const [displayedNumber, setDisplayedNumber] = useState<string>("00000");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Modal state
  const { isOpen, onOpen, onClose } = useDisclosure();

  const theme = useTheme();
  const accentColor = theme.colors.accent || "#B0C4DE";
  const textColor = theme.colors.text || "#1E90FF";
  const borderRadius = theme.radii.lg || "16px";
  const bodyFont = theme.fonts.body;
  const fontWeightBold = theme.fontWeights.bold || 700;
  const fontSizeSm = theme.fontSizes.sm || "14px";
  const fontSizeXl = theme.fontSizes.xl || "20px";
  const fontSizeBelow = theme.fontSizes["md"] || "16px";

  const formattedNumber = useMemo(
    () =>
      totalHBDPayout
        .toLocaleString("en-US", {
          style: "decimal",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
        .replace(/,/g, ""),
    [totalHBDPayout]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `https://stats.hivehub.dev/communities?c=${SKATEHIVE_TAG}`
        );
        const data = await response.json();
        const payout = parseFloat(
          data[SKATEHIVE_TAG]?.total_payouts_hbd?.replace("$", "") || "90000"
        );
        setTotalHBDPayout(payout);
      } catch (error: any) {
        console.error("Error fetching data: ", error);
        setError(error.message);
        setTotalHBDPayout(420.0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!loading && !error) {
      const intervalId = setInterval(() => {
        setDisplayedNumber(
          formattedNumber
            .split("")
            .map(() => Math.floor(Math.random() * 10))
            .join("")
        );
      }, 100);

      const timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        setDisplayedNumber(formattedNumber);
      }, 4000);

      return () => {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      };
    }
  }, [formattedNumber, loading, error]);

  return (
    <center>
      <Box
        position="relative"
        overflow="hidden"
        zIndex={0}
        mb={4}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        cursor={"pointer"}
        onClick={onOpen}
      >
        {isHovered && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            backgroundImage={`url('/images/moneyfalling.gif')`}
            backgroundRepeat="no-repeat"
            backgroundPosition="center"
            backgroundSize="cover"
            borderRadius={borderRadius}
            pointerEvents="none"
            zIndex={2}
            opacity={1}
          />
        )}
        {loading ? (
          <VStack zIndex={2} fontFamily={bodyFont}>
            <Image
              alt="Loading..."
              boxSize={"24px"}
              src="/images/spinning-joint-sm.gif"
              zIndex={2}
            />
            <Text
              fontSize={fontSizeSm}
              color={accentColor}
              zIndex={2}
              fontFamily={bodyFont}
            >
              {t('common.loading')}
            </Text>
          </VStack>
        ) : error ? (
          <Text
            fontSize={fontSizeXl}
            color={textColor}
            fontFamily={bodyFont}
          >{`${t('common.error')}: ${error}`}</Text>
        ) : (
          <Flex
            justifyContent="center"
            flexDirection="column"
            alignItems="center"
            zIndex={2}
            fontFamily={bodyFont}
          >
            <Text
              color={"primary"}
              fontSize={"24px"}
              fontWeight={fontWeightBold}
              gap={1}
              display={"flex"}
              zIndex={2}
              style={{
                fontFamily: `'Joystix', 'VT323', 'Fira Mono', 'monospace'`,
              }}
            >
              ${displayedNumber} USD
            </Text>
            <Center>
              <Text
                color={accentColor}
                fontSize={fontSizeBelow}
                fontWeight={fontWeightBold}
                fontFamily={bodyFont}
              >
                {t('common.magazineTotalRewards')}
              </Text>
            </Center>
          </Flex>
        )}
      </Box>

      {/* SkateHive Magazine Modal */}
      <SkateHiveMagazineModal isOpen={isOpen} onClose={onClose} />
    </center>
  );
}

export default CommunityTotalPayout;
