import React, { useEffect, useState } from 'react';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonText,
  IonLoading,
  IonButtons,
  IonBackButton,
} from '@ionic/react';
import { getFirestore, collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { TeleconsultationRequest } from '../../types/teleconsultationRequests';

const UserTeleRequestList: React.FC = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<TeleconsultationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<TeleconsultationRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'unsuccessful'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore();

  useEffect(() => {
    console.log('Current user:', currentUser);
    if (!currentUser) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, 'teleconsultationRequests'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const reqs: TeleconsultationRequest[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Fetched request doc:', doc.id, data);
          const req: TeleconsultationRequest = {
            id: doc.id,
            userId: data.userId,
            barangayId: data.barangayId,
            userData: data.userData,
            reason: data.reason,
            status: data.status,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
            scheduledAt: data.scheduledAt instanceof Timestamp ? data.scheduledAt.toDate() : data.scheduledAt,
            notes: data.notes,
            doctorId: data.doctorId,
            meetingLink: data.meetingLink,
          };
          reqs.push(req);
        });
        setRequests(reqs);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching teleconsultation requests:', err);
        setError(`Failed to fetch teleconsultation requests: ${err.message}`);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [currentUser, db]);

  useEffect(() => {
    let filtered: TeleconsultationRequest[] = [];
    switch (filter) {
      case 'all':
        filtered = requests;
        break;
      case 'active':
        filtered = requests.filter((r) =>
          ['pending', 'accepted', 'scheduled'].includes(r.status)
        );
        break;
      case 'completed':
        filtered = requests.filter((r) => r.status === 'completed');
        break;
      case 'unsuccessful':
        filtered = requests.filter((r) =>
          ['rejected', 'cancelled', 'no show'].includes(r.status)
        );
        break;
    }
    setFilteredRequests(filtered);
  }, [filter, requests]);

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/user/dashboard/requests" />
          </IonButtons>
          <IonTitle>My Teleconsultation Requests</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonSegment value={filter} onIonChange={e => setFilter(e.detail.value as any)}>
          <IonSegmentButton value="all">
            <IonLabel>All</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="active">
            <IonLabel>Active</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="completed">
            <IonLabel>Completed</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="unsuccessful">
            <IonLabel>Unsuccessful</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {loading && <IonLoading isOpen={loading} message="Loading requests..." />}
        {error && (
          <IonText color="danger" className="ion-padding">
            {error}
          </IonText>
        )}

        {!loading && !error && filteredRequests.length === 0 && (
          <IonText className="ion-padding">No requests found for this category.</IonText>
        )}

        <IonList>
          {filteredRequests.map((request) => (
            <IonCard key={request.id}>
              <IonCardHeader>
                <IonCardTitle>Status: {request.status.charAt(0).toUpperCase() + request.status.slice(1)}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p><strong>Barangay ID:</strong> {request.barangayId}</p>
                <p><strong>Reason:</strong> {request.reason}</p>
                <p><strong>Status:</strong> {request.status.charAt(0).toUpperCase() + request.status.slice(1)}</p>
                <p><strong>Created At:</strong> {request.createdAt ? request.createdAt.toLocaleString() : 'N/A'}</p>
                {request.userData && (
                  <>
                    <p><strong>Name:</strong> {request.userData.firstName} {request.userData.middleName || ''} {request.userData.lastName} {request.userData.suffix || ''}</p>
                    <p><strong>Contact Number:</strong> {request.userData.contactNumber || 'N/A'}</p>
                    <p><strong>Email:</strong> {request.userData.email || 'N/A'}</p>
                    <p><strong>Address:</strong> {request.userData.lotBlkHouseNo || ''} {request.userData.streetName || ''}, {request.userData.subdivisionVillageZonePurok || ''}, {request.userData.selectedCityMunicipality || ''}, {request.userData.selectedProvince || ''}, {request.userData.selectedRegion || ''}, {request.userData.zipCode || ''}</p>
                  </>
                )}
                {request.scheduledAt && (
                  <p><strong>Scheduled At:</strong> {request.scheduledAt.toLocaleString()}</p>
                )}
                {request.notes && (
                  <p><strong>Notes:</strong> {request.notes}</p>
                )}
              </IonCardContent>
            </IonCard>
          ))}
        </IonList>
      </IonContent>
    </>
  );
};

export default UserTeleRequestList;
