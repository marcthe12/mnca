export default function isDefined(value) {
	return !(new Set([null, undefined]).has(value));
}
