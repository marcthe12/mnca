/**
 * Export a function that creates and returns an asynchronous function to perform HTTP POST requests.
 * @param {string} url - The URL to which the POST request will be sent.
 * @param {string|null} authToken - Optional. The authorization token to be included in the request headers.
 * @returns {Function} An asynchronous function that sends POST requests to the specified URL.
 */
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
