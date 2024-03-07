export default function waitUntilMapValue(map, key) {
	return new Promise((resolve) => {
		const checkValue = () => {
			if (map.has(key)) {
				resolve(map.get(key));
			} else {
				setTimeout(checkValue, 100);
			}
		};

		checkValue();
	});
}
