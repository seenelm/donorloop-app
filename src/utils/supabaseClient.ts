import { createClient, type User, AuthError } from '@supabase/supabase-js';

// Environment variables for Supabase connection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a single instance of the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth related functions
export type AuthResponse = {
  user: User | null;
  error: AuthError | null;
};

export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    // For OAuth, we don't get a user object immediately
    // The user will be redirected to Google and then back to the callback URL
    return { 
      user: null, // OAuth flow doesn't return a user immediately
      error 
    };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    return { 
      user: null, 
      error: error as AuthError 
    };
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { 
      user: data?.user || null, 
      error 
    };
  } catch (error) {
    console.error('Error signing in with email:', error);
    return { 
      user: null, 
      error: error as AuthError 
    };
  }
}

export async function signUp(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    return { 
      user: data?.user || null, 
      error 
    };
  } catch (error) {
    console.error('Error signing up:', error);
    return { 
      user: null, 
      error: error as AuthError 
    };
  }
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    console.error('Error signing out:', error);
    return { 
      error: error as AuthError 
    };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function getSession() {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

// Function to add an authorized email to the allowed_emails table
export async function addAuthorizedEmail(email: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('allowed_emails')
      .insert([{ email }]);
    
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error adding authorized email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Function to check if an email is authorized
export async function isEmailAuthorized(email: string): Promise<{ authorized: boolean; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('allowed_emails')
      .select()
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is expected if not found
      throw error;
    }
    
    return { authorized: !!data, error: null };
  } catch (error) {
    console.error('Error checking if email is authorized:', error);
    return {
      authorized: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Function to list all authorized emails
export async function listAuthorizedEmails(): Promise<{ 
  data: { id: number; email: string; created_at: string }[] | null; 
  error: string | null 
}> {
  try {
    const { data, error } = await supabase
      .from('allowed_emails')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error listing authorized emails:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Function to remove an authorized email
export async function removeAuthorizedEmail(id: number): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('allowed_emails')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error removing authorized email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Donor data interface
export interface DonorData {
  donorid: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  tp_guid?: string;
  created_at?: string;
}

// Gift data interface
export interface GiftData {
  giftid: string;
  donorid: string;
  totalamount: number;
  isrecurring: boolean;
  giftdate?: string;
  paymentmethod?: string;
  created_at?: string;
  giftsource?: string;
  iszakat?: boolean;
  campaign?: string;
  receiptnumber?: string;
  receiptpdf?: string;
  donor?: string;
}

// Engagement data interface
export interface EngagementData {
  id: number;
  created_at: string;
  email_id: string;
  donorid: string;
}

/**
 * Verify database connection and table existence
 */
export async function initializeDatabase(): Promise<{ success: boolean; error: string | null }> {
  try {
    // Check if gifts table exists
    const { error } = await supabase
      .from('gifts')
      .select('giftid')
      .limit(1);
    
    if (error) {
      console.error('Database initialization error:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('Database initialized successfully');
    return { success: true, error: null };
  } catch (error) {
    console.error('Database initialization exception:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Fetch all donors from the database
 */
export async function fetchDonors(): Promise<{
  data: DonorData[] | null;
  error: string | null;
}> {
  try {
    console.log('Fetching donors...');
    
    // Simple query to get all donors
    const { data, error } = await supabase
      .from('donors')
      .select();
    
    if (error) throw error;
    
    console.log(`Found ${data?.length || 0} donors`);
    return { data: data as DonorData[], error: null };
  } catch (error) {
    console.error('Error fetching donors:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetch all gifts from the database
 */
export async function fetchGifts (): Promise<{
  data: GiftData[] | null;
  error: string | null;
}> {
  try {
    console.log('Fetching gifts...');
    
    // Query to get all gifts with donor information
    const { data, error } = await supabase
      .from('gifts')
      .select(`
        *,
        donors:donorid (
          firstname,
          lastname
        )
      `)
      .order('giftdate', { ascending: false });
    
    if (error) throw error;
    
    // Process the data to add the donor field
    const processedData = data?.map(gift => {
      const donorInfo = gift.donors as { firstname: string; lastname: string } | null;
      return {
        ...gift,
        donor: donorInfo ? `${donorInfo.firstname} ${donorInfo.lastname}`.trim() : '',
        donors: undefined // Remove the nested donors object
      };
    });
    
    console.log(`Found ${processedData?.length || 0} gifts`);
    return { data: processedData as GiftData[], error: null };
  } catch (error) {
    console.error('Error fetching gifts:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetch a single donor by ID
 */
export async function fetchDonorById(id: string): Promise<{
  data: DonorData | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('donors')
      .select()
      .eq('donorid', id)
      .single();
    
    if (error) throw error;
    
    return { data: data as DonorData, error: null };
  } catch (error) {
    console.error(`Error fetching donor ${id}:`, error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetch gifts for a specific donor
 */
export async function fetchGiftsByDonorId(donorId: string): Promise<{
  data: GiftData[] | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('gifts')
      .select()
      .eq('donorid', donorId);
    
    if (error) throw error;
    
    return { data: data as GiftData[], error: null };
  } catch (error) {
    console.error(`Error fetching gifts for donor ${donorId}:`, error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// EMAIL ENGAGEMENT TRACKING FUNCTIONS
// ============================================================================

/**
 * Find donor by email address
 */
export async function findDonorByEmail(email: string): Promise<{
  data: DonorData | null;
  error: string | null;
}> {
  try {
    console.log(`Looking up donor by email: ${email}`);
    
    const { data, error } = await supabase
      .from('donors')
      .select()
      .eq('email', email.toLowerCase())
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }
    
    if (!data) {
      console.log(`No donor found for email: ${email}`);
      return { data: null, error: null };
    }
    
    console.log(`Found donor: ${data.firstname} ${data.lastname} (${data.donorid})`);
    return { data: data as DonorData, error: null };
  } catch (error) {
    console.error(`Error finding donor by email ${email}:`, error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create engagement record when email is sent (with duplicate prevention)
 */
export async function createEngagementRecord(emailId: string, donorId: string): Promise<{
  data: EngagementData | null;
  error: string | null;
}> {
  try {
    console.log(`Creating engagement record: emailId=${emailId}, donorId=${donorId}`);
    
    // First check if this email_id already exists (prevent duplicates)
    const existingCheck = await findEngagementByEmailId(emailId);
    if (existingCheck.data) {
      console.log(`Engagement record already exists for email: ${emailId}`);
      return { data: existingCheck.data, error: null };
    }
    
    const { data, error } = await supabase
      .from('engagement')
      .insert([{
        email_id: emailId,
        donorid: donorId
      }])
      .select()
      .single();
    
    if (error) {
      // Handle potential race condition where record was created between check and insert
      if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
        console.log(`Duplicate engagement record detected for email: ${emailId}, fetching existing record`);
        const existingRecord = await findEngagementByEmailId(emailId);
        return { data: existingRecord.data, error: null };
      }
      throw error;
    }
    
    console.log(`Engagement record created with ID: ${data.id}`);
    return { data: data as EngagementData, error: null };
  } catch (error) {
    console.error(`Error creating engagement record:`, error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetch all engagement records (with automatic sync like fetchGifts)
 */
export async function fetchEngagementRecords(): Promise<{
  data: (EngagementData & { donor?: DonorData })[] | null;
  error: string | null;
}> {
  try {
    console.log('Fetching engagement records...');
    
    // Note: Engagement records are fetched directly from database
    // Future enhancement: Could trigger sync here if needed
    
    const { data, error } = await supabase
      .from('engagement')
      .select(`
        *,
        donors:donorid (
          donorid,
          firstname,
          lastname,
          email
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Process the data to include donor information
    const processedData = data?.map(engagement => ({
      ...engagement,
      donor: engagement.donors as DonorData,
      donors: undefined // Remove the nested donors object
    }));
    
    console.log(`Found ${processedData?.length || 0} engagement records`);
    return { data: processedData as (EngagementData & { donor?: DonorData })[], error: null };
  } catch (error) {
    console.error('Error fetching engagement records:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetch engagement records for a specific donor
 */
export async function fetchEngagementByDonorId(donorId: string): Promise<{
  data: EngagementData[] | null;
  error: string | null;
}> {
  try {
    console.log(`Fetching engagement records for donor: ${donorId}`);
    
    const { data, error } = await supabase
      .from('engagement')
      .select()
      .eq('donorid', donorId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    console.log(`Found ${data?.length || 0} engagement records for donor ${donorId}`);
    return { data: data as EngagementData[], error: null };
  } catch (error) {
    console.error(`Error fetching engagement for donor ${donorId}:`, error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if engagement record exists for email ID
 */
export async function findEngagementByEmailId(emailId: string): Promise<{
  data: EngagementData | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('engagement')
      .select()
      .eq('email_id', emailId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }
    
    return { data: data as EngagementData | null, error: null };
  } catch (error) {
    console.error(`Error finding engagement by email ID ${emailId}:`, error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Verify engagement table setup and check for duplicates
 */
export async function verifyEngagementTableSetup(): Promise<{
  success: boolean;
  hasDuplicates: boolean;
  totalRecords: number;
  uniqueEmails: number;
  message: string;
}> {
  try {
    console.log('Verifying engagement table setup...');
    
    // Get all engagement records
    const { data: allRecords, error } = await supabase
      .from('engagement')
      .select('email_id');
    
    if (error) {
      throw error;
    }
    
    const totalRecords = allRecords?.length || 0;
    const uniqueEmails = new Set(allRecords?.map(r => r.email_id) || []).size;
    const hasDuplicates = totalRecords !== uniqueEmails;
    
    let message = `Engagement table: ${totalRecords} total records, ${uniqueEmails} unique emails`;
    
    if (hasDuplicates) {
      message += ` (${totalRecords - uniqueEmails} duplicates found - consider adding unique constraint)`;
    } else {
      message += ' (no duplicates detected)';
    }
    
    console.log(message);
    
    return {
      success: true,
      hasDuplicates,
      totalRecords,
      uniqueEmails,
      message
    };
    
  } catch (error) {
    console.error('Error verifying engagement table setup:', error);
    return {
      success: false,
      hasDuplicates: false,
      totalRecords: 0,
      uniqueEmails: 0,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
