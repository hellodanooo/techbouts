// app/officials/[officialId]/page.tsx
import OfficialDetailsClient from './PageClient';

export default async function OfficialPage(props: { params: Promise<{ officialId: string }> }) {
  const { officialId } = await props.params;

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-6">Official Details</h1>
      <OfficialDetailsClient officialId={officialId} />
    </main>
  );
}