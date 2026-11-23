// Fixture only. It never represents another user's real intent.
export const incomingDemoInterests = new Set(["asmr-risa", "asmr-shiori", "asmr-hina", "asmr-rei"]);
export function interestStatus(id: string, sent: string[]) {
  return !sent.includes(id) ? "none" : incomingDemoInterests.has(id) ? "matched" : "sent";
}
