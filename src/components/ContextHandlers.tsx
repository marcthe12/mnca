"use client";

import { SessionProvider } from "next-auth/react"
import UserMenu from "./UserMenu";
import { IndexDBProvider } from "./IndexDBProvider";

export default function () {
    return <SessionProvider>
        <IndexDBProvider>
            <UserMenu />
        </IndexDBProvider>
    </SessionProvider>
}

