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
  HStack,
  Box,
} from "@chakra-ui/react";
import { updateProfile } from "@/lib/hive/client-functions";
import { updateProfileWithPrivateKey } from "@/lib/hive/server-functions";

interface EditProfileProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: any;
  setProfileData: (data: any) => void;
  username: string;
}

const EditProfile: React.FC<EditProfileProps> = ({ isOpen, onClose, profileData, setProfileData, username }) => {
  const [name, setName] = useState(profileData.name || "");
  const [about, setAbout] = useState(profileData.about || "");
  const [location, setLocation] = useState(profileData.location || "");
  const [website, setWebsite] = useState(profileData.website || "");
  const [profileImage, setProfileImage] = useState(profileData.profileImage || "");
  const [coverImage, setCoverImage] = useState(profileData.coverImage || "");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      return result.IpfsHash ? `https://ipfs.skatehive.app/ipfs/${result.IpfsHash}` : null;
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
        const encryptedPrivateKey = localStorage.getItem("EncPrivateKey");
        await updateProfileWithPrivateKey(
          encryptedPrivateKey,
          username,
          "", // name is not used
          about,
          location,
          finalCoverImage,
          finalProfileImage,
          website
        );
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Profile</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Profile Picture */}
            <FormControl>
              <Box mb={2} display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                <FormLabel m={0}>Profile Picture</FormLabel>
                <Input
                  value={profileImageFile ? '' : profileImage}
                  onChange={e => {
                    setProfileImage(e.target.value);
                    setProfileImageFile(null);
                  }}
                  placeholder="Paste image URL here"
                  size="sm"
                  flex={1}
                  mr={2}
                />
                <Button size="sm" onClick={() => document.getElementById('profilePictureInput')?.click()}>
                  Upload
                </Button>
                <Input
                  id="profilePictureInput"
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  display="none"
                />
              </Box>
              {profileImage && (
                <Box display="flex" justifyContent="center" width="100%">
                  <Image src={profileImage} alt="Profile Picture" boxSize="50px" borderRadius="md" mb={2} />
                </Box>
              )}
            </FormControl>
            {/* Background Image */}
            <FormControl>
              <Box mb={2} display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                <FormLabel m={0}>Background Image</FormLabel>
                <Input
                  value={coverImageFile ? '' : coverImage}
                  onChange={e => {
                    setCoverImage(e.target.value);
                    setCoverImageFile(null);
                  }}
                  placeholder="Paste image URL here"
                  size="sm"
                  flex={1}
                  mr={2}
                />
                <Button size="sm" onClick={() => document.getElementById('backgroundImageInput')?.click()}>
                  Upload
                </Button>
                <Input
                  id="backgroundImageInput"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  display="none"
                />
              </Box>
              {coverImage && (
                <Image src={coverImage} alt="Background" width="100%" maxHeight="180px" objectFit="cover" borderRadius="md" mb={2} />
              )}
            </FormControl>
            {/* Location */}
            <FormControl>
              <FormLabel>Location</FormLabel>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Type your location" />
            </FormControl>
            {/* Website */}
            <FormControl>
              <FormLabel>Website - a clickable link to your personal website</FormLabel>
              <Input value={website} onChange={e => setWebsite(e.target.value)} />
            </FormControl>
            {/* About */}
            <FormControl>
              <FormLabel>Words to live by? (optional)</FormLabel>
              <Textarea value={about} onChange={e => setAbout(e.target.value)} />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          {error && <Box color="red.400" mb={2}>{error}</Box>}
          <Button colorScheme="green" mr={3} onClick={handleSave} w="100%" isLoading={isSaving}>
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditProfile; 