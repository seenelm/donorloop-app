// Brevo API Client for Email Analytics
// Documentation: https://developers.brevo.com/reference

// Environment variables for Brevo connection
const brevoApiKey = import.meta.env.VITE_BREVO_API_KEY;
const senderAddress = import.meta.env.VITE_SENDER_ADDRESS;
const emailSenderName = import.meta.env.VITE_EMAIL_SENDER_NAME;

// Base URL for Brevo API
const BREVO_BASE_URL = 'https://api.brevo.com/v3';

// Type definitions for Brevo API responses
export interface EmailCampaign {
  id: number;
  name: string;
  subject: string;
  type: string;
  status: string;
  scheduledAt?: string;
  sentDate?: string;
  tag?: string;
  recipients: number;
  statistics: {
    globalStats: {
      uniqueClicks: number;
      clickers: number;
      complaints: number;
      delivered: number;
      sent: number;
      softBounces: number;
      hardBounces: number;
      uniqueViews: number;
      trackableViews: number;
      unsubscriptions: number;
      viewed: number;
      deferred: number;
    };
  };
}

export interface EmailStatistics {
  range: string;
  requests: number;
  delivered: number;
  hardBounces: number;
  softBounces: number;
  clicks: number;
  uniqueClicks: number;
  opens: number;
  uniqueOpens: number;
  spamReports: number;
  blocked: number;
  invalid: number;
  unsubscribed: number;
}

export interface ContactList {
  id: number;
  name: string;
  totalBlacklisted: number;
  totalSubscribers: number;
  uniqueSubscribers: number;
  folderId: number;
  createdAt: string;
  campaignStats: {
    campaignsSent: number;
    openRate: number;
    clickRate: number;
  };
}

export interface TransactionalEmail {
  messageId: string;
  date: string;
  from: string;
  to: string[];
  subject: string;
  templateId?: number;
  status: string;
  opens?: number;
  clicks?: number;
}

export interface EmailCampaignsResponse {
  campaigns: EmailCampaign[];
  count: number;
}

// Error handling
export class BrevoAPIError extends Error {
  public status?: number;
  public code?: string;
  
  constructor(
    message: string,
    status?: number,
    code?: string
  ) {
    super(message);
    this.name = 'BrevoAPIError';
    this.status = status;
    this.code = code;
  }
}

// Generic API request function
async function brevoRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!brevoApiKey) {
    throw new BrevoAPIError('Brevo API key is not configured');
  }

  const url = `${BREVO_BASE_URL}${endpoint}`;
  
  console.log('Making Brevo API request:', {
    url,
    apiKeyPresent: !!brevoApiKey,
    apiKeyStart: brevoApiKey?.substring(0, 10) + '...',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': brevoApiKey?.substring(0, 10) + '...'
    }
  });

  const response = await fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': brevoApiKey,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Brevo API Error Details:', {
      url,
      status: response.status,
      statusText: response.statusText,
      errorData,
      fullErrorMessage: errorData.message,
      errorCode: errorData.code
    });
    throw new BrevoAPIError(
      errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData.code
    );
  }

  const data = await response.json();
  console.log('Brevo API Response:', { url, data });
  return data;
}

// API Functions

/**
 * Get email campaigns with optional filters
 */
export async function getEmailCampaigns(params: {
  type?: 'classic' | 'trigger';
  status?: 'draft' | 'sent' | 'archive' | 'queued' | 'suspended' | 'inProcess';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<EmailCampaignsResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.type) searchParams.append('type', params.type);
  if (params.status) searchParams.append('status', params.status);
  // Fix date format - Brevo expects YYYY-MM-DDTHH:mm:ss.sssZ format
  if (params.startDate) {
    const startDate = new Date(params.startDate);
    searchParams.append('startDate', startDate.toISOString());
  }
  if (params.endDate) {
    const endDate = new Date(params.endDate);
    searchParams.append('endDate', endDate.toISOString());
  }
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.offset) searchParams.append('offset', params.offset.toString());

  const endpoint = `/emailCampaigns${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  return brevoRequest<EmailCampaignsResponse>(endpoint);
}

/**
 * Get email campaign statistics for a date range
 * Note: This endpoint requires campaign IDs, so we'll get stats per campaign
 */
export async function getCampaignStatisticsRange(campaignIds: number[]): Promise<EmailStatistics[]> {
  // Get statistics for each campaign individually
  const statsPromises = campaignIds.map(async (id) => {
    try {
      const campaign = await brevoRequest<EmailCampaign>(`/emailCampaigns/${id}`);
      return {
        range: 'campaign',
        requests: campaign.statistics?.globalStats?.sent || 0,
        delivered: campaign.statistics?.globalStats?.delivered || 0,
        hardBounces: campaign.statistics?.globalStats?.hardBounces || 0,
        softBounces: campaign.statistics?.globalStats?.softBounces || 0,
        clicks: campaign.statistics?.globalStats?.uniqueClicks || 0,
        uniqueClicks: campaign.statistics?.globalStats?.uniqueClicks || 0,
        opens: campaign.statistics?.globalStats?.viewed || 0,
        uniqueOpens: campaign.statistics?.globalStats?.uniqueViews || 0,
        spamReports: campaign.statistics?.globalStats?.complaints || 0,
        blocked: 0,
        invalid: 0,
        unsubscribed: campaign.statistics?.globalStats?.unsubscriptions || 0,
      } as EmailStatistics;
    } catch (error) {
      console.warn(`Failed to get stats for campaign ${id}:`, error);
      return null;
    }
  });
  
  const results = await Promise.all(statsPromises);
  return results.filter((stat): stat is EmailStatistics => stat !== null);
}

/**
 * Get statistics for a specific campaign
 */
export async function getCampaignStatistics(campaignId: number): Promise<EmailCampaign['statistics']> {
  return brevoRequest<EmailCampaign['statistics']>(`/emailCampaigns/${campaignId}`);
}

/**
 * Get global email statistics
 */
export async function getEmailStatistics(params: {
  startDate?: string; // YYYY-MM-DD format
  endDate?: string;   // YYYY-MM-DD format
  days?: number;      // Last N days
  tag?: string;
} = {}): Promise<EmailStatistics[]> {
  const searchParams = new URLSearchParams();
  
  // Default to last 30 days if no date range provided
  if (!params.startDate && !params.endDate && !params.days) {
    params.days = 30;
  }
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString());
    }
  });

  const queryString = searchParams.toString();
  const endpoint = `/emailCampaigns/statistics${queryString ? `?${queryString}` : ''}`;
  
  return brevoRequest<EmailStatistics[]>(endpoint);
}

/**
 * Get contact lists
 */
export async function getContactLists(params: {
  limit?: number;
  offset?: number;
} = {}): Promise<{ lists: ContactList[]; count: number }> {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString());
    }
  });

  const queryString = searchParams.toString();
  const endpoint = `/contacts/lists${queryString ? `?${queryString}` : ''}`;
  
  return brevoRequest<{ lists: ContactList[]; count: number }>(endpoint);
}

/**
 * Get transactional email statistics
 * Note: SMTP statistics endpoint is not available in Brevo API v3
 * Returning default values for now
 */
export async function getTransactionalEmailStats(_params: {
  startDate?: string; // YYYY-MM-DD format
  endDate?: string;   // YYYY-MM-DD format
  days?: number;      // Last N days
  tag?: string;
} = {}): Promise<{
  requests: number;
  delivered: number;
  opens: number;
  clicks: number;
  bounces: number;
  blocked: number;
}> {
  // SMTP statistics endpoint doesn't exist in Brevo API v3
  // Return default values to prevent errors
  console.warn('SMTP statistics endpoint not available in Brevo API v3');
  return {
    requests: 0,
    delivered: 0,
    opens: 0,
    clicks: 0,
    bounces: 0,
    blocked: 0,
  };
}

/**
 * Get SMTP statistics events - ALL individual email events with maximum detail
 * This is the correct endpoint that returns every email event with complete information
 */
export async function getSMTPStatisticsEvents(params: {
  limit?: number;
  offset?: number;
  startDate?: string; // YYYY-MM-DD format
  endDate?: string;   // YYYY-MM-DD format
  days?: number;
  email?: string;
  event?: 'requests' | 'delivered' | 'hardBounces' | 'softBounces' | 'blocked' | 'spam' | 'opened' | 'clicked' | 'invalid' | 'deferred' | 'loadedByProxy';
  tags?: string;
  messageId?: string;
  templateId?: number;
  sort?: 'asc' | 'desc';
} = {}): Promise<{
  events: Array<{
    // Core email identification
    email: string;              // Recipient email address
    messageId: string;          // Unique message identifier
    subject: string;            // Email subject line
    from: string;               // Sender email address
    
    // Event details
    event: string;              // Event type (delivered, opened, clicked, etc.)
    date: string;               // Event timestamp (ISO format)
    
    // Technical details
    ip: string;                 // IP address of the event
    tag: string;                // Campaign/email tag
    templateId?: number;        // Template ID if used
    
    // Additional metadata that may be available
    reason?: string;            // Bounce/failure reason
    url?: string;               // Clicked URL (for click events)
    userAgent?: string;         // User agent (for open/click events)
    device?: string;            // Device type
    os?: string;                // Operating system
    browser?: string;           // Browser information
    location?: {                // Geographic location
      country?: string;
      region?: string;
      city?: string;
    };
    
    // Campaign information (if available)
    campaignId?: number;        // Associated campaign ID
    campaignName?: string;      // Campaign name
    
    // Template information (if available)
    templateName?: string;      // Template name
    
    // Delivery information
    smtpId?: string;           // SMTP transaction ID
    batchId?: string;          // Batch identifier
    
    // Engagement metrics
    openCount?: number;         // Number of opens (if tracked)
    clickCount?: number;        // Number of clicks (if tracked)
    
    // Additional technical data
    headers?: Record<string, string>; // Email headers
    size?: number;              // Email size in bytes
    
    // Tracking information
    trackingPixel?: boolean;    // Whether tracking pixel was loaded
    linkTracking?: boolean;     // Whether link tracking is enabled
  }>;
}> {
  const searchParams = new URLSearchParams();
  
  // Set default limit if not provided
  if (!params.limit) params.limit = 2500;
  if (!params.sort) params.sort = 'desc';
  
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.offset) searchParams.append('offset', params.offset.toString());
  if (params.startDate) searchParams.append('startDate', params.startDate);
  if (params.endDate) searchParams.append('endDate', params.endDate);
  if (params.days) searchParams.append('days', params.days.toString());
  if (params.email) searchParams.append('email', params.email);
  if (params.event) searchParams.append('event', params.event);
  if (params.tags) searchParams.append('tags', params.tags);
  if (params.messageId) searchParams.append('messageId', params.messageId);
  if (params.templateId) searchParams.append('templateId', params.templateId.toString());
  if (params.sort) searchParams.append('sort', params.sort);

  const endpoint = `/smtp/statistics/events${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  
  return brevoRequest<{
    events: Array<{
      email: string;
      date: string;
      subject: string;
      messageId: string;
      event: string;
      tag: string;
      ip: string;
      from: string;
      templateId?: number;
      reason?: string;
    }>;
  }>(endpoint);
}

/**
 * Get campaign recipients and their individual email status
 */
export async function getCampaignRecipients(campaignId: number, params: {
  limit?: number;
  offset?: number;
} = {}): Promise<{
  recipients: Array<{
    email: string;
    status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
    statusDate: string;
    openDate?: string;
    clickDate?: string;
  }>;
  count: number;
}> {
  const searchParams = new URLSearchParams();
  
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.offset) searchParams.append('offset', params.offset.toString());

  const endpoint = `/emailCampaigns/${campaignId}/recipients${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  
  try {
    return await brevoRequest<{
      recipients: Array<{
        email: string;
        status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
        statusDate: string;
        openDate?: string;
        clickDate?: string;
      }>;
      count: number;
    }>(endpoint);
  } catch (error) {
    console.warn(`Campaign recipients not available for campaign ${campaignId}:`, error);
    return {
      recipients: [],
      count: 0
    };
  }
}

/**
 * Get email templates
 */
export async function getEmailTemplates(params: {
  templateStatus?: 'true' | 'false';
  limit?: number;
  offset?: number;
} = {}): Promise<{
  templates: Array<{
    id: number;
    name: string;
    subject: string;
    isActive: boolean;
    testSent: boolean;
    sender: {
      name: string;
      email: string;
    };
    replyTo: string;
    toField: string;
    tag: string;
    htmlContent: string;
    createdAt: string;
    modifiedAt: string;
  }>;
  count: number;
}> {
  const searchParams = new URLSearchParams();
  
  if (params.templateStatus) searchParams.append('templateStatus', params.templateStatus);
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.offset) searchParams.append('offset', params.offset.toString());

  const endpoint = `/smtp/templates${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  
  try {
    return await brevoRequest<{
      templates: Array<{
        id: number;
        name: string;
        subject: string;
        isActive: boolean;
        testSent: boolean;
        sender: {
          name: string;
          email: string;
        };
        replyTo: string;
        toField: string;
        tag: string;
        htmlContent: string;
        createdAt: string;
        modifiedAt: string;
      }>;
      count: number;
    }>(endpoint);
  } catch (error) {
    console.warn('Email templates endpoint not available:', error);
    return {
      templates: [],
      count: 0
    };
  }
}

/**
 * Get account information
 */
export async function getAccountInfo(): Promise<{
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  plan: {
    type: string;
    creditsType: string;
    credits: number;
    creditsUsed: number;
  }[];
}> {
  return brevoRequest<{
    email: string;
    firstName: string;
    lastName: string;
    companyName: string;
    plan: {
      type: string;
      creditsType: string;
      credits: number;
      creditsUsed: number;
    }[];
  }>('/account');
}

// Utility functions
export function calculateOpenRate(opens: number, delivered: number): number {
  return delivered > 0 ? (opens / delivered) * 100 : 0;
}

export function calculateClickRate(clicks: number, delivered: number): number {
  return delivered > 0 ? (clicks / delivered) * 100 : 0;
}

export function calculateBounceRate(bounces: number, sent: number): number {
  return sent > 0 ? (bounces / sent) * 100 : 0;
}

export function calculateDeliveryRate(delivered: number, sent: number): number {
  return sent > 0 ? (delivered / sent) * 100 : 0;
}

// ============================================================================
// TRANSACTIONAL EMAIL SENDING
// ============================================================================

export interface TransactionalEmailRequest {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: number;
  params?: Record<string, any>;
  sender?: { email: string; name?: string };
  replyTo?: { email: string; name?: string };
  tags?: string[];
}

export interface TransactionalEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send transactional email via Brevo
 */
export async function sendTransactionalEmail(request: TransactionalEmailRequest): Promise<TransactionalEmailResponse> {
  try {
    console.log('Sending transactional email via Brevo...');
    console.log('Recipients:', request.to.map(r => r.email).join(', '));
    console.log('Subject:', request.subject);
    
    const payload: any = {
      to: request.to,
      sender: request.sender || {
        email: senderAddress,
        name: emailSenderName
      }
    };
    
    // Add subject if not using template
    if (!request.templateId) {
      payload.subject = request.subject;
    }
    
    // Add content
    if (request.htmlContent) {
      payload.htmlContent = request.htmlContent;
    }
    if (request.textContent) {
      payload.textContent = request.textContent;
    }
    
    // Add template and params if using template
    if (request.templateId) {
      payload.templateId = request.templateId;
      if (request.params) {
        payload.params = request.params;
      }
    }
    
    // Add optional fields
    if (request.replyTo) {
      payload.replyTo = request.replyTo;
    }
    if (request.tags) {
      payload.tags = request.tags;
    }
    
    const response = await brevoRequest<{ messageId: string }>('/smtp/email', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    console.log('✅ Email sent successfully. Message ID:', response.messageId);
    
    return {
      success: true,
      messageId: response.messageId
    };
    
  } catch (error) {
    console.error('Error sending transactional email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test API connection with a simple account call
 */
export async function testBrevoConnection(): Promise<{ success: boolean; error?: string; details?: any }> {
  try {
    console.log('Testing Brevo connection with API key:', brevoApiKey?.substring(0, 15) + '...');
    
    // Try the most basic endpoint first
    const response = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'api-key': brevoApiKey || '',
      },
    });
    
    console.log('Raw response status:', response.status);
    console.log('Raw response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Account data:', data);
      return { success: true };
    } else {
      const errorText = await response.text();
      console.log('Error response body:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      return { 
        success: false, 
        error: errorData.message || `HTTP ${response.status}`,
        details: errorData
      };
    }
  } catch (error) {
    console.error('Network error:', error);
    return { 
      success: false, 
      error: 'Network error: ' + (error as Error).message
    };
  }
}

/**
 * Get maximum detailed information about a specific email message
 * This analyzes all events for a message to provide comprehensive details
 */
export async function getEmailMaximumDetails(messageId: string): Promise<{
  messageDetails: {
    // Basic information
    messageId: string;
    subject: string;
    from: string;
    recipients: string[];
    
    // All events for this message
    events: Array<{
      event: string;
      date: string;
      email: string;
      ip: string;
      userAgent?: string;
      url?: string;
      reason?: string;
    }>;
    
    // Template information (if available)
    templateId?: number;
    
    // Delivery statistics
    totalRecipients: number;
    deliveredCount: number;
    openedCount: number;
    clickedCount: number;
    bouncedCount: number;
    
    // Timeline of events
    timeline: Array<{
      timestamp: string;
      event: string;
      recipient: string;
      details: string;
    }>;
    
    // Performance metrics
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  };
}> {
  try {
    // Get all events for this specific message
    const eventsResponse = await getSMTPStatisticsEvents({
      messageId,
      limit: 1000, // Get all events for this message
      sort: 'asc'   // Chronological order
    });
    
    const events = eventsResponse.events;
    
    if (events.length === 0) {
      throw new Error('No events found for this message ID');
    }
    
    // Extract basic information from first event
    const firstEvent = events[0];
    const recipients = [...new Set(events.map(e => e.email))];
    
    // Analyze events
    const deliveredCount = events.filter(e => e.event === 'delivered').length;
    const openedCount = events.filter(e => e.event === 'opened').length;
    const clickedCount = events.filter(e => e.event === 'clicked').length;
    const bouncedCount = events.filter(e => e.event.includes('Bounce')).length;
    
    // Create timeline
    const timeline = events.map(event => ({
      timestamp: event.date,
      event: event.event,
      recipient: event.email,
      details: event.url || event.reason || `${event.event} event`
    }));
    
    // Calculate rates
    const totalRecipients = recipients.length;
    const deliveryRate = totalRecipients > 0 ? (deliveredCount / totalRecipients) * 100 : 0;
    const openRate = deliveredCount > 0 ? (openedCount / deliveredCount) * 100 : 0;
    const clickRate = deliveredCount > 0 ? (clickedCount / deliveredCount) * 100 : 0;
    const bounceRate = totalRecipients > 0 ? (bouncedCount / totalRecipients) * 100 : 0;
    
    return {
      messageDetails: {
        messageId: firstEvent.messageId,
        subject: firstEvent.subject,
        from: firstEvent.from,
        recipients,
        events,
        templateId: firstEvent.templateId,
        totalRecipients,
        deliveredCount,
        openedCount,
        clickedCount,
        bouncedCount,
        timeline,
        deliveryRate,
        openRate,
        clickRate,
        bounceRate
      }
    };
  } catch (error) {
    console.error('Error getting email maximum details:', error);
    throw error;
  }
}

// Export configuration values (without exposing the actual keys)
export const brevoConfig = {
  isConfigured: !!brevoApiKey,
  senderAddress,
  emailSenderName,
};
