'use client'
import { HiveAccount } from "@/hooks/useHiveAccount";
import { Button, Center, FormControl, FormLabel, Image, Input, VStack, Box } from "@chakra-ui/react";
import React, { useState } from "react";
import { VideoPart } from "@/types/VideoPart";
import SkateModal from "@/components/shared/SkateModal";

interface VideoPartsFormProps {
    onNewVideoPart: (videoPart: VideoPart) => void;
    isOpen: boolean;
    onClose: () => void;
}


const VideoPartsForm = ({ onNewVideoPart, isOpen, onClose }: VideoPartsFormProps) => {
    const [videoPart, setVideoPart] = useState<VideoPart>({
        name: "",
        filmmaker: [""],
        friends: [""],
        year: new Date().getFullYear(),
        url: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof VideoPart) => {
        setVideoPart({
            ...videoPart,
            [field]: field === "filmmaker" || field === "friends" ? e.target.value.split(",") : e.target.value
        });
    };

    const submitVideoPart = () => {
        onNewVideoPart(videoPart);
        onClose();
    };

    return (
        <SkateModal 
            isOpen={isOpen} 
            onClose={onClose}
            title="Submit Video Part"
            size="md"
            footer={
                <Button w={"100%"} colorScheme="green" onClick={submitVideoPart}>
                    Submit Video Part
                </Button>
            }
        >
            <Box p={6}>
                <VStack spacing={4}>
                    <Image
                        src="https://media.giphy.com/media/qTNIlLJNOwdNK/giphy.gif"
                        alt="skateboard"
                        boxSize={["100px", "200px"]}
                    />
                    <FormControl>
                        <FormLabel>Video Name</FormLabel>
                        <Input
                            value={videoPart.name}
                            onChange={(e) => handleChange(e, "name")}
                            bg="inputBg"
                            borderColor="inputBorder"
                            color="inputText"
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel>Filmmaker(s) </FormLabel>
                        <Input
                            value={videoPart.filmmaker.join(",")}
                            onChange={(e) => handleChange(e, "filmmaker")}
                            bg="inputBg"
                            borderColor="inputBorder"
                            color="inputText"
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel>Friends</FormLabel>
                        <Input
                            value={videoPart.friends.join(",")}
                            onChange={(e) => handleChange(e, "friends")}
                            bg="inputBg"
                            borderColor="inputBorder"
                            color="inputText"
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel>Year</FormLabel>
                        <Input
                            type="number"
                            value={videoPart.year}
                            onChange={(e) => handleChange(e, "year")}
                            bg="inputBg"
                            borderColor="inputBorder"
                            color="inputText"
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel>URL</FormLabel>
                        <Input
                            value={videoPart.url}
                            onChange={(e) => handleChange(e, "url")}
                            bg="inputBg"
                            borderColor="inputBorder"
                            color="inputText"
                        />
                    </FormControl>
                </VStack>
            </Box>
        </SkateModal>
    );
};

export default VideoPartsForm; 