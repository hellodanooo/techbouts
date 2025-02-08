// app/database/[sanctioning]/emails/EmailsPageClient.tsx
'use client';
import ExportEmailsClient from './ExportEmails';
import EmailsTable from '@/components/tables/EmailTable';
import EmailBlast from './EmailBlast';

interface EmailsPageClientProps {
    sanctioning: string;
}

export default function EmailsPageClient({ sanctioning }: EmailsPageClientProps) {

    return (
        <div className="container mx-auto py-6 space-y-6">
            <ExportEmailsClient sanctioning={sanctioning} />
            <EmailBlast sanctioning={sanctioning} />
            <EmailsTable />
        </div>
    );
}