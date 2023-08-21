'use client';
export default function({ children, show }: { children: any; show: boolean; }) {
  return show ? children : (<></>);
}
