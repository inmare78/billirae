import { supabase } from './supabaseClient';

export interface ProfileData {
  company_name: string;
  address: string;
  tax_id: string;
  email: string;
  phone: string;
  bank_name: string;
  bank_account: string;
  bank_iban: string;
  bank_bic: string;
  logo_url?: string;
}

export const supabaseProfileService = {
  /**
   * Get user profile data from Supabase
   * @returns User profile data
   */
  getProfile: async (): Promise<ProfileData> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Nicht authentifiziert. Bitte melden Sie sich an.');
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      if (!data) {
        return {
          company_name: '',
          address: '',
          tax_id: '',
          email: user.email || '',
          phone: '',
          bank_name: '',
          bank_account: '',
          bank_iban: '',
          bank_bic: '',
        };
      }
      
      return {
        company_name: data.company_name || '',
        address: data.address || '',
        tax_id: data.tax_id || '',
        email: data.email || user.email || '',
        phone: data.phone || '',
        bank_name: data.bank_name || '',
        bank_account: data.bank_account || '',
        bank_iban: data.bank_iban || '',
        bank_bic: data.bank_bic || '',
        logo_url: data.logo_url,
      };
    } catch (error) {
      console.error('Error in getProfile:', error);
      throw error;
    }
  },
  
  /**
   * Update user profile data in Supabase
   * @param profileData Updated profile data
   * @returns Updated profile data
   */
  updateProfile: async (profileData: ProfileData): Promise<ProfileData> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Nicht authentifiziert. Bitte melden Sie sich an.');
      }
      
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking profile existence:', checkError);
        throw checkError;
      }
      
      let result;
      
      if (existingProfile) {
        const { data, error } = await supabase
          .from('profiles')
          .update({
            company_name: profileData.company_name,
            address: profileData.address,
            tax_id: profileData.tax_id,
            email: profileData.email,
            phone: profileData.phone,
            bank_name: profileData.bank_name,
            bank_account: profileData.bank_account,
            bank_iban: profileData.bank_iban,
            bank_bic: profileData.bank_bic,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating profile:', error);
          throw error;
        }
        
        result = data;
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            company_name: profileData.company_name,
            address: profileData.address,
            tax_id: profileData.tax_id,
            email: profileData.email,
            phone: profileData.phone,
            bank_name: profileData.bank_name,
            bank_account: profileData.bank_account,
            bank_iban: profileData.bank_iban,
            bank_bic: profileData.bank_bic,
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error creating profile:', error);
          throw error;
        }
        
        result = data;
      }
      
      return {
        company_name: result.company_name || '',
        address: result.address || '',
        tax_id: result.tax_id || '',
        email: result.email || '',
        phone: result.phone || '',
        bank_name: result.bank_name || '',
        bank_account: result.bank_account || '',
        bank_iban: result.bank_iban || '',
        bank_bic: result.bank_bic || '',
        logo_url: result.logo_url,
      };
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  },
  
  /**
   * Export user data (GDPR)
   * @returns User data export as JSON
   */
  exportUserData: async (): Promise<any> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Nicht authentifiziert. Bitte melden Sie sich an.');
      }
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching profile for export:', profileError);
        throw profileError;
      }
      
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items(*)
        `)
        .eq('user_id', user.id);
      
      if (invoicesError) {
        console.error('Error fetching invoices for export:', invoicesError);
        throw invoicesError;
      }
      
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id);
      
      if (customersError) {
        console.error('Error fetching customers for export:', customersError);
        throw customersError;
      }
      
      const userData = {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        },
        profile: profile || {},
        invoices: invoices || [],
        customers: customers || [],
      };
      
      return userData;
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
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out before account deletion:', error);
        throw error;
      }
      
      const { error: deleteError } = await supabase.rpc('delete_user_account');
      
      if (deleteError) {
        console.error('Error deleting account:', deleteError);
        throw deleteError;
      }
      
      return {
        success: true,
        message: 'Ihr Konto wurde erfolgreich gelöscht. Sie erhalten eine Bestätigungs-E-Mail.',
      };
    } catch (error) {
      console.error('Error in deleteAccount:', error);
      throw error;
    }
  },
};

export default supabaseProfileService;
