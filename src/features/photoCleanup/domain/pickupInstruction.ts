export function pickupInstruction(object: string): string {
  return `Pick up ${object.charAt(0).toLowerCase()}${object.slice(1)}.`;
}
