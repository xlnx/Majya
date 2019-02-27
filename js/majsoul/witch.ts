import { lit2tile, Tile, tile2lit } from "./def";

const MPSZ = {
	M: ["1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m", "9m"].map(lit2tile),
	P: ["1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p"].map(lit2tile),
	S: ["1s", "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s"].map(lit2tile),
	Z: ["1z", "2z", "3z", "4z", "5z", "6z", "7z"].map(lit2tile)
}

const N1234 = new Set<number>([
	"1m", "1s", "1p",
	"2m", "2s", "2p",
	"3m", "3s", "3p",
	"4m", "4s", "4p",
].map(lit2tile))

const N6789 = new Set<number>([
	"6m", "6s", "6p",
	"7m", "7s", "7p",
	"8m", "8s", "8p",
	"9m", "9s", "9p",
].map(lit2tile))

const N19 = new Set<number>(["1m", "1s", "1p", "9m", "9s", "9p"].map(lit2tile))
const N28 = new Set<number>(["2m", "2s", "2p", "8m", "8s", "8p"].map(lit2tile))
const N37 = new Set<number>(["3m", "3s", "3p", "7m", "7s", "7p"].map(lit2tile))
const N46 = new Set<number>(["4m", "4s", "4p", "6m", "6s", "6p"].map(lit2tile))
const N5 = new Set<number>(["5m", "5s", "5p"].map(lit2tile))
const N456 = new Set<number>(["3m", "4m", "5m", "3p", "4p", "5p", "3s", "4s", "5s"].map(lit2tile))

function floorTile(tile: Tile) {
	const lit = tile2lit(tile)
	return lit2tile((Number.parseInt(lit[0]) <= 5 ? 1 : 9) + lit[1])
}

export {
	MPSZ,
	N19, N28, N37, N46, N5,
	N456, N1234, N6789,
	floorTile
}