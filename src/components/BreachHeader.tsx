/**
 * BreachHeader — Ink-managed startup header that survives terminal resize.
 *
 * Reuses the exact same ANSI rendering from StartupScreen.getStartupLines()
 * so the output looks identical to the raw startup splash. The difference:
 * this lives inside Ink's render tree, so it persists through resize/maximize.
 */

import * as React from 'react';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { Box, Text } from '../ink.js';
import { getStartupLines } from './StartupScreen.js';

export function BreachHeader(): React.ReactNode {
  const { columns } = useTerminalSize();
  const lines = React.useMemo(() => getStartupLines(columns), [columns]);

  return (
    <Box flexDirection="column">
      {lines.map((line, i) => (
        <Text key={i}>{line}</Text>
      ))}
    </Box>
  );
}
