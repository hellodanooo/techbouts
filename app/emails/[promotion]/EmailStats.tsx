import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase_techbouts/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface EmailCampaign {
  id: string;
  subject: string;
  sentAt: string;
  totalSent: number;
  totalOpened: number;

}

interface EmailStatsProps {
  promotion: string;
}

export default function EmailStats({ promotion }: EmailStatsProps) {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const campaignsRef = collection(db, 'email_campaigns', promotion, 'campaigns');
    const campaignsQuery = query(
      campaignsRef,
      orderBy('sentAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(
      campaignsQuery,
      (snapshot) => {
        const campaignData: EmailCampaign[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as EmailCampaign;
        
            campaignData.push(data);
        
        });
        setCampaigns(campaignData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching campaigns:', err);
        setError('Failed to load campaign stats.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [promotion]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Email Campaigns</CardTitle>
      </CardHeader>
      <CardContent>
        {campaigns.length === 0 ? (
          <p className="text-gray-500">No campaigns sent yet.</p>
        ) : (
          <div className="space-y-6">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="border-b pb-4 last:border-b-0">
                <h3 className="font-medium text-lg mb-2">{campaign.subject}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Sent</p>
                    <p className="text-lg font-semibold">{campaign.totalSent}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Opened</p>
                    <p className="text-lg font-semibold text-green-600">
                      {campaign.totalOpened}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Open Rate</p>
                    <p className="text-lg font-semibold">
                      {campaign.totalSent > 0
                        ? ((campaign.totalOpened / campaign.totalSent) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Sent on {new Date(campaign.sentAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}