import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-4xl text-zinc-50">Not Found</h1>
      <p className="mt-2 text-zinc-400">The page you requested does not exist.</p>
      <Link href="/" className="mt-4 inline-block text-orange-400 hover:text-orange-300">
        Go home
      </Link>
    </div>
  );
}
