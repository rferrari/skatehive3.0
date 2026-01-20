"use client";

import {
    Box,
    Text,
    Code,
    useColorModeValue,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
} from "@chakra-ui/react";
import { TabComponentProps } from "../types/DevMetadataTypes";

interface RawDataTabProps {
    comment: TabComponentProps["comment"];
}

export const RawDataTab = ({ comment }: RawDataTabProps) => {
    const codeBg = useColorModeValue("gray.100", "gray.900");

    return (
        <Accordion allowMultiple>
            <AccordionItem>
                <AccordionButton>
                    <Box flex="1" textAlign="left" fontWeight="bold">
                        Full Post Object
                    </Box>
                    <AccordionIcon />
                </AccordionButton>
                <AccordionPanel>
                    <Box
                        p={4}
                        bg={codeBg}
                        borderRadius="none"
                        overflowX="auto"
                        maxH="400px"
                        overflowY="auto"
                    >
                        <Code display="block" whiteSpace="pre-wrap" fontSize="xs">
                            {JSON.stringify(comment, null, 2)}
                        </Code>
                    </Box>
                </AccordionPanel>
            </AccordionItem>

            <AccordionItem>
                <AccordionButton>
                    <Box flex="1" textAlign="left" fontWeight="bold">
                        Post Body (Raw Markdown)
                    </Box>
                    <AccordionIcon />
                </AccordionButton>
                <AccordionPanel>
                    <Box
                        p={4}
                        bg={codeBg}
                        borderRadius="none"
                        overflowX="auto"
                        maxH="400px"
                        overflowY="auto"
                    >
                        <Code display="block" whiteSpace="pre-wrap" fontSize="xs">
                            {comment.body || "No body content"}
                        </Code>
                    </Box>
                </AccordionPanel>
            </AccordionItem>
        </Accordion>
    );
};