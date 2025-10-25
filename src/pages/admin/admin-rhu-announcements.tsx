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
  IonButtons,
  IonMenuButton,
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
  IonSegmentButton,
  IonPage
} from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { announcementsService } from '../../services/announcementsService';
import { Announcement } from '../../types/announcements';
import { megaphone, calendar, person, close, pencil } from 'ionicons/icons';

const ARHUAnnouncements: React.FC = () => {
  const { currentUser, userRole, loading: authLoading } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const barangayId = 'ARHU';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [selectedSegment, setSelectedSegment] = useState('details');

  useEffect(() => {
    if(userRole) {
        loadAnnouncements();
    }
  }, [userRole]);

  const loadAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await announcementsService.getActiveAnnouncementsForBarangay(barangayId);
      setAnnouncements(data);
    } catch (error) {
      console.error('Error loading ARHU announcements:', error);
      setError('Failed to load ARHU announcements. Please check your connection and try again.');
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
        <IonPage>
            <IonContent className="ion-padding">
                <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <IonSpinner />
                <p>Loading...</p>
                </div>
            </IonContent>
        </IonPage>
    );
  }

  if (userRole !== 'admin' && userRole !== 'superadmin') {
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton />
                    </IonButtons>
                    <IonTitle>Access Denied</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <IonIcon
                    icon={megaphone}
                    style={{ fontSize: '48px', color: 'gray', marginBottom: '20px' }}
                />
                <h3>Access Restricted</h3>
                <p>You do not have permission to view this page.</p>
                </div>
            </IonContent>
        </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
            <IonButtons slot="start">
                <IonMenuButton />
            </IonButtons>
            <IonTitle>RHU Announcements</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
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
          <IonNote>Showing all active announcements from the RHU.</IonNote>
        </div>

        {announcements.length === 0 && !loading && (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <IonIcon 
              icon={megaphone} 
              style={{ fontSize: '48px', color: 'gray', marginBottom: '20px' }} 
            />
            <h3>No Announcements</h3>
            <p>There are no active announcements from the RHU at this time.</p>
          </div>
        )}

        <IonGrid className='ion-no-padding'>
          <IonRow>
            {announcements.map((announcement) => (
              <IonCol size="12" size-md="6" size-lg="4" key={announcement.id}>
                <IonCard onClick={() => handleViewDetails(announcement)} style={{ cursor: 'pointer' }}>
                  {announcement.images && announcement.images.length > 0 ? (
                    <>
                     <IonCardHeader>
                        <IonCardTitle style={{ fontSize: '1rem' }}>{announcement.title}</IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent>
                        <p style={{ whiteSpace: 'pre-wrap', marginBottom: '15px' }}>
                          {announcement.content.length > 150
                            ? `${announcement.content.substring(0, 100)}...`
                            : announcement.content
                          }
                        </p>
                      </IonCardContent>
                      <img src={announcement.images[0].url} alt={announcement.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     
                    </>
                  ) : (
                    <IonCardHeader style={{ minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <IonCardTitle>{announcement.title}</IonCardTitle>
                        <p style={{ whiteSpace: 'pre-wrap', marginBottom: '15px' }}>
                          {announcement.content.length > 150
                            ? `${announcement.content.substring(0, 100)}...`
                            : announcement.content
                          }
                        </p>
                    </IonCardHeader>
                  )}
                  <p className='ion-margin'>
                    {announcement.createdByName} · {getRelativeTime(announcement.createdAt)}
                  </p>
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
                  <IonIcon slot='icon-only' icon={close} />
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
                <IonCardHeader>
                  <IonItem lines='none'>
                    <h4>{selectedAnnouncement.title}</h4>
                  </IonItem>
                </IonCardHeader>
                <IonCardContent>
                  <IonItem lines='none'>
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{selectedAnnouncement.content}</p>
                  </IonItem>

                    {selectedAnnouncement.images && selectedAnnouncement.images.length > 0 && (
                      <div>
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

                     <IonItemDivider className='ion-margin-top'> Priority:</IonItemDivider>
                  <IonChip color={getPriorityColor(selectedAnnouncement.priority)}>
                    {selectedAnnouncement.priority.toUpperCase()}
                  </IonChip>

                </IonCardContent>
              </IonCard>
            )}

            {selectedSegment === 'history' && selectedAnnouncement && (
              <IonCard>
                <IonCardContent>
                  {selectedAnnouncement.updatedAt && (
                  <IonItem>
                    <IonIcon icon={pencil} slot="start" />
                    Last updated {getRelativeTime(selectedAnnouncement.updatedAt)}
                  </IonItem>
                )}
                <IonItem>
                  <IonIcon icon={calendar} slot="start" />
                  Created {getRelativeTime(selectedAnnouncement.createdAt)}
                </IonItem>
                <IonItem>
                  <IonIcon icon={person} slot="start" />
                  Created by {selectedAnnouncement.createdByName} ({selectedAnnouncement.createdByEmail})
                </IonItem>
                </IonCardContent>
              </IonCard>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default ARHUAnnouncements;