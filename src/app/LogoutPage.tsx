'use client'
import { Header } from '@/components/Header'
import { signIn } from "next-auth/react"

export default function LogoutPage() {
    return <>
        <Header></Header>
        <button onClick={() => signIn()}>Sign In</button>
    </>
}
