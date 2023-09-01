import { SessionProvider } from "next-auth/react"
import MainArea from "./MainArea";
import { IndexDBProvider } from "./IndexDBProvider";

export default function () {
    return <SessionProvider>
        <IndexDBProvider>
            <MainArea />
        </IndexDBProvider>
    </SessionProvider>
}

