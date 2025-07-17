'use client';
import { Flex, IconButton, Menu, MenuButton, MenuList, MenuItem, Button, Tooltip, ButtonGroup } from '@chakra-ui/react';
import { FaTh, FaBars, FaPen, FaSort } from 'react-icons/fa'; 
import { FiBook } from 'react-icons/fi';
import { useRouter, usePathname } from 'next/navigation';
import { useAioha } from '@aioha/react-ui';

interface TopBarProps {
    viewMode: 'grid' | 'list' | 'magazine';
    setViewMode: (mode: 'grid' | 'list' | 'magazine') => void;
    setQuery: (query: string) => void;
}

export default function TopBar({ viewMode, setViewMode, setQuery }: TopBarProps) {
    const router = useRouter(); 
    const pathname = usePathname();
    const { user } = useAioha();
    const isMagazinePage = pathname === '/magazine';

    const buttonStyle = {
        "&:hover": {
          boxShadow: "4px 4px 6px var(--chakra-colors-primary-alpha)",
        },
        "&:active": {
          transform: "translate(2px, 2px)",
          boxShadow: "2px 2px 3px var(--chakra-colors-primary-alpha)",
        },
      };

    return (
        <Flex justifyContent="space-between" mb={4} alignItems="center" pt={4} pl={8} pr={4}>
            <Flex flex="1" alignItems="center">
                {user && (
                    <IconButton
                        aria-label="Compose"
                        icon={<FaPen />}  
                        onClick={() => router.push('/compose')}  
                        variant="outline"  
                    />
                )}
            </Flex>
            <Flex flex="1" justifyContent="flex-end" alignItems="center">
                {/* Hide grid/list toggle on mobile */}
                <ButtonGroup size="sm" isAttached variant="outline" colorScheme="green" display={{ base: 'none', md: 'flex' }}>
                    <Tooltip label="Grid View" hasArrow>
                        <IconButton
                            aria-label="Grid View"
                            icon={<FaTh />} 
                            onClick={() => {
                                if (isMagazinePage) {
                                    router.push('/blog?view=grid');
                                } else {
                                    setViewMode('grid');
                                }
                            }}
                            isActive={viewMode === 'grid'}
                            sx={buttonStyle}
                        />
                    </Tooltip>
                    <Tooltip label="List View" hasArrow>
                        <IconButton
                            aria-label="List View"
                            icon={<FaBars />}  
                            onClick={() => {
                                if (isMagazinePage) {
                                    router.push('/blog?view=list');
                                } else {
                                    setViewMode('list');
                                }
                            }}
                            isActive={viewMode === 'list'}
                            sx={buttonStyle}
                        />
                    </Tooltip>
                    <Tooltip label="Magazine View" hasArrow>
                        <IconButton
                            aria-label="Magazine View"
                            icon={<FiBook />}  
                            onClick={() => {
                                if (isMagazinePage) {
                                    router.push('/blog?view=magazine');
                                } else {
                                    setViewMode('magazine');
                                }
                            }}
                            isActive={viewMode === 'magazine'}
                            sx={buttonStyle}
                        />
                    </Tooltip>
                </ButtonGroup>
                <Menu>
                    <MenuButton
                        as={Button}
                        aria-label="Sort Options"
                        leftIcon={<FaSort />} 
                        variant="outline"
                        ml={4}
                        bg="background"
                        color="primary"
                        _hover={{ bg: 'muted', color: 'primary' }}
                        _active={{ bg: 'muted', color: 'primary' }}
                    >
                        Sort
                    </MenuButton>
                    <MenuList zIndex="popover" bg="background" color="primary" borderColor="primary">
                        <MenuItem bg="background" color="primary" _hover={{ bg: 'muted', color: 'primary' }} onClick={() => setQuery('created')}>Recent</MenuItem>
                        <MenuItem bg="background" color="primary" _hover={{ bg: 'muted', color: 'primary' }} onClick={() => setQuery('trending')}>Trending</MenuItem>
                        <MenuItem bg="background" color="primary" _hover={{ bg: 'muted', color: 'primary' }} onClick={() => setQuery('highest_paid')}>Highest Paid</MenuItem>
                        <MenuItem bg="background" color="primary" _hover={{ bg: 'muted', color: 'primary' }} onClick={() => setQuery('goat')}>GOAT</MenuItem>
                    </MenuList>
                </Menu>
            </Flex>
        </Flex>
    );
}
