class GCounter {
	constructor(iterable) {
		this.counters = new Map(iterable);
	}
	increment(replica) {
		this.counters.set(replica, (this.counters.get(replica) ?? 0) + 1);
	}
	get count() {
		return [...this.counters.values()].reduce((sum, count) => sum + count, 0);
	}
	get state() {
		return [...this.counters.entries()];
	}
	merge(otherCounter) {
		otherCounter.counters.forEach((count, replica) => {
			this.counters.set(replica, Math.max(this.counters.get(replica) ?? 0, count));
		});
	}
}
export default class VectorClock extends GCounter {
	compare(otherClock) {
		const allKeys = new Set([...this.counters.keys(), ...otherClock.counters.keys()]);
		return [...allKeys].reduce((prev, replica) => {
			const va = this.counters.get(replica) ?? 0;
			const vb = otherClock.counters.get(replica) ?? 0;

			switch (prev) {
				case "equal":
					return va > vb ? "greater" : va < vb ? "less" : prev;
				case "less":
					return va > vb ? "concurrent" : prev;
				case "greater":
					return va < vb ? "concurrent" : prev;
				default:
					return prev;
			}
		}, "equal");
	}
	delta(otherClock) {
		const counter = new GCounter();
		const allKeys = new Set([...this.counters.keys(), ...otherClock.counters.keys()]);
		allKeys.forEach(key => {
			const value1 = this.counters.get(key) ?? 0;
			const value2 = otherClock.counters.get(key) ?? 0;
			counter.counters.set(key, value1 - value2);
		});
		return counter;
	}
	clone() {
		const ret = new VectorClock();
		ret.merge(this);
		return ret;
	}
}
