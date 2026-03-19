import { useNeuralStore } from "../stores/neural";
import { getClient } from "../client/arqitect";

/** Score thresholds for color-coding nerve health. */
const SCORE_THRESHOLD_HIGH = 70;
const SCORE_THRESHOLD_MED = 40;

/** Color palette for nerve scores. */
const SCORE_COLOR_HIGH = "#00ff88";
const SCORE_COLOR_MED = "#f5d05b";
const SCORE_COLOR_LOW = "#f55b5b";

/** Color palette for nerve statuses. */
const STATUS_COLORS: Record<string, string> = {
  pass: "#00ff88",
  fail: "#f55b5b",
  testing: "#f5d05b",
};
const STATUS_COLOR_DEFAULT = "rgba(255,255,255,0.4)";

/**
 * Normalizes a raw score (0–1 or 0–100) into an integer percentage (0–100).
 * Values > 1 are treated as already-percentage values and rounded.
 * Values <= 1 are multiplied by 100 and rounded.
 *
 * @param raw - The raw score value from the API.
 * @returns An integer percentage between 0 and 100.
 */
export function normalizeScore(raw: number): number {
  return raw > 1 ? Math.round(raw) : Math.round(raw * 100);
}

/**
 * Returns a hex color string based on a percentage score.
 * Green (>= 70), yellow (>= 40), red (< 40).
 *
 * @param percent - Score as a 0–100 integer.
 * @returns Hex color string.
 */
export function scoreColor(percent: number): string {
  if (percent >= SCORE_THRESHOLD_HIGH) return SCORE_COLOR_HIGH;
  if (percent >= SCORE_THRESHOLD_MED) return SCORE_COLOR_MED;
  return SCORE_COLOR_LOW;
}

/**
 * Returns a hex color string for a given nerve status.
 *
 * @param status - One of "pass", "fail", "testing", or any other string.
 * @returns Hex color string.
 */
export function statusColor(status: string): string {
  return STATUS_COLORS[status] ?? STATUS_COLOR_DEFAULT;
}

/**
 * Opens the nerve detail modal by setting the selected nerve and
 * fetching its details from the server. Updates the neural store
 * with loading state and results.
 *
 * @param name - The nerve name to load details for.
 */
export function loadNerveDetails(name: string): void {
  const store = useNeuralStore.getState();
  store.setSelectedNerve(name);
  store.setDetailsLoading(true);
  store.setSelectedNerveDetails(null);

  getClient()
    .getNerveDetails(name)
    .then((details) => {
      useNeuralStore.getState().setSelectedNerveDetails(details);
      useNeuralStore.getState().setDetailsLoading(false);
    })
    .catch((err: unknown) => {
      console.warn(`Failed to load nerve details for "${name}":`, err);
      useNeuralStore.getState().setDetailsLoading(false);
    });
}
