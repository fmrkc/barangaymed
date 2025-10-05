export interface Medicine {
  id?: string;
  medicine_name: string;
  dosage_form: string;
  strength: string;
  category: string;
  requires_prescription: boolean;
  description?: string;
  created_at: Date;
  expiration_date: Date;
  unit_name: string;
  conversion_factor: number;
  quantity: number;
}
