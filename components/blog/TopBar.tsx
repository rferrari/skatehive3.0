'use client';
import { Flex, IconButton, Menu, MenuButton, MenuList, MenuItem, Button } from '@chakra-ui/react';
import { FaTh, FaBars, FaPen, FaSort } from 'react-icons/fa'; 
import { FiBook } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useAioha } from '@aioha/react-ui';

interface TopBarProps {
    viewMode: 'grid' | 'list' | 'magazine';
    setViewMode: (mode: 'grid' | 'list' | 'magazine') => void;
    setQuery: (query: string) => void;
}

export default function TopBar({ viewMode, setViewMode, setQuery }: TopBarProps) {
    const router = useRouter(); 
    const { user } = useAioha();

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
                    <IconButton
                        aria-label="Grid View"
                        icon={<FaTh />} 
                        onClick={() => setViewMode('grid')}
                        isActive={viewMode === 'grid'}
                        variant={viewMode === 'grid' ? 'solid' : 'outline'}  
                    />
                    <IconButton
                        aria-label="List View"
                        icon={<FaBars />}  
                        onClick={() => setViewMode('list')}
                        isActive={viewMode === 'list'}
                        variant={viewMode === 'list' ? 'solid' : 'outline'}
                        ml={4}
                    />
                    <IconButton
                        aria-label="Magazine View"
                        icon={<FiBook />}  
                        onClick={() => router.push('/magazine')}
                        ml={4}
                    />
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
