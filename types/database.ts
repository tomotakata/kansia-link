export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: number
          is_hidden: boolean
          registered_at: string | null
          star_rating: number | null
          header_note: string | null
          company_name: string
          company_name_kana: string | null
          company_phone: string | null
          company_fax: string | null
          birth_era: string | null
          birth_year: number | null
          birth_month: number | null
          birth_day: number | null
          gender: string | null
          rep_name: string | null
          rep_name_kana: string | null
          mobile_phone: string | null
          home_phone: string | null
          email: string | null
          family_members: Json
          company_address_type: string | null
          company_address_owner: string | null
          company_postal_code: string | null
          company_prefecture: string | null
          company_city: string | null
          company_street: string | null
          rep_address_same: boolean
          rep_address_type: string | null
          rep_address_owner: string | null
          rep_postal_code: string | null
          rep_prefecture: string | null
          rep_city: string | null
          rep_street: string | null
          capital: number | null
          monthly_revenue: number | null
          employees: number | null
          founded_year: number | null
          purchase_amount: number | null
          purchase_date: string | null
          payday: number | null
          total_salary: number | null
          business_description: string | null
          current_account: string | null
          payment_schedule: Json
          tax_payment_status: string | null
          tax_payment_detail: string | null
          other_companies: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['companies']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          created_at?: string
        }
        Update: {
          display_name?: string | null
        }
      }
    }
  }
}

export type Company = Database['public']['Tables']['companies']['Row']
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
export type CompanyUpdate = Database['public']['Tables']['companies']['Update']
export type Profile = Database['public']['Tables']['profiles']['Row']

export interface FamilyMember {
  name: string
  relation: string
  note: string
}

export interface PaymentScheduleItem {
  company: string
  address: string
  amount: string
  condition1: string
  condition2: string
}
