import { supabase } from './supabaseClient';

export interface ProfileData {
  user_id?: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  address?: {
    street_1?: string;
    street_2?: string;
    house_number?: string;
    zip?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  tax_id?: string;
  phone?: string;
  bank_details?: {
    bank_name?: string;
    account_number?: string;
    iban?: string;
    bic?: string;
  };
  settings?: {
    default_vat?: number;
    default_currency?: string;
    default_language?: string;
    customer_prefix?: string;
    inv_prefix?: string;
    inv_start_number?: number;
    inv_footer_text?: string;
    email_signature?: string;
    color_theme?: string;
  };
}

export const supabaseProfileService = {
  /**
   * Get user profile data from Supabase
   * @returns User profile data
   */
  getProfile: async (): Promise<ProfileData> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Error getting authenticated user:', authError);
        throw authError;
      }
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        throw userError;
      }
      
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine for new users
        console.error('Error fetching user settings:', settingsError);
        throw settingsError;
      }
      
      const profileData: ProfileData = {
        user_id: user.id,
        company_name: userData?.company_name || '',
        first_name: userData?.first_name || '',
        last_name: userData?.last_name || '',
        email: userData?.email || user.email || '',
        address: {
          street_1: userData?.street_1 || '',
          street_2: userData?.street_2 || '',
          house_number: userData?.house_number || '',
          zip: userData?.zip || '',
          city: userData?.city || '',
          state: userData?.state || '',
          country: userData?.country || '',
        },
        tax_id: userData?.tax_id || '',
        phone: userData?.phone || '',
        bank_details: {
          bank_name: userData?.bank_name || '',
          account_number: userData?.account_number || '',
          iban: userData?.iban || '',
          bic: userData?.bic || '',
        },
        settings: settingsData ? {
          default_vat: settingsData.default_vat || 0.19, // Default German VAT
          default_currency: settingsData.default_currency || 'EUR',
          default_language: settingsData.default_language || 'de',
          customer_prefix: settingsData.customer_prefix || 'CUST',
          inv_prefix: settingsData.inv_prefix || 'INV',
          inv_start_number: settingsData.inv_start_number || 1000,
          inv_footer_text: settingsData.inv_footer_text || '',
          email_signature: settingsData.email_signature || '',
          color_theme: settingsData.color_theme || 'light',
        } : undefined
      };
      
      return profileData;
    } catch (error) {
      console.error('Error in getProfile:', error);
      throw error;
    }
  },
  
  /**
   * Update user profile data in Supabase
   * @param profileData Updated profile data
   * @returns Success message
   */
  updateProfile: async (profileData: ProfileData): Promise<{ success: boolean, message: string }> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Error getting authenticated user:', authError);
        throw authError;
      }
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          company_name: profileData.company_name,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          street_1: profileData.address?.street_1,
          street_2: profileData.address?.street_2,
          house_number: profileData.address?.house_number,
          zip: profileData.address?.zip,
          city: profileData.address?.city,
          state: profileData.address?.state,
          country: profileData.address?.country,
          tax_id: profileData.tax_id,
          phone: profileData.phone,
          bank_name: profileData.bank_details?.bank_name,
          account_number: profileData.bank_details?.account_number,
          iban: profileData.bank_details?.iban,
          bic: profileData.bank_details?.bic,
        })
        .eq('id', user.id);
      
      if (userUpdateError) {
        console.error('Error updating user data:', userUpdateError);
        throw userUpdateError;
      }
      
      if (profileData.settings) {
        const { data: existingSettings, error: checkError } = await supabase
          .from('user_settings')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error checking user settings:', checkError);
          throw checkError;
        }
        
        const settings = {
          user_id: user.id,
          default_vat: profileData.settings.default_vat,
          default_currency: profileData.settings.default_currency,
          default_language: profileData.settings.default_language,
          customer_prefix: profileData.settings.customer_prefix,
          inv_prefix: profileData.settings.inv_prefix,
          inv_start_number: profileData.settings.inv_start_number,
          inv_footer_text: profileData.settings.inv_footer_text,
          email_signature: profileData.settings.email_signature,
          color_theme: profileData.settings.color_theme,
        };
        
        if (existingSettings) {
          const { error: settingsUpdateError } = await supabase
            .from('user_settings')
            .update(settings)
            .eq('user_id', user.id);
          
          if (settingsUpdateError) {
            console.error('Error updating user settings:', settingsUpdateError);
            throw settingsUpdateError;
          }
        } else {
          const { error: settingsInsertError } = await supabase
            .from('user_settings')
            .insert(settings);
          
          if (settingsInsertError) {
            console.error('Error inserting user settings:', settingsInsertError);
            throw settingsInsertError;
          }
        }
      }
      
      return { success: true, message: 'Profil erfolgreich aktualisiert.' };
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  },
  
  /**
   * Export user data (GDPR)
   * @returns User data export as JSON
   */
  exportUserData: async (): Promise<Record<string, unknown>> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Error getting authenticated user:', authError);
        throw authError;
      }
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        throw userError;
      }
      
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Error fetching user settings:', settingsError);
        throw settingsError;
      }
      
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*, invoice_items(*)')
        .eq('user_id', user.id);
      
      if (invoicesError) {
        console.error('Error fetching user invoices:', invoicesError);
        throw invoicesError;
      }
      
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id);
      
      if (customersError) {
        console.error('Error fetching user customers:', customersError);
        throw customersError;
      }
      
      const exportData = {
        user: userData,
        settings: settingsData || {},
        invoices: invoicesData || [],
        customers: customersData || [],
        exported_at: new Date().toISOString(),
      };
      
      return exportData;
    } catch (error) {
      console.error('Error in exportUserData:', error);
      throw error;
    }
  },
  
  /**
   * Delete user account (GDPR)
   * @returns Success message
   */
  deleteAccount: async (): Promise<{ success: boolean, message: string }> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Error getting authenticated user:', authError);
        throw authError;
      }
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      
      const { error: settingsError } = await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', user.id);
      
      if (settingsError) {
        console.error('Error deleting user settings:', settingsError);
        throw settingsError;
      }
      
      const { error: invoicesError } = await supabase
        .from('invoices')
        .delete()
        .eq('user_id', user.id);
      
      if (invoicesError) {
        console.error('Error deleting user invoices:', invoicesError);
        throw invoicesError;
      }
      
      const { error: customersError } = await supabase
        .from('customers')
        .delete()
        .eq('user_id', user.id);
      
      if (customersError) {
        console.error('Error deleting user customers:', customersError);
        throw customersError;
      }
      
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);
      
      if (userError) {
        console.error('Error deleting user record:', userError);
        throw userError;
      }
      
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (authDeleteError) {
        console.error('Error deleting auth user:', authDeleteError);
        throw authDeleteError;
      }
      
      return { success: true, message: 'Konto erfolgreich gelöscht.' };
    } catch (error) {
      console.error('Error in deleteAccount:', error);
      throw error;
    }
  }
};
