import Image from 'next/image'

export function Header() {
  return (
    <header className="bg-gray-800">
      <div className="logo-container">
        <Image width={50} height={50} src="/images/clogo.svg" alt="Chat Logo"/>
      </div>
      <h1 className="text-sky-500 dark:text-sky-400">MNCA</h1>
    </header>
  );
}
