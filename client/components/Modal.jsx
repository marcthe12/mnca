import Hide from './Hide';

export default function({ children, show }) {
  return <Hide show={show}>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white text-black w-96 p-6 rounded-lg shadow-md">
        {children}
      </div>
    </div>
  </Hide>;
}
