// app/emails/[promotion]/EmailBlast.tsx
// EmailBlast.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase_techbouts/config';
import EmailEditor from './EmailEditor';
import EmailsTable from '@/components/tables/EmailTable';

interface EmailBlastProps {
  promotion: string;
}

interface FighterEmail {
  pmt_id: string;
  first: string;
  last: string;
  email: string;
}

interface EmailData {
  emails: FighterEmail[];
  totalEmails: number;
  lastUpdated: string;
}

const TEST_EMAILS = [
  'info@pointmuaythaica.com',
  'info@muaythaipurist.com',
  'dhodges0331@gmail.com',
  'logytime1@gmail.com'
];

interface EmailSourceConfig {
  name: string;
  email: string;
}

const EMAIL_SOURCE_MAPPING: Record<string, EmailSourceConfig> = {
  muaythaipurist: {
    name: "Muay Thai Purist",
    email: "info@muaythaipurist.com"
  },
  pmt: {
    name: "Point Muay Thai West",
    email: "info@pointmuaythaica.com"
  },
  ikf: {
    name: "Point Muay Thai West",
    email: "info@pointmuaythaica.com"
  }
};


export default function EmailBlast({ promotion }: EmailBlastProps) {
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2024');
  const [emailData, setEmailData] = useState<EmailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  // Lift these states up from EmailEditor
  const [subject, setSubject] = useState("Enter Header Here");
  const [buttonText, setButtonText] = useState("Enter Button Text Here");
  const [buttonUrl, setButtonUrl] = useState("https://your-website.com");
  const [renderedHtml, setRenderedHtml] = useState<string>("");

  const emailSource = EMAIL_SOURCE_MAPPING[promotion] || EMAIL_SOURCE_MAPPING.pmt;


  useEffect(() => {
    const fetchEmails = async () => {
      setLoading(true);
      setError(null);
      try {
        const emailsRef = doc(db, 'emails_pmt', selectedYear, 'emails_json', 'data');
        const emailsSnap = await getDoc(emailsRef);
        
        if (!emailsSnap.exists()) {
          throw new Error('No emails found for selected year');
        }
        
        const data = emailsSnap.data();
        setEmailData({
          emails: data.emails,
          totalEmails: data.emails.length,
          lastUpdated: new Date().toISOString()
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching email data');
        console.error('Error fetching emails:', err);
        setEmailData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, [selectedYear]);

 
  const sendEmails = async (emailsList: string[], isTest: boolean = false) => {
    if (!subject.trim() || !renderedHtml) { // Only check subject and renderedHtml
      setStatus('Please fill in all required fields.');
      return;
    }

    const campaignId = `${promotion}_${selectedYear}_${Date.now()}${isTest ? '_test' : ''}`;
    
    const batchSize = 50;
    for (let i = 0; i < emailsList.length; i += batchSize) {
      const batch = emailsList.slice(i, i + batchSize);
      
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: batch,
          subject: isTest ? `[TEST] ${subject}` : subject,
          message: renderedHtml, // Use the rendered HTML from EmailEditor
          buttonText,
          buttonUrl,
          campaignId,
          promotion,
          source: {
            name: emailSource.name,
            email: emailSource.email
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send emails');
      }

      setStatus(`Sent ${Math.min(i + batchSize, emailsList.length)} of ${emailsList.length} emails...`);
    }
  };

  const handleSendTestEmails = async () => {
    setLoading(true);
    setStatus('Sending test emails...');

    try {
      await sendEmails(TEST_EMAILS, true);
      setStatus('Test emails sent successfully!');
    } catch (error) {
      console.error('Error sending test emails:', error);
      setStatus('Error sending test emails. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmails = async () => {
    if (!emailData?.emails) {
      setStatus('No email data available. Please try again.');
      return;
    }

    setLoading(true);
    setStatus('Preparing to send emails...');

    try {
      const emailsList = emailData.emails.map(fighter => fighter.email);
      await sendEmails(emailsList);
      setStatus('Email blast completed successfully!');
    } catch (error) {
      console.error('Error sending emails:', error);
      setStatus('Error sending emails. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Send Email Blast to {promotion.toUpperCase()} Fighters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="year-select" className="block text-sm font-medium text-gray-700">
                Select Year
              </label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Email Message
              </label>
              <EmailEditor
                promotion={promotion}
                subject={subject}
           
                buttonText={buttonText}
                buttonUrl={buttonUrl}
                onSubjectChange={setSubject}
             
                onButtonTextChange={setButtonText}
                onButtonUrlChange={setButtonUrl}
                onRenderedHtmlChange={setRenderedHtml} // New prop to receive rendered HTML
              />
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={handleSendTestEmails} 
                disabled={loading}
                variant="outline"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Test Emails
              </Button>

              <Button 
                onClick={handleSendEmails} 
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Email Blast
              </Button>
            </div>

            {status && (
              <div className={`mt-4 p-4 rounded-md ${
                status.includes('Error') ? 'bg-red-50 text-red-500' : 'bg-muted'
              }`}>
                {status}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <EmailsTable 
        emailData={emailData}
        loading={loading}
        error={error}
        selectedYear={selectedYear}
      />
    </div>
  );
}