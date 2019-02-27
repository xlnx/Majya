import { ActionNewRound, ActionDealTile, ActionDiscardTile, ActionChiPengGang, Tile, lit2tile, tile2lit, ActionAnGangAddGang, TileLiteral } from "./majsoul/def";
import { MPSZ, N5, N46, N37, N1234, N28, N19, N456, floorTile } from "./majsoul/witch";

type Signal = {
	light?: TileLiteral[][]
}

class Control {

	public hand: Tile[]

	private currSeat: number
	private mySeat?: number

	private discardTiles: Tile[][]
	private refusedTiles: Set<Tile>[]
	private mountain: number[]
	private riichies: Set<number>

	private wall: Set<Tile>
	private thinWall: Set<Tile>

	private reset() {
		this.mySeat = undefined
		this.discardTiles = [[], [], [], []]
		this.refusedTiles = [0, 0, 0, 0].map(() => new Set<Tile>())
		this.mountain = new Array(3 * 9 + 7).fill(4)
		this.riichies = new Set<number>()
		this.wall = new Set<Tile>()
		this.thinWall = new Set<Tile>()
	}

	constructor() {
		this.reset()
	}

	private dropTiles(tiles: Tile[]) {
		// console.log("drop: " + tiles)
		for (let tile of tiles) {
			this.mountain[tile] -= 1
			switch (this.mountain[tile]) {
				case 1: this.thinWall.add(tile); break
				case 0: this.thinWall.delete(tile);
					this.wall.add(tile); break
			}
		}
		// console.log(this.mountain)
		// if (this.wall.size) {
		// 	let wallLits = []
		// 	this.wall.forEach((tile: Tile) => {
		// 		wallLits.push(tile2lit(tile))
		// 	})
		// 	console.log("walls: " + wallLits)
		// }
		// if (this.thinWall.size) {
		// 	let thinWallLits = []
		// 	this.thinWall.forEach((tile: Tile) => {
		// 		thinWallLits.push(tile2lit(tile))
		// 	})
		// 	console.log("thin walls: " + thinWallLits)
		// }
	}

	private onNewRound(action: ActionNewRound) {
		this.reset()
		this.dropTiles([lit2tile(action.dora)].concat(action.tiles.map(lit2tile)))
	}

	private updateMySeat(action: ActionDealTile | ActionChiPengGang | ActionAnGangAddGang) {
		if (this.mySeat === undefined && action["operation"] != null &&
			action["operation"] != undefined) {
			this.mySeat = action.seat
			console.log("found my seat is: #" + this.mySeat)
		}
	}

	private onMyDiscard(): Signal | void {

	}

	private onDealTile(action: ActionDealTile): Signal | void {
		this.currSeat = action.seat
		this.updateMySeat(action)
		if (action.seat == this.mySeat) {
			this.dropTiles([lit2tile(action.tile)])
			this.onMyDiscard()
		}
	}

	private onDiscardTile(action: ActionDiscardTile) {
		// console.log(action.seat + " => " + action.tile)
		const tile = lit2tile(action.tile)
		this.discardTiles[action.seat].push(tile)
		this.riichies.forEach((seat: number) => {
			this.refusedTiles[seat].add(tile)
		})
		if (action.is_liqi || action.is_wliqi) {
			this.riichies.add(action.seat)
		}
		if (action.seat != this.mySeat) {
			this.dropTiles([tile])
		}
	}

	private onChiPengGang(action: ActionChiPengGang): Signal | void {
		this.currSeat = action.seat
		this.updateMySeat(action)
		if (action.seat != this.mySeat) {
			let tiles = []
			for (let idx in action.froms) {
				if (action.seat == action.froms[idx]) {
					tiles.push(lit2tile(action.tiles[idx]))
				}
			}
			this.dropTiles(tiles)
		} else {
			this.onMyDiscard()
		}
	}

	private onAnGangAddGang(action: ActionAnGangAddGang): Signal | void {
		this.currSeat = action.seat
		this.updateMySeat(action)
		if (action.seat != this.mySeat) {
			this.dropTiles((action.type == 3 ? [0, 0, 0, 0] : [0])
				.map(() => lit2tile(action.tiles)))
		} else {
			this.onMyDiscard()
		}
	}

	evaluate(): Signal | void {
		if (this.riichies.size) {
			let z0s = [], z1s = [], z2s = []
			for (let tile of MPSZ.Z) {
				switch (this.mountain[tile]) {
					case 0: z0s.push(tile); break
					case 1: z1s.push(tile); break
					case 2: z2s.push(tile); break
				}
			}
			// if (this.wall.size) {
			// 	let wallLits = []
			// 	this.wall.forEach((tile: Tile) => {
			// 		wallLits.push(tile2lit(tile))
			// 	})
			// 	console.log("walls: " + wallLits)
			// }
			// if (this.thinWall.size) {
			// 	let thinWallLits = []
			// 	this.thinWall.forEach((tile: Tile) => {
			// 		thinWallLits.push(tile2lit(tile))
			// 	})
			// 	console.log("thin walls: " + thinWallLits)
			// }
			let all
			this.riichies.forEach((seat) => {
				if (seat != this.mySeat) {
					let curr = new Array(3 * 9 + 7).fill(0)
					let selfDiscard = new Set<number>(this.discardTiles[seat])	//100
					// 筋19 => 单骑对碰
					let ftd19 = new Set<number>()	//80
					// 筋28 | 两筋456 => 单骑对碰 | 卡隆
					let ftd28456 = new Set<number>()	//50
					// 筋37 => 单骑对碰 | 卡隆 | 12顺
					let ftd37 = new Set<number>()	//40

					selfDiscard.forEach((tile: Tile) => {
						if (N5.has(tile)) {
							// 2 <- 5 -> 8
							ftd28456.add(tile - 3)
							ftd28456.add(tile + 3)
						} else if (N46.has(tile)) {
							if (N1234.has(tile)) {
								// 1 <- 4 -> 7
								ftd19.add(tile - 3)
								ftd37.add(tile + 3)
							} else {
								// 3 <- 6 -> 9
								ftd19.add(tile + 3)
								ftd37.add(tile - 3)
							}
						} else {
							const other = N1234.has(tile) ? tile + 6 : tile - 6
							const walls = N1234.has(tile) ?
								[tile + 4, tile + 5] : [tile - 4, tile - 5]
							if (selfDiscard.has(other) || this.wall.has(walls[1])) {
								// 两筋牌 456 | 半筋+壁 (4) <- 6 -> 9
								ftd28456.add((tile + other) / 2 | 0)
							}
							if (this.wall.has(walls[0])) {
								// 半筋+壁 (5) <- 6 -> 9
								ftd19.add((tile + other) / 2 | 0)
							}
						}
					})

					this.wall.forEach((tile: Tile) => {
						if (N5.has(tile)) {
							if (this.wall.has(tile - 4)) {
								ftd19.add(tile - 1)
								ftd28456.add(tile - 2)
								ftd19.add(tile - 3)
							}
							if (this.wall.has(tile + 4)) {
								ftd19.add(tile + 1)
								ftd28456.add(tile + 2)
								ftd19.add(tile + 3)
							}
						} else if (N46.has(tile)) {
							if (N1234.has(tile)) {
								ftd19.add(tile - 1)
								ftd28456.add(tile - 2)
								ftd19.add(tile - 3)
							} else {
								ftd19.add(tile + 1)
								ftd28456.add(tile + 2)
								ftd19.add(tile + 3)
							}
						}
						if (N456.has(tile) || N37.has(tile)) {
							if (this.wall.has(tile - 2)) {
								ftd19.add(tile - 1)
							}
							if (this.wall.has(tile + 2)) {
								ftd19.add(tile + 1)
							}
						}
						if (N456.has(tile)) {
							if (this.wall.has(tile - 3)) {
								ftd19.add(tile - 1)
								ftd19.add(tile - 2)
							}
							if (this.wall.has(tile + 3)) {
								ftd19.add(tile + 1)
								ftd19.add(tile + 2)
							}
						} else {
							const floor = floorTile(tile)
							const step = tile > floor ? 1 : -1
							ftd19.add(floor)
							if (N37.has(tile)) {
								ftd19.add(floor + step)
							}
						}
					})

					Array.from(selfDiscard)
						.concat(Array.from(this.refusedTiles[seat]), z0s)
						.forEach((tile: Tile) => curr[tile] = Math.max(curr[tile], 100))
					Array.from(ftd19).concat(z1s, z2s)
						.forEach((tile: Tile) => curr[tile] = Math.max(curr[tile], 80))
					ftd28456.forEach((tile: Tile) => curr[tile] = Math.max(curr[tile], 50))
					ftd37.forEach((tile: Tile) => curr[tile] = Math.max(curr[tile], 40))

					if (all) {
						all = all.map((val: number, tile: number) => Math.min(val, curr[tile]))
					} else {
						all = curr
					}
				}
			})
			if (!all) return
			let idall = all.map((score, tile) => [score, tile])
				.sort((a: number[], b: number[]) => b[0] - a[0])
				.filter(x => x[0] != 0)
			return {
				light: [
					idall.filter(x => x[0] == 100),
					idall.filter(x => x[0] == 80),
					idall.filter(x => x[0] == 50),
					idall.filter(x => x[0] == 40)
				].map(
					x => x.map(x => x[1])
						.sort((a: number, b: number) => this.mountain[a] - this.mountain[b])
						.map(tile2lit)
				)
			}
		}
	}

	handle(type: string, action: any): Signal | void {
		// console.log(action)
		switch (type) {
			case "ActionNewRound": this.onNewRound(action); break
			case "ActionDealTile": this.onDealTile(action); break
			case "ActionDiscardTile": this.onDiscardTile(action); break
			case "ActionChiPengGang": this.onChiPengGang(action); break
			case "ActionAnGangAddGang": this.onAnGangAddGang(action); break
			default:
				console.log("no handler for " + type)
		}
		return this.evaluate()
	}
}

export {
	Control,
	Signal
}