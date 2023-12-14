
export async function blobToBase64(blob) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.addEventListener("loadend", () => resolve(reader.result))
		//reader.addEventListener("error",) reject but not too sure what to pput  here
		reader.readAsDataURL(blob)
	})
}

export async function Base64ToBlob(url){
	const res = await fetch(url)
	return await res.blob()
}