export interface UserData {
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  birthdate: string;
  gender?: string;
  lotBlkHouseNo?: string;
  streetName?: string;
  subdivisionVillageZonePurok?: string;
  zipCode?: string;
  contactNumber?: string;
  email?: string;
  barangayId?: string;
  selectedRegion?: string;
  selectedProvince?: string;
  selectedCityMunicipality?: string;
  idVerificationUrl?: string;
  idVerificationType?: string;
  address?: string;
}

export interface TeleconsultationRequest {
  id?: string;
  userId: string;
  barangayId: string;
  userData?: UserData;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected' | 'scheduled' | 'completed' | 'cancelled' | 'no show';
  createdAt: Date;
  updatedAt?: Date;
  scheduledAt?: Date;
  notes?: string;
  doctorId?: string;
  meetingLink?: string;
}
