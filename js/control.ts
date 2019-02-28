import { ActionNewRound, ActionDealTile, ActionDiscardTile, ActionChiPengGang, Tile, lit2tile, tile2lit, ActionAnGangAddGang, TileLiteral } from "./majsoul/def";
import { MPSZ, N5, N46, N37, N1234, N28, N19, N456, floorTile, ZS } from "./majsoul/witch";

type Signal = {
	safetyRating?: { tile: Tile, rate: number }[]
}

class Control {

	public hand: Tile[]

	private ju: number
	private chang: number
	private currSeat: number
	private mySeat?: number

	private mountain: number[]
	private doraIndicators: Tile[]
	private doras: Set<Tile>

	private discardTiles: Tile[][]		// 各家舍牌序列
	private refusedTiles: Set<Tile>[]	// 各家立直后不和的牌
	private riichies: Set<number>

	private wall: Set<Tile>
	private thinWall: Set<Tile>

	private reset() {
		this.ju = 0
		this.chang = 0
		this.currSeat = undefined
		this.mySeat = undefined

		this.mountain = new Array(3 * 9 + 7).fill(4)
		this.doraIndicators = []
		this.doras = new Set<Tile>()

		this.discardTiles = [[], [], [], []]
		this.refusedTiles = [0, 0, 0, 0].map(() => new Set<Tile>())
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
	}

	private updateSeat(action: ActionDealTile | ActionChiPengGang | ActionAnGangAddGang) {
		this.currSeat = action.seat
		if (this.mySeat === undefined && action["operation"] != null &&
			action["operation"] != undefined) {
			this.mySeat = action.seat
			console.log("found my seat is: #" + this.mySeat)
		}
	}

	private onMyDiscard() {

	}

	private onNewRound(action: ActionNewRound) {
		this.reset()
		this.ju = action.ju
		this.chang = action.chang
		// 从牌山中扣除初始可见的牌
		this.dropTiles([action.dora].concat(action.tiles)
			.map(lit2tile))
		this.doraIndicators = [action.dora].map(lit2tile)
	}

	private onDealTile(action: ActionDealTile) {
		this.updateSeat(action)

		if (action.doras) {
			let indx = action.doras.map(lit2tile)
			// 更新牌山，扣除新dora指示牌
			this.dropTiles(indx.slice(this.doraIndicators.length))
			this.doraIndicators = indx
		}
		if (action.seat == this.mySeat) {
			// 更新牌山，扣除进张
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
			// 若不是自家舍牌，更新牌山
			this.dropTiles([tile])
		}
	}

	private onChiPengGang(action: ActionChiPengGang) {
		this.updateSeat(action)
		if (action.seat != this.mySeat) {
			// 若不是自家鸣牌，更新牌山，扣除新亮出的牌
			this.dropTiles(action.tiles.map(lit2tile)
				.filter((_: Tile, idx: number) => action.seat == action.froms[idx]))
		} else {
			this.onMyDiscard()
		}
	}

	private onAnGangAddGang(action: ActionAnGangAddGang) {
		this.updateSeat(action)
		if (action.seat != this.mySeat) {
			// 若不是自家鸣牌，更新牌山
			this.dropTiles((action.type == 3 ? [0, 0, 0, 0] : [0])
				.map(() => lit2tile(action.tiles)))
		} else {
			this.onMyDiscard()
		}
	}

	evaluate(): Signal | void {
		if (this.riichies.size) {
			// 字牌余张
			let z0s = MPSZ.Z.filter(tile => this.mountain[tile] == 0)
			let z1s = MPSZ.Z.filter(tile => this.mountain[tile] == 1)
			let z23s = MPSZ.Z.filter(tile => this.mountain[tile] > 1)

			let all: number[]
			this.riichies.forEach((seat) => {
				if (seat != this.mySeat) {
					let selfDiscard = new Set<number>(this.discardTiles[seat])	//100
					// 筋19 => 单骑对碰
					let ftd19 = new Set<number>()	//80
					// 筋28 | 两筋456 => 单骑对碰 | 卡隆
					let ftd28456 = new Set<number>()	//50
					// 筋37 => 单骑对碰 | 卡隆 | 12顺
					let ftd37 = new Set<number>()	//40

					selfDiscard.forEach((tile: Tile) => {
						if (!ZS.has(tile)) {
							if (N5.has(tile)) {
								// 2 <- 5 -> 8
								ftd28456.add(tile - 3); ftd28456.add(tile + 3)
							} else if (N46.has(tile)) {
								if (N1234.has(tile)) {
									// 1 <- 4 -> 7
									ftd19.add(tile - 3); ftd37.add(tile + 3)
								} else {
									// 3 <- 6 -> 9
									ftd37.add(tile - 3); ftd19.add(tile + 3)
								}
							} else {
								// 两筋
								const [other, walls] = N1234.has(tile) ?
									// 3 <- 6 -> (7) (8) 9
									[tile + 6, [tile + 4, tile + 5]] :
									// 3 (4) (5) <- 6 -> 9
									[tile - 6, [tile - 4, tile - 5]]

								if (this.wall.has(walls[0])) {
									// 半筋+壁 (5) <- 6 -> 9   只可单骑对碰
									ftd19.add((tile + other) / 2 | 0)
								} else if (selfDiscard.has(other) || this.wall.has(walls[1])) {
									// 两筋牌 456 | 半筋+壁 (4) <- 6 -> 9   可单骑对碰|卡隆
									ftd28456.add((tile + other) / 2 | 0)
								}
							}
						}
					})

					this.wall.forEach((tile: Tile) => {
						if (N5.has(tile)) {
							for (let dir of [1, -1]) {
								if (this.wall.has(tile + 4 * dir)) {
									// (1) <-> (5)    24仅单骑  3单骑|卡隆
									ftd19.add(tile + 1 * dir)
									ftd28456.add(tile + 2 * dir)
									ftd19.add(tile + 3 * dir)
								}
							}
						} else if (N46.has(tile)) {
							const dir = N1234.has(tile) ? -1 : 1
							//  <- (4)    13仅单骑  2单骑|卡隆
							ftd19.add(tile + 1 * dir)
							ftd28456.add(tile + 2 * dir)
							ftd19.add(tile + 3 * dir)
						}
						if (N456.has(tile) || N37.has(tile)) {
							// (1) <-> (3)     2仅单骑
							for (let dir of [1, -1]) {
								if (this.wall.has(tile + 2 * dir)) {
									ftd19.add(tile + 1 * dir)
								}
							}
						}
						if (N456.has(tile)) {
							// (1) <-> (4)     23仅单骑
							for (let dir of [1, -1]) {
								if (this.wall.has(tile + 3 * dir)) {
									ftd19.add(tile + 1 * dir)
									ftd19.add(tile + 2 * dir)
								}
							}
						} else {
							const floor = floorTile(tile)
							const dir = tile > floor ? 1 : -1
							ftd19.add(floor)
							if (N37.has(tile)) {
								ftd19.add(floor + 1 * dir)
							}
						}
					})

					// 安全度等级
					let curr = new Array(3 * 9 + 7).fill(0)

					// 现物
					Array.from(selfDiscard).concat(Array.from(this.refusedTiles[seat]), z0s)
						.forEach(tile => curr[tile] = Math.max(curr[tile], Infinity))

					// 考虑不同听牌型
					{
						// 单骑对碰
						const yi = tile => {
							const n = Number.parseInt(tile2lit(tile)[0])
							return n >= 4 || n == (seat - this.ju + 4) % 4 || n == this.chang
						}
						let yiPai = z23s.filter(yi)
						let keFeng = z23s.filter(tile => !yi(tile))

						// 地狱单骑字牌，满分
						z1s.forEach(tile => curr[tile] = Math.max(curr[tile], 100))

						// 筋19，仅单骑  看牌数
						ftd19.forEach(tile => curr[tile] = Math.max(curr[tile],
							[Infinity, 90, 80, 70][this.mountain[tile]]))

						// 客风    看牌数
						keFeng.forEach(tile => curr[tile] = Math.max(curr[tile],
							[Infinity, 80, 70, 60][this.mountain[tile]]))

						// 筋28/两筋456，单骑对碰|卡隆
						ftd28456.forEach(tile => curr[tile] = Math.max(curr[tile], 50))

						// 筋37，单骑对碰|卡隆|12顺子
						ftd37.forEach(tile => curr[tile] = Math.max(curr[tile], 35))

						// 役牌
						yiPai.forEach(tile => curr[tile] = Math.max(curr[tile], 20))
					}

					if (all) {
						all = all.map((val: number, tile: number) => Math.min(val, curr[tile]))
					} else {
						all = curr
					}
				}
			})
			if (!all) return
			return {
				safetyRating: all
					.map((rate: number, tile: Tile) => { return { tile: tile, rate: rate / 100 } })
					.filter(e => e.rate != 0)
			}
		}
	}

	handle(type: string, action: any): Signal | void {
		console.log(action)
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