import icon from "../assets/icon.svg"

export default function Header () {

	return (
		<header className="bg-header-bg">
			<div className="logo-container">
				<img width={50} height={50} src={icon} alt="Chat Logo"/>
			</div>
			<h1 className="dark:text-header-text">MNCA</h1>
		</header>
	)

}
