export function JWTdecode(token) {
	const list = token.split(".");
	return {
		"header": JSON.parse(atob(list[0])),
		"body": JSON.parse(atob(list[1])),
		"signature": list[2]
	};

}

export function waitUntilMapValue(map, key) {
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
