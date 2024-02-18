export default function JWTDecode(token) {
	const list = token.split(".");
	return {
		"header": JSON.parse(atob(list[0])),
		"body": JSON.parse(atob(list[1])),
		"signature": list[2]
	};

}
