// app/database/[sanctioning]/emails/EmailBlast.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase_pmt/config';
import EmailEditor from './EmailEditor';


interface EmailBlastProps {
  sanctioning: string;
}

const TEST_EMAILS = [
  'info@pointmuaythaica.com',
  'info@muaythaipurist.com',
  'dhodges0331@gmail.com',
  'logytime1@gmail.com'
];

export default function EmailBlast({ sanctioning }: EmailBlastProps) {
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2024');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string>('');

  const handleMessageChange = (html: string) => {
    setMessage(html);
  };

  const sendEmails = async (emailsList: string[], isTest: boolean = false) => {
    const campaignId = `${sanctioning}_${selectedYear}_${Date.now()}${isTest ? '_test' : ''}`;
    
    // Send emails in batches of 50
    const batchSize = 50;
    for (let i = 0; i < emailsList.length; i += batchSize) {
      const batch = emailsList.slice(i, i + batchSize);
      
      const response = await fetch('/api/emails/emailblast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: batch,
          subject: isTest ? `[TEST] ${subject}` : subject,
          message,
          campaignId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send emails');
      }

      setStatus(`Sent ${Math.min(i + batchSize, emailsList.length)} of ${emailsList.length} emails...`);
    }
  };

  const handleSendTestEmails = async () => {
    if (!subject || !message) {
      setStatus('Please fill in both subject and message fields.');
      return;
    }

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
    if (!subject || !message) {
      setStatus('Please fill in both subject and message fields.');
      return;
    }

    setLoading(true);
    setStatus('Fetching email list...');

    try {
        const emailsRef = doc(db, `emails_${sanctioning}_${selectedYear}`, 'emails_json');
        const emailsSnap = await getDoc(emailsRef);
      
        if (!emailsSnap.exists()) {
          throw new Error('No emails found for selected year');
        }
      
        const emailData = emailsSnap.data();
        const emailsList = emailData.emails.map((fighter: { email: string }) => fighter.email);
      
        setStatus(`Sending emails to ${emailsList.length} recipients...`);
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
    <Card>
      <CardHeader>
        <CardTitle>Send Email Blast to {sanctioning.toUpperCase()} Fighters</CardTitle>
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
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
              Email Subject
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="Enter email subject"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Email Message
            </label>
             <EmailEditor
              value={message}
              onChange={handleMessageChange}
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
  );
}