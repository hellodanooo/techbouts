import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase_techbouts/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface EmailEngagement {
  emailClient: string;
  ipAddress: string;
  lastOpened: string;
  openCount: number;
  trackingType: string;
  userAgent: string;
}

interface EmailCampaign {
  id: string;
  subject: string;
  sentAt: string;
  totalSent: number;
  totalOpened: number;
  sentEmails: string[];
  openedEmails: string[];
  engagement: Record<string, EmailEngagement>;
  linkClicks: Record<string, number>;
  promotion: string;
  status: string;
  totalAttempted: number;
  totalFailed: number;
  failedEmails: Array<{ email: string; error: string }>;
  completedAt: string;
}

interface EmailStatsProps {
  promotion: string;
}

export default function EmailStats({ promotion }: EmailStatsProps) {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const toggleCampaignDetails = (campaignId: string) => {
    setExpandedCampaign(expandedCampaign === campaignId ? null : campaignId);
  };

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
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCampaignDetails(campaign.id)}
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-lg mb-2">{campaign.subject}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
    <p className="text-sm text-gray-500">Attempted</p>
    <p className="text-lg font-semibold">{campaign.totalAttempted}</p>
  </div>
  <div>
    <p className="text-sm text-gray-500">Sent Successfully</p>
    <p className="text-lg font-semibold text-green-600">
      {campaign.totalSent}
    </p>
  </div>
  <div>
    <p className="text-sm text-gray-500">Failed</p>
    <p className="text-lg font-semibold text-red-600">
      {campaign.totalFailed}
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
                      <div>
                        <p className="text-sm text-gray-500">Sent At</p>
                        <p className="text-sm">{formatDate(campaign.sentAt)}</p>
                      </div>
                    </div>
                  </div>
                  {expandedCampaign === campaign.id ? (
                    <ChevronUp className="h-6 w-6 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-6 w-6 text-gray-400" />
                  )}
                </div>

                {expandedCampaign === campaign.id && (
                  <div className="mt-4 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Detailed Engagement</h4>
                      <div className="space-y-4">
                        {Object.entries(campaign.engagement).map(([email, data]) => (
                          <div key={email} className="border-b border-gray-200 pb-2">
                            <p className="font-medium text-sm">{email}</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                              <div>
                                <p className="text-xs text-gray-500">Last Opened</p>
                                <p className="text-sm">{formatDate(data.lastOpened)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Open Count</p>
                                <p className="text-sm">{data.openCount}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Email Client</p>
                                <p className="text-sm">{data.emailClient}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Tracking Type</p>
                                <p className="text-sm">{data.trackingType}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-xs text-gray-500">User Agent</p>
                                <p className="text-sm truncate" title={data.userAgent}>
                                  {data.userAgent}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Sent Emails ({campaign.sentEmails.length})</h4>
                        <div className="space-y-1">
                          {campaign.sentEmails.map((email) => (
                            <p key={email} className="text-sm">
                              {email}
                            </p>
                          ))}
                        </div>
                        {campaign.failedEmails?.length > 0 && (
  <div className="bg-red-50 p-4 rounded-lg mt-4">
    <h4 className="font-medium mb-2 text-red-700">Failed Sends ({campaign.failedEmails.length})</h4>
    <div className="space-y-2">
      {campaign.failedEmails.map(({email, error}) => (
        <div key={email} className="text-sm">
          <span className="font-medium">{email}</span>: {error}
        </div>
      ))}
    </div>
  </div>
)}
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Opened Emails ({campaign.openedEmails.length})</h4>
                        <div className="space-y-1">
                          {campaign.openedEmails.map((email) => (
                            <p key={email} className="text-sm">
                              {email}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}