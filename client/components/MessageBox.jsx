export default function({ message }) {
  const {name, message: msg,date} = message;
  return <section className="bg-secondary-bg text-secondary-text m-5 w-1/2 p-4">
    <h3>{name}</h3>
    <p>{msg}</p>
    <small><time>{date.toUTCString()}</time></small>
  </section>;
}
