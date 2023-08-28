'use client'
import React from 'react';
import { Header } from '../components/Header'
import { signIn } from "next-auth/react"
import { Link } from 'next/link';
import RegistrationPage from '../app/RegistrationPage';
export default function LogoutPage() {
    return <>
        <Header></Header>
        <button onClick={() => signIn()}>Sign In</button>
        <Link href="/app/RegistrationPage">Register</Link>
    </>
}
