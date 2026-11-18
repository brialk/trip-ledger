import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="narrow center">
      <h1>Page not found</h1>
      <p><Link to="/trips">Back to my trips</Link></p>
    </main>
  );
}
