import { Control, Signal } from "./control";
import { lit2tile, Tile, tile2lit, TileLiteral } from "./majsoul/def";
import { MPSZ } from "./majsoul/witch";

declare let view: any
declare let uiscript: any
declare let Laya: any

class Majya {
	private readonly control = new Control()

	constructor() {
		this.inject()
	}

	inject() {
		if (typeof view !== "undefined" && view.DesktopMgr.Inst) {
			console.log("Majya injected.");
			for (const key in view.DesktopMgr.Inst.actionMap) {
				const action = view.DesktopMgr.Inst.actionMap[key];
				const m = action.method;
				action.method = (e: any) => {
					setTimeout(() => this.dispatch(e.msg), 500);
					return m(e);
				};
			}
		} else setTimeout(() => {
			// console.log("Majya waiting...");
			this.inject();
		}, 1000);
	}

	dispatch(action: any) {
		const actionType = Object.getPrototypeOf(action).$type.name
		let seg = this.handToString().match(/.{1,2}/g)
		this.control.hand = seg ? seg.map(lit2tile) : []
		let sig = this.control.handle(actionType, action)

		if (sig) {
			// console.log(sig)
			let signal = <Signal>sig
			if (signal.light) {
				for (let idx in signal.light) {
					const color = [
						new Laya.Vector4(1, 0.7, 0.7, 1),
						new Laya.Vector4(0.6, 1, 0.6, 1),
						new Laya.Vector4(0.75, 1, 0.75, 1),
						new Laya.Vector4(0.88, 1, 0.88, 1),
						new Laya.Vector4(0.95, 1, 0.95, 1),
					][idx]
					for (let tile of signal.light[idx]) {
						this.getFromHand(tile).forEach(tile => {
							tile._SetColor(color);
							setTimeout(() => tile._SetColor(color), 750);
						})
					}
				}
			}
		}
	}

	handToString() {
		const handIn = view.DesktopMgr.Inst.mainrole.hand;
		let strOut = "";
		for (const tileInGameIn of handIn) {
			strOut += tileInGameIn.val.toString();
		}
		// console.log(strOut)
		// return tenhou.MPSZ.contract(strOut);
		return strOut
	}

	getFromHand(lit: TileLiteral) {
		const mainrole = view.DesktopMgr.Inst.mainrole
		const handIn = mainrole.hand
		const result = []
		handIn.forEach(tile => tile.val.toString() == lit ? result.push(tile) : null)
		if (lit.substr(0, 1) == "5") lit = lit.replace("5", "0")
		handIn.forEach(tile => tile.val.toString() == lit ? result.push(tile) : null)
		return result
	}
}

window["majya"] = new Majya()
