import { supabase } from './supabaseClient';
import { logRequestDebugInfo } from '../utils/logRequest';

export interface ProfileData {
  id?: string;
  user_id?: string;
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
  created_at?: string;
  updated_at?: string;
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
      
      if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
        await logRequestDebugInfo(
          { data, status: error ? 400 : 200 },
          'Get Profile',
          { maxBodyLength: 1000 }
        );
      }
      
      if (error) {
        if (error.code === 'PGRST116') {
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
        throw error;
      }
      
      return data as ProfileData;
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },
  
  /**
   * Update user profile data in Supabase
   * @param profileData Updated profile data
   * @returns Updated user profile
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
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      let result;
      
      if (existingProfile) {
        const { data, error } = await supabase
          .from('profiles')
          .update({
            ...profileData,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            ...profileData,
            user_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }
      
      if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
        await logRequestDebugInfo(
          { data: result, status: 200 },
          'Update Profile',
          { maxBodyLength: 1000 }
        );
      }
      
      return result as ProfileData;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },
  
  /**
   * Upload profile logo to Supabase storage
   * @param file Logo file
   * @returns URL of uploaded logo
   */
  uploadLogo: async (file: File): Promise<string> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Nicht authentifiziert. Bitte melden Sie sich an.');
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-logo-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(data.path);
      
      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  },
  
  /**
   * Delete user account and all associated data
   * @returns Success message
   */
  deleteAccount: async (): Promise<{ success: boolean, message: string }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Nicht authentifiziert. Bitte melden Sie sich an.');
      }
      
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);
      
      if (profileError) throw profileError;
      
      const { error: invoiceError } = await supabase
        .from('invoices')
        .delete()
        .eq('user_id', user.id);
      
      if (invoiceError) throw invoiceError;
      
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (authError) throw authError;
      
      return {
        success: true,
        message: 'Konto und alle zugehörigen Daten wurden erfolgreich gelöscht.'
      };
    } catch (error: any) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },
  
  /**
   * Export user data (GDPR)
   * @returns User data export
   */
  exportUserData: async (): Promise<any> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Nicht authentifiziert. Bitte melden Sie sich an.');
      }
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*, invoice_items(*)')
        .eq('user_id', user.id);
      
      if (invoicesError) throw invoicesError;
      
      const exportData = {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        profile: profileData || null,
        invoices: invoicesData || []
      };
      
      return exportData;
    } catch (error: any) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }
};

export default supabaseProfileService;
