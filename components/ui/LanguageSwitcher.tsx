'use client';

import { Menu, MenuButton, MenuList, MenuItem, Button, Text } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useLocale } from '@/contexts/LocaleContext';
import { locales, localeNames, Locale } from '@/lib/i18n/translations';

const localeFlags: Record<Locale, string> = {
  'en': '🇺🇸',
  'pt-BR': '🇧🇷',
  'es': '🇪🇸',
  'lg': '🇺🇬',
};

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        size="sm"
        variant="ghost"
        color="text"
        _hover={{ bg: 'muted' }}
      >
        <Text as="span" mr={1}>{localeFlags[locale]}</Text>
        {localeNames[locale]}
      </MenuButton>
      <MenuList bg="panel" borderColor="border">
        {locales.map((loc) => (
          <MenuItem
            key={loc}
            onClick={() => setLocale(loc)}
            bg={locale === loc ? 'muted' : 'transparent'}
            _hover={{ bg: 'panelHover' }}
            color="text"
          >
            <Text as="span" mr={2}>{localeFlags[loc]}</Text>
            {localeNames[loc]}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
}
