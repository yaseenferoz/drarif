import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <p className="eyebrow">DR. ARIF RAZA</p>
      <h1>That page could not be found.</h1>
      <p>Let’s get you back to specialist digestive care.</p>
      <Link className="button button-primary" href="/">Back to home</Link>
    </main>
  );
}
