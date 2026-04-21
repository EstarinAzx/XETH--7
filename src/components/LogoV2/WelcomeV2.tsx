import React from 'react';
import { Box, Text, useTheme } from 'src/ink.js';

declare const MACRO: { VERSION: string; DISPLAY_VERSION?: string };

const WELCOME_V2_WIDTH = 82;

// ── STRATAGEM X7 cyberpunk welcome banner ──────────────────────

const STX7_BANNER = [
  ``,
  `  ███████╗████████╗██████╗  █████╗ ████████╗ █████╗  ██████╗ ███████╗███╗   ███╗`,
  `  ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔════╝ ██╔════╝████╗ ████║`,
  `  ███████╗   ██║   ██████╔╝███████║   ██║   ███████║██║  ███╗█████╗  ██╔████╔██║`,
  `  ╚════██║   ██║   ██╔══██╗██╔══██║   ██║   ██╔══██║██║   ██║██╔══╝  ██║╚██╔╝██║`,
  `  ███████║   ██║   ██║  ██║██║  ██║   ██║   ██║  ██║╚██████╔╝███████╗██║ ╚═╝ ██║`,
  `  ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝     ╚═╝`,
  `                              ═══ X7 ═══                                        `,
  ``,
  `     ◢ NET//TECH ──────────────────────────────────────────── ◣`,
  `        STRATAGEM X7 // breach shell // protocol online.`,
  ``,
];

export function WelcomeV2(): React.ReactNode {
  const [theme] = useTheme();

  return (
    <Box width={WELCOME_V2_WIDTH} flexDirection="column">
      <Text>
        <Text color="secondaryTheme" bold>{'Welcome to STRATAGEM X7'} </Text>
        <Text dimColor>v{MACRO.DISPLAY_VERSION ?? MACRO.VERSION} </Text>
      </Text>
      <Text>{'……………………………………………………………………………………………………………………………………………………………………'}</Text>
      {STX7_BANNER.map((line, i) => (
        <Text key={i} color={i >= 1 && i <= 7 ? 'secondaryTheme' : undefined}>
          {line}
        </Text>
      ))}
      <Text>{'……………………………………………………………………………………………………………………………………………………………………'}</Text>
    </Box>
  );
}
