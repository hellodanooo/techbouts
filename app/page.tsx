import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="grid grid-rows-[auto_20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {/* Top Header */}
      <header className="w-full flex justify-between items-center bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 shadow-md">
        <h1 className="text-lg sm:text-2xl font-semibold">
          <Link href="/" className="hover:underline">
            Next.js Example
          </Link>
        </h1>
        <nav className="flex gap-6">
          <Link
            href="/organizations"
            className="text-sm sm:text-base hover:underline text-blue-500 dark:text-blue-400"
          >
            Organizations
          </Link>
          <Link
            href="/database"
            className="text-sm sm:text-base hover:underline text-blue-500 dark:text-blue-400"
          >
            Database
          </Link>
          <Link
            href="/create"
            className="text-sm sm:text-base hover:underline text-blue-500 dark:text-blue-400"
          >
            Create
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex flex-col gap-16 row-start-3 items-center sm:items-start">
        {/* Next.js Logo Section */}
        <div className="flex flex-col gap-8 items-center sm:items-start">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={180}
            height={38}
            priority
          />
          <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
            <li className="mb-2">
              Get started by editing{" "}
              <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
                app/page.tsx
              </code>
              .
            </li>
            <li>Save and see your changes instantly.</li>
          </ol>
        </div>

        {/* Upcoming Events Section */}
        <section className="w-full">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Upcoming Events</h2>
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded shadow-md">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              No events available at the moment. Stay tuned!
            </p>
          </div>
        </section>

        {/* Latest Results Section */}
        <section className="w-full">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Latest Results</h2>
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded shadow-md">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              No results available at the moment. Stay tuned!
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="row-start-4 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
