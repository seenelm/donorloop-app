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

/**
 * Save email engagement record
 */
export async function saveEmailEngagement(email_id: string, donorid: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const { error } = await supabase
      .from('engagement')
      .insert([
        { 
          email_id, 
          donorid,
          // created_at will be automatically set by Supabase
        }
      ]);
    
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error saving email engagement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetch engagement records by donor email
 */
export async function fetchEngagementByDonorEmail(email: string): Promise<{
  data: EngagementData[] | null;
  error: string | null;
}> {
  try {
    // First find the donor by email
    const { data: donorData, error: donorError } = await supabase
      .from('donors')
      .select('donorid')
      .eq('email', email)
      .single();
    
    if (donorError || !donorData) {
      return { data: [], error: null }; // Return empty array if donor not found
    }
    
    // Then fetch engagement records for this donor
    const { data, error } = await supabase
      .from('engagement')
      .select(`
        *,
        donor:donors!engagement_donorid_fkey(*)
      `)
      .eq('donorid', donorData.donorid)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching engagement by donor email:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetch all engagement records with donor information
 */
export async function fetchEngagementRecords(): Promise<{
  data: EngagementData[] | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('engagement')
      .select(`
        *,
        donor:donors!engagement_donorid_fkey(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching engagement records:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
