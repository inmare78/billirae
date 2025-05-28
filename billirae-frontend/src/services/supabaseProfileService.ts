import { supabase } from './supabaseClient';
import { parseSupabaseError } from '../utils/supabaseErrorHandler';

export interface UserProfile {
  id?: string;
  user_id?: string;
  
  first_name: string;
  last_name: string;
  
  company_name: string;
  tax_id: string;
  website_url: string;
  
  street_1: string;
  street_2: string;
  house_number: string;
  zip: string;
  city: string;
  state: string;
  country: string;
  country_code: string;
  
  email: string;
  phone: string;
  
  bank_name: string;
  bank_iban: string;
  bank_bic: string;
  
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get the current user's profile from Supabase
 * @returns User profile data
 */
export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting current user:', userError);
      throw userError;
    }
    
    if (!user) {
      throw new Error('Nicht authentifiziert. Bitte melden Sie sich an.');
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
    
    if (!data) {
      return {
        user_id: user.id,
        first_name: '',
        last_name: '',
        company_name: '',
        tax_id: '',
        website_url: '',
        street_1: '',
        street_2: '',
        house_number: '',
        zip: '',
        city: '',
        state: '',
        country: '',
        country_code: '',
        email: user.email || '',
        phone: '',
        bank_name: '',
        bank_iban: '',
        bank_bic: '',
      };
    }
    
    return data as UserProfile;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    throw error;
  }
};

/**
 * Update the current user's profile in Supabase
 * @param profileData Updated profile data
 * @returns Updated user profile
 */
export const updateUserProfile = async (profileData: UserProfile): Promise<UserProfile> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting current user:', userError);
      throw userError;
    }
    
    if (!user) {
      throw new Error('Nicht authentifiziert. Bitte melden Sie sich an.');
    }
    
    const { data: existingProfile, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking if profile exists:', checkError);
      throw checkError;
    }
    
    const updatedProfile = {
      ...profileData,
      user_id: user.id,
      updated_at: new Date().toISOString()
    };
    
    let result;
    
    if (existingProfile) {
      const { data, error } = await supabase
        .from('users')
        .update(updatedProfile)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }
      
      result = data;
    } else {
      const { data, error } = await supabase
        .from('users')
        .insert({
          ...updatedProfile,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating user profile:', error);
        throw error;
      }
      
      result = data;
    }
    
    return result as UserProfile;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw error;
  }
};

/**
 * Delete the current user's account and all associated data
 * @returns Success message
 */
export const deleteUserAccount = async (): Promise<{ success: boolean, message: string }> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting current user:', userError);
      throw userError;
    }
    
    if (!user) {
      throw new Error('Nicht authentifiziert. Bitte melden Sie sich an.');
    }
    
    const { error: deleteProfileError } = await supabase
      .from('users')
      .delete()
      .eq('user_id', user.id);
    
    if (deleteProfileError) {
      console.error('Error deleting user profile:', deleteProfileError);
      throw deleteProfileError;
    }
    
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);
    
    if (deleteUserError) {
      console.error('Error deleting user account:', deleteUserError);
      throw deleteUserError;
    }
    
    return {
      success: true,
      message: 'Konto erfolgreich gelöscht.'
    };
  } catch (error) {
    console.error('Error in deleteUserAccount:', error);
    throw error;
  }
};

/**
 * Export the current user's data (GDPR)
 * @returns User data export
 */
export const exportUserData = async (): Promise<any> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting current user:', userError);
      throw userError;
    }
    
    if (!user) {
      throw new Error('Nicht authentifiziert. Bitte melden Sie sich an.');
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile for export:', profileError);
      throw profileError;
    }
    
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('user_id', user.id);
    
    if (invoicesError) {
      console.error('Error fetching user invoices for export:', invoicesError);
      throw invoicesError;
    }
    
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id);
    
    if (customersError) {
      console.error('Error fetching user customers for export:', customersError);
      throw customersError;
    }
    
    const userData = {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile,
      invoices,
      customers
    };
    
    return userData;
  } catch (error) {
    console.error('Error in exportUserData:', error);
    throw error;
  }
};
