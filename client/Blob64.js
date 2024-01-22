
export async function blobToBase64(blob) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.addEventListener("loadend", () => resolve({data: reader.result, name: blob.name}))
		reader.addEventListener("error", (event) => reject(event.target.error))
		reader.readAsDataURL(blob)
	})
}

export async function Base64ToBlob(url){
	url.data = new URL(url.data)
	if(url.data.protocol !== "data:"){
		throw new Error("Not a data URL")
	}
	const res = await fetch(url.data)
	const blob = await res.blob()
	return new File([blob],url.name,{type: blob.type})
}
