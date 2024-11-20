import { randomString } from './GameHelpers.js';

class UniqueIdManager {
	constructor(length) {
		this.idLength = length;
		this.ids = new Set();
	}

	getNew() {
		let newId;
		do {
			newId = randomString(this.idLength).toUpperCase();
		} while (this.ids.has(newId));
		this.ids.add(newId);
		return newId;
	}

	remove(id) {
		this.ids.delete(id);
	}
}

export default UniqueIdManager;
