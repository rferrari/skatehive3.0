"use client";
import React from "react";
import { useLastAuction } from "../../hooks/auction";
import { useRouter } from "next/navigation";
import PixelTransition from "./PixelTransition";
import { Image, useToken } from "@chakra-ui/react";
import SkateHiveLogo from "./SkateHiveLogo";

const SidebarLogo = () => {
    const { data: activeAuction } = useLastAuction();
    console.log("activeAuction", activeAuction);
    const router = useRouter();
    const [pixelColor] = useToken("colors", ["primary"]);
    const gridSizes = [4, 16, 41];
    const gridSize = React.useMemo(() => gridSizes[Math.floor(Math.random() * gridSizes.length)], []);

    return (
        <PixelTransition
            firstContent={
                <SkateHiveLogo
                    style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
                    onClick={() => router.push(`https://nouns.build/dao/base/${activeAuction?.token?.tokenContract}`)}
                />
            }
            secondContent={
                <Image
                    src={activeAuction?.token?.image || "/SKATE_HIVE_VECTOR_FIN.svg"}
                    alt="SkateHive Hover Logo"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onClick={() => router.push(`https://nouns.build/dao/base/${activeAuction?.token?.tokenContract}`)}
                    cursor={"pointer"}
                />
            }
            gridSize={gridSize}
            pixelColor={pixelColor}
            animationStepDuration={0.4}
        />
    );
};

export default SidebarLogo; 