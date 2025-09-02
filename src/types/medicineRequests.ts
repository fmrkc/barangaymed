export interface MedicineRequest {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  userAddress: string;
  barangayId: string;
  medicineId: string;
  medicineName: string;
  medicineType: string;
  quantity: number;
  pickupDate: Date;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  requestDate: Date;
  approvedDate?: Date;
  completedDate?: Date;
  notes?: string;
  adminNotes?: string;
}

export interface Medicine {
  id: string;
  name: string;
  type: string;
  quantity: number;
  expiryDate: Date;
  location: string;
  barangayId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
