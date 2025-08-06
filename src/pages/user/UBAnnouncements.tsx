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
  IonButtons
} from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { announcementsService } from '../../services/announcementsService';
import { Announcement } from '../../types/announcements';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { megaphone, calendar, person } from 'ionicons/icons';

const UserAnnouncements: React.FC = () => {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [userBarangay, setUserBarangay] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const data = await announcementsService.getAnnouncementsByBarangay(userBarangay);
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

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
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
      return formatDate(date);
    }
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref='/user/dashboard' />
          </IonButtons>
          <IonTitle>Barangay {userBarangay} Announcements</IonTitle>
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

        {announcements.map((announcement) => (
          <IonCard key={announcement.id}>
            <IonCardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <IonCardTitle>{announcement.title}</IonCardTitle>
                <IonChip color={getPriorityColor(announcement.priority)}>
                  {announcement.priority.toUpperCase()}
                </IonChip>
              </div>
            </IonCardHeader>
            <IonCardContent>
              <div style={{ marginBottom: '15px' }}>
                <IonText color="medium">
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {announcement.content}
                  </p>
                </IonText>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '15px', 
                fontSize: '0.9em', 
                color: 'gray',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <IonIcon icon={person} style={{ fontSize: '16px' }} />
                  <span>{announcement.createdByEmail}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <IonIcon icon={calendar} style={{ fontSize: '16px' }} />
                  <span>{getRelativeTime(announcement.createdAt)}</span>
                </div>
              </div>

              {announcement.updatedAt && announcement.updatedAt.getTime() !== announcement.createdAt.getTime() && (
                <div style={{ marginTop: '10px', fontSize: '0.8em', color: 'gray' }}>
                  <IonNote>Updated {getRelativeTime(announcement.updatedAt)}</IonNote>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        ))}

        {announcements.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '20px', color: 'gray' }}>
            <IonNote>
              Showing {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}.
            </IonNote>
          </div>
        )}
      </IonContent>
    </>
  );
};

export default UserAnnouncements;
