'use client'

import { signIn } from "next-auth/react"

export default function LogoutPage() {
    return <>
        <button onClick={() => signIn()}>Sign In</button>
    </>
}
