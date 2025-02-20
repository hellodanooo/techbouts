// app/emails/[promotion]/page.tsx
import EmailsPageClient from './PageContent';

type Props = {
  params: Promise<{ promotion: string }>;
};

export default async function ExportEmailsPage({ params }: Props) {
  const { promotion } = await params;

  if (!['pmt', 'ikf', 'muaythaipurist'].includes(promotion.toLowerCase())) {
    return <div>Invalid sanctioning body specified</div>;
  }

  return (

    <>
      <EmailsPageClient promotion={promotion.toLowerCase()} />;
    </>

  )




}