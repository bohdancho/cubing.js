// TODO: move this into the 3x3x3 puzzle loader.

import type { Move } from "../alg";
import { experimentalCube3x3x3KPuzzleDefinition } from "../puzzles/cubing-private";
import { CommonMetric } from "./commonMetrics";

enum MoveType {
  Rotation = "Rotation",
  Outer = "Outer",
  Inner = "Inner",
}

function uncachedMoveCount(moveQuantumString: string): MoveType {
  if (
    moveQuantumString.endsWith("v") ||
    ["x", "y", "z"].includes(moveQuantumString)
  ) {
    // Rv
    return MoveType.Rotation;
  }
  if (
    moveQuantumString.startsWith("2") ||
    ["M", "E", "S"].includes(moveQuantumString)
  ) {
    return MoveType.Inner;
  }
  return MoveType.Outer;
}

let cache: Record<string, MoveType> | undefined;
function getCache(): Record<string, MoveType> {
  if (cache) {
    return cache;
  }
  cache = {};
  const moveQuantumStrings = [
    ...Object.keys(experimentalCube3x3x3KPuzzleDefinition.moves),
    ...Object.keys(
      experimentalCube3x3x3KPuzzleDefinition.experimentalDerivedMoves!,
    ),
  ];
  for (const moveQuantumString of moveQuantumStrings) {
    cache[moveQuantumString] = uncachedMoveCount(moveQuantumString);
  }
  return cache;
}

// Ancient wisdom: https://github.com/cubing/alg.js/blob/0599fad84d81b8d943ad3ea3e5dc191db8b6c157/alg.js#L638-L651
/**
 * A move with an amount of 0 always has 0 cost. Else, the cost is
 *
 * constantFactor + amountFactor * Math.abs(move.amount)
 *
 */
const costFactors: Partial<
  Record<
    CommonMetric,
    Record<
      MoveType,
      {
        constantFactor: number;
        amountFactor: number;
      }
    >
  >
> = {
  [CommonMetric.OuterBlockTurnMetric]: {
    [MoveType.Rotation]: { constantFactor: 0, amountFactor: 0 },
    [MoveType.Outer]: { constantFactor: 1, amountFactor: 0 },
    [MoveType.Inner]: { constantFactor: 2, amountFactor: 0 },
  },
};

export function countMove3x3x3OBTM(move: Move): number {
  const cache = getCache();
  const moveQuantumString = move.quantum.toString();
  if (!(moveQuantumString in cache)) {
    throw new Error(`Invalid move for 3x3x3 OBTM: ${moveQuantumString}`);
  }
  const costType = cache[moveQuantumString];
  const { constantFactor, amountFactor } =
    costFactors[CommonMetric.OuterBlockTurnMetric]![costType];
  return constantFactor + amountFactor * Math.abs(move.amount);
}
