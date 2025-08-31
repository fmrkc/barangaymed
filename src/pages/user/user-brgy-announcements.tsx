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
  IonLabel
} from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { announcementsService } from '../../services/announcementsService';
import { Announcement } from '../../types/announcements';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { megaphone, calendar, person, close } from 'ionicons/icons';

const UserAnnouncements: React.FC = () => {
  const { currentUser, userRole, loading: authLoading } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [userBarangay, setUserBarangay] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadUserBarangay();
    }
  }, [currentUser]);

  useEffect(() => {
    if (userBarangay) {
      loadAnnouncements();
    }
  }, [userBarangay]);

  const loadUserBarangay = async () => {
    if (!currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserBarangay(data.barangay || '');
      }
    } catch (error) {
      console.error('Error loading user barangay:', error);
    }
  };

  const loadAnnouncements = async () => {
    if (!userBarangay) return;

    setLoading(true);
    setError(null);
    try {
      const data = await announcementsService.getActiveAnnouncementsForBarangay(userBarangay);
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

  return (
    <>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref='/user/dashboard' />
          </IonButtons>
          <IonTitle>Barangay {userBarangay} Announcements</IonTitle>
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
            <p>There are no active announcements for {userBarangay} at this time.</p>
          </div>
        )}

        <IonGrid>
          <IonRow>
            {announcements.map((announcement) => (
              <IonCol size="12" size-md="6" size-lg="4" key={announcement.id}>
                <IonCard onClick={() => handleViewDetails(announcement)} style={{ cursor: 'pointer' }}>
                  {announcement.images && announcement.images.length > 0 ? (
                    <>
                      <img src={announcement.images[0].url} alt={announcement.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                      <IonCardHeader>
                        <IonCardTitle style={{ fontSize: '1rem' }}>{announcement.title}</IonCardTitle>
                      </IonCardHeader>
                    </>
                  ) : (
                    <IonCardHeader style={{ minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <IonCardTitle>{announcement.title}</IonCardTitle>
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
          <IonHeader>
            <IonToolbar>
              <IonTitle>{selectedAnnouncement?.title}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {selectedAnnouncement && (
              <>
                <IonCardHeader>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <IonCardTitle>{selectedAnnouncement.title}</IonCardTitle>
                        <IonChip color={getPriorityColor(selectedAnnouncement.priority)}>
                            {selectedAnnouncement.priority.toUpperCase()}
                        </IonChip>
                    </div>
                </IonCardHeader>
                <IonCardContent>
                    <div style={{ marginBottom: '15px' }}>
                        <IonText>
                            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                {selectedAnnouncement.content}
                            </p>
                        </IonText>
                    </div>

                    {selectedAnnouncement.images && selectedAnnouncement.images.length > 0 && (
                      <div style={{ marginTop: '15px' }}>
                        <IonLabel>Images:</IonLabel>
                        <IonGrid>
                          <IonRow>
                            {selectedAnnouncement.images.map((image, index) => (
                              <IonCol size="6" key={index}>
                                <img
                                  src={image.url}
                                  alt={`Announcement image ${index + 1}`}
                                  style={{
                                    width: '100%',
                                    height: '100px',
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

                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '15px', 
                        fontSize: '0.9em', 
                        color: 'gray',
                        flexWrap: 'wrap',
                        marginTop: '20px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <IonIcon icon={person} style={{ fontSize: '16px' }} />
                            <span>{selectedAnnouncement.createdByEmail}</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <IonIcon icon={calendar} style={{ fontSize: '16px' }} />
                            <span>{getRelativeTime(selectedAnnouncement.createdAt)}</span>
                        </div>
                    </div>

                    {selectedAnnouncement.updatedAt && (
                        <div style={{ marginTop: '10px', fontSize: '0.8em', color: 'gray' }}>
                            <IonNote>Updated {getRelativeTime(selectedAnnouncement.updatedAt)}</IonNote>
                        </div>
                    )}
                </IonCardContent>
              </>
            )}
          </IonContent>
        </IonModal>

      </IonContent>
    </>
  );
};

export default UserAnnouncements;
