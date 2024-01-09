export default function TabButton ({onClick, group}) {
	return <p className=" shadow cursor-pointer bold p-4" onClick={onClick}>{group.name}</p>
}
