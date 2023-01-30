// TODO: move this file somewhere permanent.
import {
  Alg,
  Commutator,
  Conjugate,
  functionFromTraversal,
  Grouping,
  LineComment,
  Move,
  Newline,
  Pause,
  TraversalUp,
} from "../alg";
import type { PuzzleLoader } from "../puzzles";
import { CommonMetric } from "./commonMetrics";
import { countMove3x3x3OBTM } from "./cube3x3x3OBTM";

/*
 *   For movecount, that understands puzzle rotations.  This code
 *   should be moved to the alg class, probably.
 */
class CountMoves extends TraversalUp<number> {
  constructor(private metric: (move: Move) => number) {
    super();
  }

  public traverseAlg(alg: Alg): number {
    let r = 0;
    for (const algNode of alg.childAlgNodes()) {
      r += this.traverseAlgNode(algNode);
    }
    return r;
  }

  public traverseGrouping(grouping: Grouping): number {
    const alg: Alg = grouping.alg;
    return this.traverseAlg(alg) * Math.abs(grouping.amount);
  }

  public traverseMove(move: Move): number {
    return this.metric(move);
  }

  public traverseCommutator(commutator: Commutator): number {
    return (
      2 * (this.traverseAlg(commutator.A) + this.traverseAlg(commutator.B))
    );
  }

  public traverseConjugate(conjugate: Conjugate): number {
    return 2 * this.traverseAlg(conjugate.A) + this.traverseAlg(conjugate.B);
  }

  // TODO: Remove spaces between repeated pauses (in traverseSequence)
  public traversePause(_pause: Pause): number {
    return 0;
  }

  public traverseNewline(_newLine: Newline): number {
    return 0;
  }

  // TODO: Enforce being followed by a newline (or the end of the alg)?
  public traverseLineComment(_comment: LineComment): number {
    return 0;
  }
}

function isCharUppercase(c: string): boolean {
  return "A" <= c && c <= "Z";
}

// TODO: Implement a puzzle-specific way to calculate this.
function baseMetric(move: Move): number {
  const fam = move.family;
  if (
    (isCharUppercase(fam[0]) && fam[fam.length - 1] === "v") ||
    fam === "x" ||
    fam === "y" ||
    fam === "z" ||
    fam === "T"
  ) {
    return 0;
  } else {
    return 1;
  }
}

function etmMetric(_move: Move): number {
  return 1;
}

// TODO: Implement a puzzle-specific way to calculate this.
function quantumMetric(move: Move): number {
  const fam = move.family;
  if (
    (isCharUppercase(fam[0]) && fam[fam.length - 1] === "v") ||
    fam === "x" ||
    fam === "y" ||
    fam === "z" ||
    fam === "T"
  ) {
    return 0;
  } else {
    return Math.abs(move.amount);
  }
}

export const countMoves = functionFromTraversal(CountMoves, [baseMetric]);
export const countMovesETM = functionFromTraversal(CountMoves, [etmMetric]);
export const countQuantumMoves = functionFromTraversal(CountMoves, [
  quantumMetric,
]);

const countMoves3x3x3OBTM = functionFromTraversal(CountMoves, [
  countMove3x3x3OBTM,
]);

/**
 * Only implemented so far:
 *
 * - 3x3x3, OBTM
 */
export function countMetricMoves(
  puzzle: PuzzleLoader,
  metric: CommonMetric,
  alg: Alg,
): number {
  if (puzzle.id === "3x3x3" && metric === CommonMetric.OuterBlockTurnMetric) {
    return countMoves3x3x3OBTM(alg);
  }
  throw new Error("Unsupported puzzle or metric.");
}
