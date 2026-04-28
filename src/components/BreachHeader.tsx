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
  const { columns, rows } = useTerminalSize();
  const lines = React.useMemo(() => getStartupLines(columns), [columns]);
  const logoLines = lines.slice(2, 8);
  const taglineLines = lines.slice(9, 11);
  const protocolLines = lines.slice(13, 23);

  // Push header toward vertical center: ~19 lines of content,
  // subtract footer (~6 lines for input + status), center the rest.
  const headerHeight = logoLines.length + taglineLines.length + protocolLines.length + 2;
  const availableSpace = rows - headerHeight - 6;
  const topPad = Math.max(1, Math.floor(availableSpace / 3));

  return (
    <Box flexDirection="column" paddingTop={topPad}>
      {logoLines.map((line, i) => (
        <Text key={i}>{line}</Text>
      ))}
      {taglineLines.map((line, i) => (
        <Text key={`tag-${i}`}>{line}</Text>
      ))}
      <Box height={1} />
      {protocolLines.map((line, i) => (
        <Text key={`proto-${i}`}>{line}</Text>
      ))}
    </Box>
  );
}
