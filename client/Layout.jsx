import Header from "./components/Header.jsx";
import { UserContext } from "./components/UserProvider.jsx";

export default function Layout({ children }) {

	return <UserContext>
		<div className="h-screen w-screen grid grid-rows-[auto,1fr] overflow-hidden">
			<div className="bg-primary-bg">
				<Header />
			</div>
			<div className="flex h-full grid-rows-2 overflow-y-auto">
				{children}
			</div>
		</div>
	</UserContext >;

}
