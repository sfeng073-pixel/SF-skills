export function markReadyWhenNoBlockingWarnings(warnings = []) {
  const blockingWarnings = warnings.filter((item) => item?.blocking === true);
  return {
    blockingWarnings,
    broadcastReady: blockingWarnings.length === 0
  };
}
