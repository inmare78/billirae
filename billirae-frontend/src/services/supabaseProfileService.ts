import { supabase } from './supabaseClient';
import type { SupabaseUser } from './supabaseClient';

/**
 * Service for handling user profile operations with Supabase
 */
export const supabaseProfileService = {
  /**
   * Get user profile data from Supabase
   * @param userId The authenticated user ID
   * @returns User profile data
   */
  getUserProfile: async (userId: string): Promise<SupabaseUser> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      throw error;
    }
  },
  
  /**
   * Update user profile data in Supabase
   * @param userId The authenticated user ID
   * @param profileData Updated profile data
   * @returns Updated user profile
   */
  updateUserProfile: async (userId: string, profileData: Partial<SupabaseUser>): Promise<SupabaseUser> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({ 
          id: userId,
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw error;
    }
  },
  
  /**
   * Export all user data (GDPR compliant)
   * @param userId The authenticated user ID
   * @returns All user data as JSON
   */
  exportUserData: async (userId: string): Promise<any> => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('Error exporting user data (profile):', userError);
        throw userError;
      }
      
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*, invoice_items(*)')
        .eq('user_id', userId);
      
      if (invoicesError) {
        console.error('Error exporting user data (invoices):', invoicesError);
        throw invoicesError;
      }
      
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', userId);
      
      if (customersError) {
        console.error('Error exporting user data (customers):', customersError);
        throw customersError;
      }
      
      const exportData = {
        profile: userData,
        invoices: invoicesData,
        customers: customersData,
        exported_at: new Date().toISOString()
      };
      
      return exportData;
    } catch (error) {
      console.error('Error in exportUserData:', error);
      throw error;
    }
  },
  
  /**
   * Delete user account and all associated data
   * @param userId The authenticated user ID
   * @returns Success message
   */
  deleteUserAccount: async (userId: string): Promise<{ success: boolean, message: string }> => {
    try {
      const { error: invoicesError } = await supabase
        .from('invoices')
        .delete()
        .eq('user_id', userId);
      
      if (invoicesError) {
        console.error('Error deleting user invoices:', invoicesError);
        throw invoicesError;
      }
      
      const { error: customersError } = await supabase
        .from('customers')
        .delete()
        .eq('user_id', userId);
      
      if (customersError) {
        console.error('Error deleting user customers:', customersError);
        throw customersError;
      }
      
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (userError) {
        console.error('Error deleting user profile:', userError);
        throw userError;
      }
      
      return { 
        success: true, 
        message: 'Benutzerkonto und alle zugehörigen Daten wurden erfolgreich gelöscht.' 
      };
    } catch (error) {
      console.error('Error in deleteUserAccount:', error);
      throw error;
    }
  }
};

export default supabaseProfileService;
