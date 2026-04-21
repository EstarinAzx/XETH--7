import React from 'react';
import { Box, Text, useTheme } from 'src/ink.js';

declare const MACRO: { VERSION: string; DISPLAY_VERSION?: string };

const WELCOME_V2_WIDTH = 58;

// ── XETH--7 cyberpunk welcome banner ──────────────────────
// Replaces the original Claude mascot pixel art with a
// breach-protocol–themed ASCII scene.

const XETH_BANNER_DARK = [
  ``,
  `    ██╗  ██╗███████╗████████╗██╗  ██╗     ███████╗`,
  `    ╚██╗██╔╝██╔════╝╚══██╔══╝██║  ██║     ╚════██║`,
  `     ╚███╔╝ █████╗     ██║   ███████║█████╗   ██╔╝`,
  `     ██╔██╗ ██╔══╝     ██║   ██╔══██║╚════╝  ██╔╝ `,
  `    ██╔╝ ██╗███████╗   ██║   ██║  ██║       ██╔╝  `,
  `    ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝       ╚═╝   `,
  ``,
  `     ◢ NET//TECH ──────────────────────────── ◣`,
  `        XETH--7 // breach shell // protocol online.`,
  ``,
];

const XETH_BANNER_LIGHT = [
  ``,
  `    ██╗  ██╗███████╗████████╗██╗  ██╗     ███████╗`,
  `    ╚██╗██╔╝██╔════╝╚══██╔══╝██║  ██║     ╚════██║`,
  `     ╚███╔╝ █████╗     ██║   ███████║█████╗   ██╔╝`,
  `     ██╔██╗ ██╔══╝     ██║   ██╔══██║╚════╝  ██╔╝ `,
  `    ██╔╝ ██╗███████╗   ██║   ██║  ██║       ██╔╝  `,
  `    ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝       ╚═╝   `,
  ``,
  `     ◢ NET//TECH ──────────────────────────── ◣`,
  `        XETH--7 // breach shell // protocol online.`,
  ``,
];

export function WelcomeV2(): React.ReactNode {
  const [theme] = useTheme();
  const isLight = ['light', 'light-daltonized', 'light-ansi'].includes(theme);
  const banner = isLight ? XETH_BANNER_LIGHT : XETH_BANNER_DARK;

  return (
    <Box width={WELCOME_V2_WIDTH} flexDirection="column">
      <Text>
        <Text color="secondaryTheme" bold>{'Welcome to XETH--7'} </Text>
        <Text dimColor>v{MACRO.DISPLAY_VERSION ?? MACRO.VERSION} </Text>
      </Text>
      <Text>{'……………………………………………………………………………………………………………'}</Text>
      {banner.map((line, i) => (
        <Text key={i} color={i >= 1 && i <= 6 ? 'secondaryTheme' : undefined}>
          {line}
        </Text>
      ))}
      <Text>{'……………………………………………………………………………………………………………'}</Text>
    </Box>
  );
}
