// app/database/calculate/page.tsx
import PageContent from './PageContent';

type Props = {
  params: Promise<{ sanctioning: string }>;
};

export default async function CalculateRecordsPage({ params }: Props) {
  const { sanctioning } = await params;

  if (!['pmt', 'ikf'].includes(sanctioning.toLowerCase())) {
    return <div>Invalid sanctioning body specified</div>;
  }

  return <PageContent sanctioning={sanctioning.toLowerCase()} />;
}
