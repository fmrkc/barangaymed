import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonNote,
  IonText,
  IonIcon,
  IonBackButton,
  IonButtons,
  IonModal,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonLabel,
  IonFooter,
  IonItem,
  IonItemDivider,
  IonSegment,
  IonSegmentButton
} from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { announcementsService } from '../../services/announcementsService';
import { Announcement } from '../../types/announcements';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { megaphone, calendar, person, close, pencil, colorFill } from 'ionicons/icons';
import { getBarangayNameByCode } from '../../services/addressService';

const UserAnnouncements: React.FC = () => {
  const { currentUser, userRole, loading: authLoading, verificationStatus } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [barangayId, setbarangayId] = useState<string>('');
  const [barangayName, setBarangayName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [selectedSegment, setSelectedSegment] = useState('details');

  useEffect(() => {
    if (currentUser) {
      loadbarangayId();
    }
  }, [currentUser]);

  useEffect(() => {
    if (barangayId) {
      getBarangayNameByCode(barangayId).then(name => {
        if (name) {
          setBarangayName(name);
        } else {
          setBarangayName('');
        }
      }).catch(error => {
        console.error('Error fetching barangay name:', error);
        setBarangayName('');
      });
      loadAnnouncements();
    }
  }, [barangayId]);

  const loadbarangayId = async () => {
    if (!currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setbarangayId(data.barangayId || '');
      }
    } catch (error) {
      console.error('Error loading user barangay:', error);
    }
  };

  const loadAnnouncements = async () => {
    if (!barangayId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await announcementsService.getActiveAnnouncementsForBarangay(barangayId);
      console.log("Fetched announcements for user:", JSON.stringify(data, null, 2));
      setAnnouncements(data);
    } catch (error) {
      console.error('Error loading announcements:', error);
      setError('Failed to load announcements. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: any) => {
    setRefreshing(true);
    try {
      await loadAnnouncements();
    } catch (error) {
      console.error('Error refreshing announcements:', error);
    } finally {
      setRefreshing(false);
      event.detail.complete();
    }
  };

  const handleViewDetails = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setShowModal(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'medium';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getRelativeTime = (date: any) => {
    const now = new Date();
    let targetDate: Date;

    if (date instanceof Date) {
      targetDate = date;
    } else if (typeof date === 'string') {
      targetDate = new Date(date);
    } else if (date && typeof date.toDate === 'function') {
      targetDate = date.toDate();
    } else {
      targetDate = new Date(date);
    }

    if (isNaN(targetDate.getTime())) {
      return 'Invalid date';
    }

    const diffInMs = now.getTime() - targetDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else {
      return formatDate(targetDate);
    }
  };

  if (authLoading) {
    return (
      <IonContent className="ion-padding">
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <IonSpinner />
          <p>Loading...</p>
        </div>
      </IonContent>
    );
  }

  const isVerified = verificationStatus === 'verified';

  if (!isVerified) {
    return (
      <IonContent className="ion-padding">
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <IonIcon
            icon={megaphone}
            style={{ fontSize: '48px', color: 'gray', marginBottom: '20px' }}
          />
          <h3>Access Restricted</h3>
          <p>Your account is not verified. Please complete the verification process to access barangay announcements.</p>
        </div>
      </IonContent>
    );
  }

  return (
    <>
      <IonHeader className='ion-no-border'>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton defaultHref='/user/dashboard' />
        </IonButtons>
        <IonTitle>Barangay {barangayName || barangayId} Announcements</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent className="ion-padding with-tab-padding">
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>

        {loading && announcements.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <IonSpinner />
            <p>Loading announcements...</p>
          </div>
        )}

        <div className="ion-margin-bottom">
          <IonNote>Showing all active announcements for your barangay.</IonNote>
        </div>

        {announcements.length === 0 && !loading && (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <IonIcon 
              icon={megaphone} 
              style={{ fontSize: '48px', color: 'gray', marginBottom: '20px' }} 
            />
            <h3>No Announcements</h3>
            <p>There are no active announcements for {barangayName || barangayId} at this time.</p>
          </div>
        )}

        <IonGrid  className='ion-no-padding'>
          <IonRow>
            {announcements.map((announcement) => (
              <IonCol className='ion-no-padding' size="12" size-md="6" size-lg="4" key={announcement.id}>
                <IonCard onClick={() => handleViewDetails(announcement)} style={{ cursor: 'pointer' }}>
                  {announcement.images && announcement.images.length > 0 ? (
                    <>
                      <img src={announcement.images[0].url} alt={announcement.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <IonCardHeader>
                        <IonCardTitle style={{ fontSize: '1rem' }}>{announcement.title}</IonCardTitle>
                      </IonCardHeader>
                    </>
                  ) : (
                    <IonCardHeader style={{ minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <IonCardTitle style={{ color: 'white' }}>{announcement.title}</IonCardTitle>
                    </IonCardHeader>
                  )}
                </IonCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>

        {announcements.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '20px', color: 'gray' }}>
            <IonNote>
              Showing {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}.
            </IonNote>
          </div>
        )}

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader className='ion-no-border with-tab-padding'>
            <IonToolbar>
              <IonTitle>Announcement Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonSegment value={selectedSegment} onIonChange={(e) => setSelectedSegment(e.detail.value as string)}>
              <IonSegmentButton value="details">
                <IonLabel>Details</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="history">
                <IonLabel>History</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            {selectedSegment === 'details' && selectedAnnouncement && (
              <IonCard>
                <IonCardContent>
                  <IonItemDivider>Title:</IonItemDivider>
                  <IonItem lines='none'>
                    {selectedAnnouncement.title}
                  </IonItem>

                  <IonItemDivider className='ion-margin-top'>Content:</IonItemDivider>
                  <IonItem lines='none'>
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{selectedAnnouncement.content}</p>
                    
                  </IonItem>

                  <IonItemDivider className='ion-margin-top'> Priority:</IonItemDivider>
                  <IonChip color={getPriorityColor(selectedAnnouncement.priority)}>
                    {selectedAnnouncement.priority.toUpperCase()}
                  </IonChip>

                  

                    {selectedAnnouncement.images && selectedAnnouncement.images.length > 0 && (
                      <div style={{ marginTop: '15px' }}>
                        <IonItemDivider className='ion-margin-top'>Images:</IonItemDivider>
                        <IonGrid>
                          <IonRow>
                            {selectedAnnouncement.images.map((image, index) => (
                              <IonCol size="12" key={index}>
                                <img
                                  src={image.url}
                                  alt={`Announcement image ${index + 1}`}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: '8px'
                                  }}
                                />
                              </IonCol>
                            ))}
                          </IonRow>
                        </IonGrid>
                      </div>
                    )}

                </IonCardContent>
              </IonCard>
            )}

            {selectedSegment === 'history' && selectedAnnouncement && (
              <>
                {selectedAnnouncement.updatedAt && (
                  <IonItem>
                    <IonIcon icon={pencil} slot="start" />
                    Last updated: {getRelativeTime(selectedAnnouncement.updatedAt)}
                  </IonItem>
                )}
                <IonItem>
                  <IonIcon icon={calendar} slot="start" />
                  Created: {getRelativeTime(selectedAnnouncement.createdAt)}
                </IonItem>
                <IonItem>
                  <IonIcon icon={person} slot="start" />
                  Created by: {selectedAnnouncement.createdByEmail}
                </IonItem>
              </>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </>
  );
};

export default UserAnnouncements;
