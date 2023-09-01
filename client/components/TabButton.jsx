export default function({ onClick, group }) {
  return <p className='bold p-4' onClick={onClick}>{group.name}</p>;
}
