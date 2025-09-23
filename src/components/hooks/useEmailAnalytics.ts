import { useState, useEffect, useCallback } from 'react';
import {
  getEmailCampaigns,
  getCampaignStatisticsRange,
  getContactLists,
  getTransactionalEmailStats,
  getSMTPStatisticsEvents,
  getCampaignRecipients,
  getEmailTemplates,
  getEmailMaximumDetails,
  getAccountInfo,
  calculateOpenRate,
  calculateClickRate,
  calculateBounceRate,
  calculateDeliveryRate,
  type EmailCampaign,
  type EmailStatistics,
  type ContactList,
  BrevoAPIError,
} from '../../utils/brevoClient';

// Processed analytics data types
export interface IndividualEmail {
  messageId: string;
  date: string;
  from: string;
  to: string[];
  subject: string;
  templateId?: number;
  status: string;
  event?: string;
  reason?: string;
  campaignId?: number;
  campaignName?: string;
  type: 'campaign' | 'transactional';
}

interface CampaignRecipient {
  email: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
  statusDate: string;
  openDate?: string;
  clickDate?: string;
  campaignId: number;
  campaignName: string;
}

export interface EmailAnalyticsData {
  // Overview metrics
  totalCampaigns: number;
  totalEmailsSent: number;
  totalDelivered: number;
  totalOpens: number;
  totalClicks: number;
  totalBounces: number;
  totalUnsubscribes: number;
  
  // Calculated rates
  overallOpenRate: number;
  overallClickRate: number;
  overallBounceRate: number;
  overallDeliveryRate: number;
  
  // Recent performance (last 30 days)
  recentCampaigns: EmailCampaign[];
  recentStats: EmailStatistics[];
  
  // Contact lists
  contactLists: ContactList[];
  totalSubscribers: number;
  
  // Transactional emails
  transactionalStats: {
    requests: number;
    delivered: number;
    opens: number;
    clicks: number;
    bounces: number;
    blocked: number;
  };
  
  // Account info
  accountInfo: {
    email: string;
    companyName: string;
    plan: string;
    creditsRemaining: number;
    creditsUsed: number;
  } | null;
  
  // Time series data for charts
  campaignPerformanceOverTime: {
    date: string;
    sent: number;
    delivered: number;
    opens: number;
    clicks: number;
    bounces: number;
  }[];
  
  // Top performing campaigns
  topCampaignsByOpens: EmailCampaign[];
  topCampaignsByClicks: EmailCampaign[];
  
  // Individual email tracking
  individualEmails: IndividualEmail[];
  campaignRecipients: CampaignRecipient[];
  totalIndividualEmails: number;
  emailTemplates: any[];
}

export interface UseEmailAnalyticsReturn {
  data: EmailAnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  isConfigured: boolean;
  getEmailDetails: (messageId: string) => Promise<any>;
}

// Date utility functions
function getDateRange(days: number) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

// Utility function for date formatting (currently unused but may be needed for future features)
// function formatDateForAPI(date: Date): string {
//   return date.toISOString().split('T')[0];
// }

export function useEmailAnalytics(): UseEmailAnalyticsReturn {
  const [data, setData] = useState<EmailAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if Brevo is configured
  const isConfigured = import.meta.env.VITE_BREVO_API_KEY ? true : false;

  const fetchEmailAnalytics = useCallback(async () => {
    if (!isConfigured) {
      setError('Brevo API is not configured. Please add your API key to environment variables.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get date ranges
      const last30Days = getDateRange(30);

      // Fetch campaigns first - try different statuses to see what exists
      console.log('Fetching campaigns with different statuses...');
      
      // Try fetching all campaigns regardless of status
      const allCampaignsResponse = await getEmailCampaigns({
        limit: 100,
      });
      
      console.log('All campaigns response:', allCampaignsResponse);
      
      // Also try fetching sent campaigns specifically
      const sentCampaignsResponse = await getEmailCampaigns({
        status: 'sent',
        limit: 100,
      });
      
      console.log('Sent campaigns response:', sentCampaignsResponse);
      
      // Use whichever has more campaigns
      const campaignsResponse = allCampaignsResponse.campaigns.length > 0 ? allCampaignsResponse : sentCampaignsResponse;
      
      const campaigns = campaignsResponse.campaigns || [];

      // Get campaign statistics for each campaign
      const campaignIds = campaigns.map((c: any) => c.id);
      const recentStats = campaignIds.length > 0 ? await getCampaignStatisticsRange(campaignIds) : [];

      // Fetch other data in parallel
      const [
        contactListsResponse,
        transactionalStatsResponse,
        accountInfoResponse,
        transactionalEmailsResponse,
        emailTemplatesResponse,
      ] = await Promise.allSettled([
        getContactLists({ limit: 50 }),
        getTransactionalEmailStats({
          startDate: last30Days.startDate,
          endDate: last30Days.endDate,
        }),
        getAccountInfo(),
        getSMTPStatisticsEvents({
          days: 30,
          limit: 2500,
          sort: 'desc',
        }),
        getEmailTemplates({ limit: 50 }),
      ]);

      // Fetch campaign recipients for each campaign (detailed individual email data)
      const campaignRecipientsPromises = campaigns.slice(0, 5).map(async (campaign: any) => {
        try {
          const recipients = await getCampaignRecipients(campaign.id, { limit: 100 });
          return recipients.recipients.map((recipient: any) => ({
            ...recipient,
            campaignId: campaign.id,
            campaignName: campaign.name,
          }));
        } catch (error) {
          console.warn(`Failed to get recipients for campaign ${campaign.id}:`, error);
          return [];
        }
      });

      const allCampaignRecipients = await Promise.all(campaignRecipientsPromises);
      const flatCampaignRecipients = allCampaignRecipients.flat();

      // Process results
      const contactLists = contactListsResponse.status === 'fulfilled' ? contactListsResponse.value.lists : [];
      const transactionalStats = transactionalStatsResponse.status === 'fulfilled' ? transactionalStatsResponse.value : {
        requests: 0,
        delivered: 0,
        opens: 0,
        clicks: 0,
        bounces: 0,
        blocked: 0,
      };
      const accountInfo = accountInfoResponse.status === 'fulfilled' ? accountInfoResponse.value : null;
      const smtpEvents = transactionalEmailsResponse.status === 'fulfilled' ? 
        (transactionalEmailsResponse.value?.events || []) : [];
      const emailTemplates = emailTemplatesResponse.status === 'fulfilled' ? 
        (emailTemplatesResponse.value?.templates || []) : [];

      // Process individual emails data from SMTP events
      const individualEmails: IndividualEmail[] = [
        // Add SMTP events (all individual email events)
        ...smtpEvents.map((event: any) => ({
          messageId: event.messageId,
          date: event.date,
          from: event.from,
          to: [event.email], // SMTP events have individual recipient emails
          subject: event.subject,
          templateId: event.templateId,
          status: event.event, // The event type is the status
          event: event.event,
          reason: event.reason,
          type: 'transactional' as const,
        })),
        // Add campaign emails (from recipients data)
        ...flatCampaignRecipients.map((recipient: any) => ({
          messageId: `campaign-${recipient.campaignId}-${recipient.email}`,
          date: recipient.statusDate,
          from: accountInfo?.email || 'Unknown',
          to: [recipient.email],
          subject: `Campaign: ${recipient.campaignName}`,
          status: recipient.status,
          campaignId: recipient.campaignId,
          campaignName: recipient.campaignName,
          type: 'campaign' as const,
        })),
      ];

      // Calculate overview metrics
      const totalEmailsSent = campaigns.reduce((sum, campaign) => sum + (campaign.statistics?.globalStats?.sent || 0), 0);
      const totalDelivered = campaigns.reduce((sum, campaign) => sum + (campaign.statistics?.globalStats?.delivered || 0), 0);
      const totalOpens = campaigns.reduce((sum, campaign) => sum + (campaign.statistics?.globalStats?.viewed || 0), 0);
      const totalClicks = campaigns.reduce((sum, campaign) => sum + (campaign.statistics?.globalStats?.uniqueClicks || 0), 0);
      const totalBounces = campaigns.reduce((sum, campaign) => 
        sum + (campaign.statistics?.globalStats?.hardBounces || 0) + (campaign.statistics?.globalStats?.softBounces || 0), 0);
      const totalUnsubscribes = campaigns.reduce((sum, campaign) => sum + (campaign.statistics?.globalStats?.unsubscriptions || 0), 0);

      // Calculate rates
      const overallOpenRate = calculateOpenRate(totalOpens, totalDelivered);
      const overallClickRate = calculateClickRate(totalClicks, totalDelivered);
      const overallBounceRate = calculateBounceRate(totalBounces, totalEmailsSent);
      const overallDeliveryRate = calculateDeliveryRate(totalDelivered, totalEmailsSent);

      // Get recent campaigns (last 30 days)
      const recentCampaigns = campaigns.filter(campaign => {
        if (!campaign.sentDate) return false;
        const sentDate = new Date(campaign.sentDate);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return sentDate >= thirtyDaysAgo;
      });

      // Calculate total subscribers
      const totalSubscribers = contactLists.reduce((sum, list) => sum + list.totalSubscribers, 0);

      // Process account info
      const processedAccountInfo = accountInfo ? {
        email: accountInfo.email,
        companyName: accountInfo.companyName,
        plan: accountInfo.plan[0]?.type || 'Unknown',
        creditsRemaining: accountInfo.plan[0]?.credits - accountInfo.plan[0]?.creditsUsed || 0,
        creditsUsed: accountInfo.plan[0]?.creditsUsed || 0,
      } : null;

      // Create time series data for charts
      const campaignPerformanceOverTime = campaigns
        .filter(campaign => campaign.sentDate)
        .sort((a, b) => new Date(a.sentDate!).getTime() - new Date(b.sentDate!).getTime())
        .map(campaign => ({
          date: campaign.sentDate!,
          sent: campaign.statistics?.globalStats?.sent || 0,
          delivered: campaign.statistics?.globalStats?.delivered || 0,
          opens: campaign.statistics?.globalStats?.viewed || 0,
          clicks: campaign.statistics?.globalStats?.uniqueClicks || 0,
          bounces: (campaign.statistics?.globalStats?.hardBounces || 0) + (campaign.statistics?.globalStats?.softBounces || 0),
        }));

      // Get top performing campaigns
      const topCampaignsByOpens = [...campaigns]
        .sort((a, b) => (b.statistics?.globalStats?.viewed || 0) - (a.statistics?.globalStats?.viewed || 0))
        .slice(0, 10);

      const topCampaignsByClicks = [...campaigns]
        .sort((a, b) => (b.statistics?.globalStats?.uniqueClicks || 0) - (a.statistics?.globalStats?.uniqueClicks || 0))
        .slice(0, 10);

      // Enhanced Debug logging for data accuracy
      console.log('=== EMAIL ANALYTICS DETAILED DEBUG ===');
      console.log('Campaigns fetched:', campaigns.length);
      console.log('All campaigns:', campaigns);
      console.log('Sample campaign structure:', campaigns[0]);
      if (campaigns[0]?.statistics) {
        console.log('Sample campaign statistics:', campaigns[0].statistics);
        console.log('Global stats breakdown:', campaigns[0].statistics.globalStats);
      }
      console.log('Recent stats:', recentStats);
      console.log('Contact lists:', contactLists.length);
      console.log('Contact lists details:', contactLists);
      console.log('Transactional stats:', transactionalStats);
      console.log('Account info:', accountInfo);
      console.log('Individual emails fetched:', individualEmails.length);
      console.log('Campaign recipients fetched:', flatCampaignRecipients.length);
      console.log('Email templates:', emailTemplates?.length || 0);
      console.log('Email templates response:', emailTemplatesResponse);
      console.log('Transactional emails response:', transactionalEmailsResponse);
      console.log('Calculated totals:', {
        totalEmailsSent,
        totalDelivered,
        totalOpens,
        totalClicks,
        totalBounces,
        totalUnsubscribes
      });
      
      // Verify data accuracy by cross-checking
      console.log('=== DATA ACCURACY VERIFICATION ===');
      campaigns.forEach((campaign, index) => {
        console.log(`Campaign ${index + 1}: "${campaign.name}"`);
        console.log(`  - Status: ${campaign.status}`);
        console.log(`  - Sent: ${campaign.statistics?.globalStats?.sent || 0}`);
        console.log(`  - Delivered: ${campaign.statistics?.globalStats?.delivered || 0}`);
        console.log(`  - Opens: ${campaign.statistics?.globalStats?.viewed || 0}`);
        console.log(`  - Clicks: ${campaign.statistics?.globalStats?.uniqueClicks || 0}`);
        console.log(`  - Sent Date: ${campaign.sentDate || 'Not available'}`);
      });
      
      // Individual emails breakdown
      console.log('=== INDIVIDUAL EMAILS BREAKDOWN ===');
      console.log('SMTP events (individual emails):', smtpEvents.length);
      console.log('Campaign recipient emails:', flatCampaignRecipients.length);
      console.log('Total individual emails tracked:', individualEmails.length);
      
      if (smtpEvents.length > 0) {
        console.log('Sample SMTP events:', smtpEvents.slice(0, 3));
        console.log('SMTP events structure:', smtpEvents[0]);
      }
      
      if (individualEmails.length > 0) {
        console.log('Sample processed individual emails:', individualEmails.slice(0, 3));
      }
      
      if (flatCampaignRecipients.length > 0) {
        console.log('Sample campaign recipients:', flatCampaignRecipients.slice(0, 3));
      }

      // Debug SMTP events response structure
      console.log('=== SMTP EVENTS RESPONSE DEBUG ===');
      console.log('transactionalEmailsResponse status:', transactionalEmailsResponse.status);
      if (transactionalEmailsResponse.status === 'fulfilled') {
        console.log('SMTP events response data:', transactionalEmailsResponse.value);
        console.log('Events array:', transactionalEmailsResponse.value?.events);
        console.log('Events count:', transactionalEmailsResponse.value?.events?.length || 0);
      } else {
        console.log('SMTP events response error:', transactionalEmailsResponse.reason);
      }

      // Compile final data
      const analyticsData: EmailAnalyticsData = {
        totalCampaigns: campaigns.length,
        totalEmailsSent,
        totalDelivered,
        totalOpens,
        totalClicks,
        totalBounces,
        totalUnsubscribes,
        overallOpenRate,
        overallClickRate,
        overallBounceRate,
        overallDeliveryRate,
        recentCampaigns,
        recentStats,
        contactLists,
        totalSubscribers,
        transactionalStats,
        accountInfo: processedAccountInfo,
        campaignPerformanceOverTime,
        topCampaignsByOpens,
        topCampaignsByClicks,
        // New individual email data
        individualEmails,
        campaignRecipients: flatCampaignRecipients,
        totalIndividualEmails: individualEmails.length,
        emailTemplates,
      };

      console.log('Final analytics data:', analyticsData);
      setData(analyticsData);
      setError(null);

    } catch (err) {
      console.error('Error fetching email analytics:', err);
      
      if (err instanceof BrevoAPIError) {
        setError(`Brevo API Error: ${err.message}`);
      } else {
        setError('Failed to fetch email analytics data. Please check your API configuration.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured]);

  // Initial data fetch
  useEffect(() => {
    fetchEmailAnalytics();
  }, [fetchEmailAnalytics]);

  // Function to get detailed analytics for a specific email ID
  const getEmailDetails = useCallback(async (messageId: string) => {
    try {
      console.log('Fetching detailed analytics for email ID:', messageId);
      const details = await getEmailMaximumDetails(messageId);
      console.log('Email details fetched:', details);
      return details;
    } catch (error) {
      console.error('Error fetching email details:', error);
      throw error;
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    refreshData: fetchEmailAnalytics,
    isConfigured,
    getEmailDetails,
  };
}
