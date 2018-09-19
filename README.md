# `cubing.js`

A bundle that makes it easy to use multiple
[js.cubing.net](https://js.cubing.net) libraries.

## Usage

### Browser

Download the latest `cubing.js` browser dev build for easy experimentation:
https://github.com/cubing/cubing.js/releases/

    <script src="cubing.js"></script>
    <script>
      const {parse, invert, algToString} = alg;
      const {KPuzzle, Puzzles} = kpuzzle;

      console.log(algToString(invert(parse("R U R' U R U2 R'"))));

      const puzzle = new KPuzzle(Puzzles["333"]);
      puzzle.applyMove("R");
      console.log(puzzle.state);
    </script>

### Node

After `npm install cubing`:

    const {parse, invert, algToString} = require("cubing/alg");
    const {KPuzzle, Puzzles} = require("cubing/kpuzzle");

    console.log(algToString(invert(parse("R U R' U R U2 R'"))));

    const puzzle = new KPuzzle(Puzzles["333"]);
    puzzle.applyMove("R");
    console.log(puzzle.state);

Try it [at `runkit.com`](https://runkit.com/embed/jj71d1c08sta).

### ES6 / TypeScript

    import {parse, invert, algToString} from "cubing/alg"
    import {KPuzzle, Puzzles} from "cubing/kpuzzle"

    console.log(algToString(invert(parse("R U R' U R U2 R'"))));

    const puzzle = new KPuzzle(Puzzles["333"]);
    puzzle.applyMove("R");
    console.log(puzzle.state);
