'use client';
import { type group } from './IndexDBProvider';

export default function({ onClick, group }: { onClick: () => void; group: group; }): JSX.Element {
  return <p className='bold p-4' onClick={onClick}>{group.name}</p>;
}
