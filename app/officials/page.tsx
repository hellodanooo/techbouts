import PageClient from './PageClient'


// By default, server components in Next.js 13+ do not allow fetch caching.
// If you want fresh data on every request, use { cache: 'no-store' } or
// { next: { revalidate: 0 } }:
export default async function OfficialsPage() {
 
  

  return (
    <main className="p-4">
    <h1 className="text-2xl font-bold mb-6">All Officials</h1>
    <PageClient />
  </main>
  )
}
