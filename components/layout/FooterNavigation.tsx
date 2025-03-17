import { useAioha, AiohaModal } from '@aioha/react-ui';
import { Box, Button, HStack, Icon, Tooltip, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { FiBell, FiBook, FiCreditCard, FiHome, FiUser } from 'react-icons/fi';
import { useState } from 'react';
import { KeyTypes } from '@aioha/aioha';

export default function FooterNavigation() {

    const { user } = useAioha();
    const router = useRouter();
    const [modalDisplayed, setModalDisplayed] = useState(false);

    const handleNavigation = (path: string) => {
        if (router) {
            router.push(path);
        }
    };

    return (
        <Box
            as="nav"
            position="fixed"
            bottom="0"
            left="0"
            right="0"
            bg="secondary"
            p={2}
            borderTop="1px solid"
            borderColor="tb1"
            display={{ base: 'block', md: 'none' }}
            zIndex="999"
        >
            {user ? (
                <HStack justify="space-around">
                    <Tooltip label="Home" aria-label="Home tooltip">
                        <Button
                            onClick={() => handleNavigation("/")}
                            variant="ghost"
                            leftIcon={<Icon as={FiHome} boxSize={4} />}
                        />
                    </Tooltip>
                    <Tooltip label="Wallet" aria-label="Wallet tooltip">
                        <Button
                            onClick={() => handleNavigation("/@" + user + '/wallet')}
                            variant="ghost"
                            leftIcon={<Icon as={FiCreditCard} boxSize={5} />}
                            _hover={{ bg: "muted" }}
                        />
                    </Tooltip>
                    <Tooltip label="Blog" aria-label="Blog tooltip">
                        <Button
                            onClick={() => handleNavigation("/blog")}
                            variant="ghost"
                            leftIcon={<Icon as={FiBook} boxSize={4} />}
                        />
                    </Tooltip>
                    <Tooltip label="Notifications" aria-label="Notifications tooltip">
                        <Button
                            onClick={() => handleNavigation("/@" + user + "/notifications")}
                            variant="ghost"
                            leftIcon={<Icon as={FiBell} boxSize={4} />}
                        />
                    </Tooltip>
                    <Tooltip label="Profile" aria-label="Profile tooltip">
                        <Menu>
                            <MenuButton
                                as={Button}
                                variant="ghost"
                                leftIcon={<Icon as={FiUser} boxSize={4} />}
                                _hover={{ bg: "muted" }}
                            />
                            <MenuList bg="secondary" borderColor="tb1">
                                <MenuItem onClick={() => handleNavigation("/@" + user)} _hover={{ bg: "muted" }} icon={<Icon as={FiUser} boxSize={4} />}>Go to Profile</MenuItem>
                                <MenuItem onClick={() => setModalDisplayed(true)} _hover={{ bg: "muted" }} icon={<Icon as={FiUser} boxSize={4} />}>Log out</MenuItem>
                            </MenuList>
                        </Menu>
                    </Tooltip>
                </HStack>
            ) : (
                <HStack justify="space-around">
                    <Tooltip label="Home" aria-label="Home tooltip">
                        <Button
                            onClick={() => handleNavigation("/")}
                            variant="ghost"
                            leftIcon={<Icon as={FiHome} boxSize={4} />}
                        />
                    </Tooltip>
                    <Button
                        onClick={() => setModalDisplayed(true)}
                        variant="solid"
                        size="lg"
                        colorScheme="teal"
                    >
                        Login
                    </Button>
                </HStack>
            )}
            <AiohaModal
                displayed={modalDisplayed}
                loginOptions={{
                    msg: 'Login',
                    keyType: KeyTypes.Posting,
                    loginTitle: 'Login',
                }}
                onLogin={console.log}
                onClose={() => setModalDisplayed(false)}
            />
        </Box>
    );
}
