"use client";
const SKATEHIVE_TAG = process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG || 'hive-173115';
import { Box, Flex, Image, Text, VStack, useTheme } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

function CommunityTotalPayout() {
  const [totalHBDPayout, setTotalHBDPayout] = useState<number>(0);
  const [displayedNumber, setDisplayedNumber] = useState<string>("00000");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [createdDate, setCreatedDate] = useState<string | null>(null);

  const theme = useTheme();
  const borderColor = theme.colors.border || '#1E90FF';
  const accentColor = theme.colors.accent || '#B0C4DE';
  const successColor = theme.colors.success || '#38A169';
  const textColor = theme.colors.text || '#1E90FF';
  const backgroundColor = theme.colors.background || '#87CEEB';
  const borderRadius = theme.radii.lg || '16px';
  const bodyFont = theme.fonts.body;
  const headingFont = theme.fonts.heading;
  const fontWeightBold = theme.fontWeights.bold || 700;
  const fontWeightNormal = theme.fontWeights.normal || 400;
  const fontSizeLg = theme.fontSizes.lg || '18px';
  const fontSizeMd = theme.fontSizes.md || '16px';
  const fontSizeSm = theme.fontSizes.sm || '14px';
  const fontSizeXl = theme.fontSizes.xl || '20px';
  const fontSizePayout = '64px';
  const fontSizePayoutLarge = '64px';
  const fontSizeBelow = theme.fontSizes["md"] || '16px';

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
        const payout = parseFloat(data[SKATEHIVE_TAG]?.total_payouts_hbd?.replace("$", "") || "90000");
        setTotalHBDPayout(payout);
        if (data[SKATEHIVE_TAG]?.created) {
          setCreatedDate(data[SKATEHIVE_TAG].created);
        }
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
          formattedNumber.split("").map(() => Math.floor(Math.random() * 10)).join("")
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
        margin="0px"
        padding="4px"
        width={"100%"}
        maxW="md"
        mx="auto"
        borderRadius={borderRadius}
        color={accentColor}
        position="relative"
        overflow="hidden"
        zIndex={0}
        mb={4}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Griptape background to match join page style */}
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          backgroundImage="url('/images/griptape.jpg')"
          backgroundSize="cover"
          backgroundPosition="center"
          opacity={0.3}
          zIndex={0}
          pointerEvents="none"
        />
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
            <Text fontSize={fontSizeSm} color={accentColor} zIndex={2} fontFamily={bodyFont}>
              Loading...
            </Text>
          </VStack>
        ) : error ? (
          <Text fontSize={fontSizeXl} color={textColor} fontFamily={bodyFont}>{`Error: ${error}`}</Text>
        ) : (
          <Flex
            justifyContent="center"
            flexDirection="column"
            alignItems="center"
            zIndex={2}
            fontFamily={bodyFont}
          >
            <Text
              color={successColor}
              fontSize={fontSizePayoutLarge}
              fontWeight={fontWeightBold}
              textShadow={"1px 1px 15px " + borderColor}
              gap={1}
              display={"flex"}
              zIndex={2}
              fontFamily={headingFont}
            >
              ${displayedNumber} USD
            </Text>
            <Flex direction="row" align="center" gap={2} zIndex={2}>
              <Text
                color={accentColor}
                fontSize={fontSizeBelow}
                fontWeight={fontWeightBold}
                textShadow={"1px 1px 15px " + borderColor}
                fontFamily={bodyFont}
              >
                Paid to Skaters
              </Text>
              {createdDate && (
                <Text
                  color={accentColor}
                  fontSize={fontSizeBelow}
                  fontWeight={fontWeightNormal}
                  fontFamily={bodyFont}
                >
                  since {dayjs(createdDate).format('MMM D, YYYY')}
                </Text>
              )}
            </Flex>
          </Flex>
        )}
      </Box>
    </center>
  );
}

export default CommunityTotalPayout; 