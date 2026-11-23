// Fixture only. It never represents another user's real intent.
export const incomingDemoInterests = new Set(["voice-01", "voice-04", "voice-07", "voice-10"]);
export function interestStatus(id: string, sent: string[]) {
  return !sent.includes(id) ? "none" : incomingDemoInterests.has(id) ? "matched" : "sent";
}
