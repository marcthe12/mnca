
export async function blobToBase64(blob) {
	return new Promise((resolve, reject) => {
		console.log(blob)
		const reader = new FileReader()
		reader.addEventListener("loadend", () => resolve({data: reader.result, name: blob.name}))
		//reader.addEventListener("error",) reject but not too sure what to pput  here
		reader.readAsDataURL(blob)
	})
}

export async function Base64ToBlob(url){
	console.log(url)
	const res = await fetch(url.data)
	const blob = await res.blob()
	return new File([blob],url.name,{type: blob.type})
}