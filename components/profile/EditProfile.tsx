import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  Image,
  VStack,
  Box,
  Select,
} from "@chakra-ui/react";
import { updateProfile } from "@/lib/hive/client-functions";
import countryList from "react-select-country-list";

interface EditProfileProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: any;
  setProfileData: (data: any) => void;
  username: string;
}

const EditProfile: React.FC<EditProfileProps> = ({
  isOpen,
  onClose,
  profileData,
  setProfileData,
  username,
}) => {
  const [name, setName] = useState(profileData.name || "");
  const [about, setAbout] = useState(profileData.about || "");
  const [location, setLocation] = useState(profileData.location || "");
  const [website, setWebsite] = useState(profileData.website || "");
  const [profileImage, setProfileImage] = useState(
    profileData.profileImage || ""
  );
  const [coverImage, setCoverImage] = useState(profileData.coverImage || "");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countryOptions = countryList().getData();

  useEffect(() => {
    setName(profileData.name || "");
    setAbout(profileData.about || "");
    setLocation(profileData.location || "");
    setWebsite(profileData.website || "");
    setProfileImage(profileData.profileImage || "");
    setCoverImage(profileData.coverImage || "");
    setProfileImageFile(null);
    setCoverImageFile(null);
  }, [isOpen, profileData]);

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      setCoverImage(URL.createObjectURL(file));
    }
  };

  const uploadToIPFS = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/pinata", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to upload file to IPFS");
      const result = await response.json();
      return result.IpfsHash
        ? `https://ipfs.skatehive.app/ipfs/${result.IpfsHash}`
        : null;
    } catch (err) {
      setError("Image upload failed");
      return null;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    let finalProfileImage = profileImage;
    let finalCoverImage = coverImage;
    try {
      if (profileImageFile) {
        const url = await uploadToIPFS(profileImageFile);
        if (url) finalProfileImage = url;
      }
      if (coverImageFile) {
        const url = await uploadToIPFS(coverImageFile);
        if (url) finalCoverImage = url;
      }
      // Update local state immediately for UI feedback
      setProfileData({
        ...profileData,
        about,
        location,
        website,
        profileImage: finalProfileImage,
        coverImage: finalCoverImage,
      });
      // Save to Hive
      const loginMethod = localStorage.getItem("LoginMethod");
      if (loginMethod === "keychain") {
        await updateProfile(
          username,
          "", // name is not used
          about,
          location,
          finalCoverImage,
          finalProfileImage,
          website
        );
      } else if (loginMethod === "privateKey") {
        setError(
          "Profile updates with private key login are not supported yet."
        );
        return;
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={"background"}>
        <ModalHeader p={0} position="relative" minHeight="120px">
          {/* Cover Image as Header Background */}
          {coverImage ? (
            <Image
              src={coverImage}
              alt="Cover Preview"
              width="100%"
              height="120px"
              objectFit="cover"
              borderTopRadius="md"
            />
          ) : (
            <Box
              width="100%"
              height="120px"
              bg="gray.200"
              _dark={{ bg: "gray.600" }}
              borderTopRadius="md"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="gray.500"
              fontSize="sm"
            >
              Cover Image Preview
            </Box>
          )}

          {/* Profile Picture Overlay */}
          <Box
            position="absolute"
            bottom="-30px"
            left="50%"
            transform="translateX(-50%)"
            borderRadius="full"
            border="4px solid white"
            _dark={{ borderColor: "gray.800" }}
            bg="white"
          >
            {profileImage ? (
              <Image
                src={profileImage}
                alt="Profile Preview"
                boxSize="60px"
                borderRadius="full"
                objectFit="cover"
              />
            ) : (
              <Box
                boxSize="60px"
                borderRadius="full"
                bg="gray.200"
                _dark={{ bg: "gray.600" }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="gray.500"
                fontSize="xs"
              >
                Profile
              </Box>
            )}
          </Box>

          {/* Edit Profile Title */}
          <Box
            position="absolute"
            top="4"
            left="4"
            bg="blackAlpha.700"
            color="white"
            px="3"
            py="1"
            borderRadius="md"
            fontSize="sm"
            fontWeight="semibold"
          >
            Edit Profile
          </Box>
        </ModalHeader>
        <ModalCloseButton
          color="white"
          bg="blackAlpha.700"
          _hover={{ bg: "blackAlpha.800" }}
        />
        <ModalBody mt="40px">
          <VStack spacing={4} align="stretch">
            {/* Profile Picture Upload */}
            <FormControl>
              <FormLabel>Profile Picture</FormLabel>
              <VStack spacing={2} align="stretch">
                <Input
                  value={profileImageFile ? "" : profileImage}
                  onChange={(e) => {
                    setProfileImage(e.target.value);
                    setProfileImageFile(null);
                  }}
                  placeholder="Paste image URL here"
                  size="sm"
                />
                <Button
                  size="sm"
                  onClick={() =>
                    document.getElementById("profilePictureInput")?.click()
                  }
                >
                  Upload from Device
                </Button>
                <Input
                  id="profilePictureInput"
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  display="none"
                />
              </VStack>
            </FormControl>

            {/* Cover Image Upload */}
            <FormControl>
              <FormLabel>Cover Image</FormLabel>
              <VStack spacing={2} align="stretch">
                <Input
                  value={coverImageFile ? "" : coverImage}
                  onChange={(e) => {
                    setCoverImage(e.target.value);
                    setCoverImageFile(null);
                  }}
                  placeholder="Paste image URL here"
                  size="sm"
                />
                <Button
                  size="sm"
                  onClick={() =>
                    document.getElementById("backgroundImageInput")?.click()
                  }
                >
                  Upload from Device
                </Button>
                <Input
                  id="backgroundImageInput"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  display="none"
                />
              </VStack>
            </FormControl>

            {/* Location */}
            <FormControl>
              <FormLabel>Location</FormLabel>
              <Select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Select your country"
              >
                {countryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value} - {option.label}
                  </option>
                ))}
              </Select>
            </FormControl>
            {/* Website */}
            <FormControl>
              <FormLabel>
                Website - a clickable link to your personal website
              </FormLabel>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </FormControl>
            {/* About */}
            <FormControl>
              <FormLabel>Words to live by? (optional)</FormLabel>
              <Textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          {error && (
            <Box color="red.400" mb={2}>
              {error}
            </Box>
          )}
          <Button
            colorScheme="green"
            mr={3}
            onClick={handleSave}
            w="100%"
            isLoading={isSaving}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditProfile;
