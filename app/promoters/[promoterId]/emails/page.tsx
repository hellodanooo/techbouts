// app/database/[sanctioning]/emails/page.tsx
import EmailsPageClient from './PageContent';

type Props = {
  params: Promise<{ sanctioning: string }>;
};

export default async function ExportEmailsPage({ params }: Props) {
  const { sanctioning } = await params;

  if (!['pmt', 'ikf'].includes(sanctioning.toLowerCase())) {
    return <div>Invalid sanctioning body specified</div>;
  }

  return (

    <>
      <EmailsPageClient sanctioning={sanctioning.toLowerCase()} />;
    </>

  )




}