type Tile = number
type TileLiteral = string

function lit2tile(literal: TileLiteral) {
	literal = literal.replace("0", "5")
	return Number.parseInt(literal[0]) - 1 + { m: 0, p: 1, s: 2, z: 3 }[literal[1]] * 9
}

function tile2lit(tile: number) {
	return (tile % 9 + 1) + ["m", "p", "s", "z"][tile / 9 | 0]
}

interface OptionalOperationList {
	operation_list: any[]
	seat: number,
	time_add: number,
	time_fixed: number
}

interface ActionNewRound {
	al: boolean,
	ben: number,
	chang: number,
	dora: TileLiteral,
	ju: number,
	left_tile_count: number,
	liqibang: number,
	md5: string,
	scores: number[],
	tiles: TileLiteral[]
}

interface ActionDiscardTile {
	is_liqi: boolean,
	is_wliqi: boolean,
	moqie: boolean,
	seat: number,
	tile: TileLiteral,
	zhenting: boolean
}

interface ActionDealTile {
	doras?: TileLiteral[],		// 杠完 doras为所有dora指示牌
	left_tile_count: number,
	seat: number,
	zhenting: boolean,
	tile?: TileLiteral,
	operation?: OptionalOperationList
}

interface ActionChiPengGang {
	froms: number[],
	seat: number,
	tiles: TileLiteral[],
	type: number,
	zhenting: boolean,
	operation?: OptionalOperationList
}

interface ActionAnGangAddGang {
	seat: number,
	tiles: TileLiteral,
	type: number,
	operation?: OptionalOperationList
}

declare type MajsoulAction = ActionNewRound |
	ActionDiscardTile | ActionDealTile | ActionChiPengGang |
	ActionAnGangAddGang

export {
	MajsoulAction,
	ActionChiPengGang,
	ActionDealTile,
	ActionDiscardTile,
	ActionNewRound,
	ActionAnGangAddGang,
	OptionalOperationList,
	TileLiteral,
	Tile,
	lit2tile,
	tile2lit
}