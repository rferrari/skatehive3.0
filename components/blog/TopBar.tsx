'use client';
import { Flex, IconButton, Menu, MenuButton, MenuList, MenuItem, Button, Tooltip } from '@chakra-ui/react';
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

    return (
        <Flex justifyContent="space-between" mb={4} alignItems="center">
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
                <Flex display={{ base: 'none', md: 'flex' }}>
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
                            variant={viewMode === 'grid' ? 'solid' : 'outline'}
                            colorScheme={viewMode === 'grid' ? 'primary' : 'muted'}
                            boxShadow={viewMode === 'grid' ? '0 0 0 2px var(--chakra-colors-primary, #319795)' : undefined}
                            mr={2}
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
                            variant={viewMode === 'list' ? 'solid' : 'outline'}
                            colorScheme={viewMode === 'list' ? 'primary' : 'muted'}
                            boxShadow={viewMode === 'list' ? '0 0 0 2px var(--chakra-colors-primary, #319795)' : undefined}
                            mr={2}
                        />
                    </Tooltip>
                    <Tooltip label="Magazine View" hasArrow>
                        <IconButton
                            aria-label="Magazine View"
                            icon={<FiBook />}  
                            onClick={() => router.push('/magazine')}
                            isActive={viewMode === 'magazine'}
                            variant={viewMode === 'magazine' ? 'solid' : 'outline'}
                            colorScheme={viewMode === 'magazine' ? 'primary' : 'muted'}
                            boxShadow={viewMode === 'magazine' ? '0 0 0 2px var(--chakra-colors-primary, #319795)' : undefined}
                        />
                    </Tooltip>
                </Flex>
                <Menu>
                    <MenuButton
                        as={Button}
                        aria-label="Sort Options"
                        leftIcon={<FaSort />} 
                        variant="outline"
                        ml={4}
                    >
                        Sort
                    </MenuButton>
                    <MenuList zIndex="popover">
                        <MenuItem onClick={() => setQuery('created')}>Recent</MenuItem>
                        <MenuItem onClick={() => setQuery('trending')}>Trending</MenuItem>
                        <MenuItem onClick={() => setQuery('hot')}>Hot</MenuItem>
                    </MenuList>
                </Menu>
            </Flex>
        </Flex>
    );
}
