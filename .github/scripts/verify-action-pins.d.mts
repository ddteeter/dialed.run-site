export interface Use {
  line: number;
  value: string;
}
export type Pin =
  | { local: true }
  | { error: string }
  | { repo: string; sha: string; tag: string };
export function findUses(text: string): Use[];
export function parsePin(value: string): Pin;
export function workflowPins(dir?: URL): (Use & { file: string; pin: Pin })[];
