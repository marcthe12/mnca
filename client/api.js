export default function (url, authToken = null) {
	return async function (data = {}) {
		try {
			const headers = {
				"Content-Type": "application/json"
			};

			if (authToken) {
				headers.Authorization = `Bearer ${authToken}`;
			}

			const response = await fetch(
				url,
				{
					"method": "POST",
					headers,
					"body": JSON.stringify(data)
				}
			);

			const responseData = await response.json();
			return responseData;
		} catch (error) {

			console.error(
				"Error:",
				error
			);
			throw error;
		}
	};
}
