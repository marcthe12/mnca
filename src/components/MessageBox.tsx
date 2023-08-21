import type { message } from "./IndexDBProvider";

export default function({ message }: { message: message }): JSX.Element {
  const {name, message: msg,date} = message;
  return <section className="bg-sky-500 m-5 w-1/2 p-4">
    <h3>{name}</h3>
    <p>{msg}</p>
    <small><time>{date.toUTCString()}</time></small>
  </section>;
}
