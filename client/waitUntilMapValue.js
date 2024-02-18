export default function waitUntilMapValue(map, key) {
	return new Promise((resolve) => {
		const checkValue = () => {
			if (map.get(key) !== undefined) {
				resolve(map.get(key));
			} else {
				setTimeout(checkValue, 100);
			}
		};

		checkValue();
	});
}
