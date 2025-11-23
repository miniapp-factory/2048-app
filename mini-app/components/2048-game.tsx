"use client";

import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "@/components/share";
import { MiniAppContext } from "@/components/context/miniapp-provider";
import { url } from "@/lib/metadata";

const GRID_SIZE = 4;
const TILE_VALUES = [2, 4];
const TILE_PROBABILITIES = [0.9, 0.1];

function getRandomTile() {
  return Math.random() < TILE_PROBABILITIES[0] ? TILE_VALUES[0] : TILE_VALUES[1];
}

function cloneGrid(grid: number[][]) {
  return grid.map(row => [...row]);
}

export default function Game2048() {
  const [grid, setGrid] = useState<number[][]>(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const { sdk, isInMiniApp } = useContext(MiniAppContext);

  useEffect(() => {
    resetGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver || win) return;
      switch (e.key) {
        case "ArrowUp":
          move("up");
          break;
        case "ArrowDown":
          move("down");
          break;
        case "ArrowLeft":
          move("left");
          break;
        case "ArrowRight":
          move("right");
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [grid, gameOver, win]);

  const addRandomTile = (g: number[][]) => {
    const empty = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (g[r][c] === 0) empty.push([r, c]);
      }
    }
    if (empty.length === 0) return g;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    g[r][c] = getRandomTile();
    return g;
  };

  const mergeLine = (line: number[]) => {
    const filtered = line.filter(v => v !== 0);
    const merged: number[] = [];
    let i = 0;
    while (i < filtered.length) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        merged.push(filtered[i] * 2);
        setScore(prev => prev + filtered[i] * 2);
        i += 2;
      } else {
        merged.push(filtered[i]);
        i += 1;
      }
    }
    while (merged.length < GRID_SIZE) merged.push(0);
    return merged;
  };

  const move = (direction: "up" | "down" | "left" | "right") => {
    let newGrid = cloneGrid(grid);
    let moved = false;

    const rotate = (g: number[][], times: number) => {
      let res = g;
      for (let t = 0; t < times; t++) {
        const newG: number[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            newG[c][GRID_SIZE - 1 - r] = res[r][c];
          }
        }
        res = newG;
      }
      return res;
    };

    const times = direction === "up" ? 1 : direction === "right" ? 2 : direction === "down" ? 3 : 0;
    newGrid = rotate(newGrid, times);

    for (let r = 0; r < GRID_SIZE; r++) {
      const original = newGrid[r];
      const merged = mergeLine(original);
      if (!moved && !merged.every((v, i) => v === original[i])) moved = true;
      newGrid[r] = merged;
    }

    newGrid = rotate(newGrid, (4 - times) % 4);

    if (moved) {
      newGrid = addRandomTile(newGrid);
      setGrid(newGrid);
      if (checkWin(newGrid)) setWin(true);
      if (checkGameOver(newGrid)) setGameOver(true);
    }
  };

  const checkWin = (g: number[][]) => {
    return g.some(row => row.includes(2048));
  };

  const checkGameOver = (g: number[][]) => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (g[r][c] === 0) return false;
        if (c + 1 < GRID_SIZE && g[r][c] === g[r][c + 1]) return false;
        if (r + 1 < GRID_SIZE && g[r][c] === g[r + 1][c]) return false;
      }
    }
    return true;
  };

  const resetGame = () => {
    const emptyGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
    const g1 = addRandomTile(emptyGrid);
    const g2 = addRandomTile(g1);
    setGrid(g2);
    setScore(0);
    setGameOver(false);
    setWin(false);
  };

  const shareScore = () => {
    const text = `I scored ${score} in 2048! ${url}`;
    if (isInMiniApp && sdk) {
      sdk.actions.composeCast({ text });
    } else {
      // fallback: open share dialog
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const tileColor = (value: number) => {
    const colors: Record<number, string> = {
      0: "bg-gray-200",
      2: "bg-yellow-200",
      4: "bg-yellow-300",
      8: "bg-orange-200",
      16: "bg-orange-300",
      32: "bg-orange-400",
      64: "bg-orange-500",
      128: "bg-red-200",
      256: "bg-red-300",
      512: "bg-red-400",
      1024: "bg-red-500",
      2048: "bg-red-600",
    };
    return colors[value] ?? "bg-gray-400";
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-3xl font-bold">2048</h1>
      <div className="grid grid-cols-4 gap-2">
        {grid.flat().map((v, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-center h-16 w-16 text-2xl font-bold rounded ${tileColor(v)}`}
          >
            {v !== 0 ? v : null}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => move("up")}>↑</Button>
        <Button onClick={() => move("down")}>↓</Button>
        <Button onClick={() => move("left")}>←</Button>
        <Button onClick={() => move("right")}>→</Button>
      </div>
      <div className="flex gap-4">
        <Button variant="outline" onClick={resetGame}>Restart</Button>
        {(gameOver || win) && (
          <Button onClick={shareScore}>Share Score</Button>
        )}
      </div>
      <div className="text-xl">Score: {score}</div>
      {win && <div className="text-2xl text-green-600">You Win!</div>}
      {gameOver && <div className="text-2xl text-red-600">Game Over</div>}
    </div>
  );
}
