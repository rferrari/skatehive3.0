import React, { useState } from 'react';
import { Box, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useAioha } from "@aioha/react-ui";
import { useRive, useStateMachineInput } from "@rive-app/react-canvas";
import { AiohaModal } from "@aioha/react-ui";
import { KeyTypes } from "@aioha/aioha";

// Modular Rive Button
const FooterNavButton = ({ src, onClick, badge }: { src: string, onClick?: () => void, badge?: number }) => {
  const STATE_MACHINE_NAME = "ButtonStateMachine";
  const TRIGGER_NAME = "click";
  const { rive, RiveComponent } = useRive({
    src,
    stateMachines: STATE_MACHINE_NAME,
    autoplay: true,
  });
  const clickInput = useStateMachineInput(rive, STATE_MACHINE_NAME, TRIGGER_NAME);
  return (
    <Box position="relative" display="inline-block" cursor="pointer" mx={1} onClick={() => { clickInput && clickInput.fire(); onClick && onClick(); }}>
      <RiveComponent style={{ width: 48, height: 48 }} />
      {!!badge && badge > 0 && (
        <Box
          as="span"
          position="absolute"
          top={0}
          right={0}
          bg="red.500"
          color="white"
          borderRadius="full"
          fontSize="xs"
          px={2}
          py={0.5}
          zIndex={1}
        >
          {badge}
        </Box>
      )}
    </Box>
  );
};

export default function FooterNavButtons({ newNotificationCount = 0 }: { newNotificationCount?: number }) {
  const router = useRouter();
  const { user } = useAioha();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalDisplayed, setModalDisplayed] = useState(false);

  // Placeholder logout function
  const handleLogout = () => {
    // TODO: Replace with actual logout logic
    alert("Logged out!");
  };

  return (
    <>
      <Box
        as="nav"
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        bg="black"
        p={0}
        borderTop="1px solid"
        borderColor="primary"
        display={{ base: "flex", md: "none" }}
        justifyContent="center"
        zIndex="999"
        height="40px"
        m={0}
        mb={0}
        pb={0}
      >
        <Box display="flex" flexDirection="row" justifyContent="center" alignItems="center" p={0}>
          {[
            { src: "/buttons/home.riv", onClick: () => router.push("/") },
            { src: "/buttons/blog.riv", onClick: () => router.push("/blog") },
            { src: "/buttons/leaderboard.riv", onClick: () => router.push("/leaderboard") },
            { src: "/buttons/map.riv", onClick: () => router.push("/skatespots") },
            { src: "/buttons/bounties.riv", onClick: () => router.push("/bounties") },
            { src: "/buttons/notif.riv", onClick: () => router.push("/notifications"), badge: newNotificationCount },
            { src: "/buttons/wallet.riv", onClick: () => router.push("/wallet") },
            {
              src: "/buttons/profile.riv",
              onClick: () => {
                if (user) {
                  router.push(`/user/${user}?view=grid`);
                } else {
                  setModalDisplayed(true);
                }
              }
            },
          ].map((btn, idx) => (
            <Box key={btn.src} marginLeft={idx === 0 ? 0 : "-10px"} zIndex={idx} position="relative">
              <FooterNavButton src={btn.src} onClick={btn.onClick} badge={btn.badge} />
            </Box>
          ))}
        </Box>
      </Box>
      <AiohaModal
        displayed={modalDisplayed}
        loginOptions={{
          msg: "Login",
          keyType: KeyTypes.Posting,
          loginTitle: "Login",
        }}
        onLogin={() => {}}
        onClose={() => setModalDisplayed(false)}
      />
    </>
  );
} 