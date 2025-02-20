// app/emails/[promotion]/PageContent.tsx
'use client';
import ExportEmailsClient from './ExportEmails';
import EmailBlast from './EmailBlast';
import { useAuth } from '@/context/AuthContext';
import AuthDisplay from '@/components/ui/AuthDisplay';

interface EmailsPageClientProps {
    promotion: string;
}

export default function EmailsPageClient({ promotion }: EmailsPageClientProps) {
    const { user, isAdmin, isNewUser } = useAuth();

    return (
        <div className="container mx-auto py-6 space-y-6">
            <ExportEmailsClient promotion={promotion} />
            <EmailBlast promotion={promotion} />
     
            <AuthDisplay 
        user={user}
        isAdmin={isAdmin}
        isNewUser={isNewUser}
      />
      
              </div>
    );
}