import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonModal,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonList,
  IonIcon,
  IonChip,
  IonBadge,
  IonToast,
  IonFab,
  IonFabButton,
  IonLoading,
  IonAlert,
  IonNote
} from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { announcementsService } from '../../services/announcementsService';
import { Announcement, AnnouncementFormData } from '../../types/announcements';
import { add, trash, pencil, eye, eyeOff } from 'ionicons/icons';

const SARHUAnnouncements: React.FC = () => {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    content: '',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await announcementsService.getAnnouncementsByBarangay('ARHU');
      setAnnouncements(data);
    } catch (error) {
      console.error('Error loading RHU announcements:', error);
      setToastMessage('Error loading RHU announcements');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setToastMessage('Please fill in all required fields');
      setShowToast(true);
      return;
    }

    if (!currentUser) {
      setToastMessage('User information not available');
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      if (editingAnnouncement) {
        await announcementsService.updateAnnouncement(
          editingAnnouncement.id!,
          formData,
          currentUser.uid,
          currentUser.email || ''
        );
        setToastMessage('RHU announcement updated successfully');
      } else {
        await announcementsService.createAnnouncement(
          formData,
          'ARHU',
          currentUser.uid,
          currentUser.email || ''
        );
        setToastMessage('RHU announcement created successfully');
      }
      
      setShowModal(false);
      resetForm();
      loadAnnouncements();
    } catch (error) {
      setToastMessage('Error saving RHU announcement');
      console.error('Error saving RHU announcement:', error);
    } finally {
      setLoading(false);
      setShowToast(true);
    }
  };

  const handleDelete = async () => {
    if (!announcementToDelete || !currentUser) return;

    setLoading(true);
    try {
      await announcementsService.deleteAnnouncement(
        announcementToDelete,
        currentUser.uid,
        currentUser.email || ''
      );
      setToastMessage('RHU announcement deleted successfully');
      loadAnnouncements();
    } catch (error) {
      setToastMessage('Error deleting RHU announcement');
      console.error('Error deleting RHU announcement:', error);
    } finally {
      setLoading(false);
      setShowToast(true);
      setShowDeleteAlert(false);
      setAnnouncementToDelete(null);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'medium'
    });
    setEditingAnnouncement(null);
  };

  const openCreateModal = () => {
    resetForm();
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>RHU Announcements Management</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonLoading isOpen={loading} message="Please wait..." />
        
        <div className="ion-margin-bottom">
          <h2>Manage RHU Announcements</h2>
          <IonNote>All announcements are for RHU (Rural Health Unit) distribution</IonNote>
        </div>

        <IonList>
          {announcements.map((announcement) => (
            <IonCard key={announcement.id}>
              <IonCardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <IonCardTitle>{announcement.title}</IonCardTitle>
                  <IonChip color={getPriorityColor(announcement.priority)}>
                    {announcement.priority.toUpperCase()}
                  </IonChip>
                </div>
                <div style={{ fontSize: '0.8em', color: 'gray', marginTop: '5px' }}>
                  By {announcement.createdByEmail} • {formatDate(announcement.createdAt)}
                  {!announcement.isActive && (
                    <IonBadge color="medium" style={{ marginLeft: '10px' }}>
                      <IonIcon icon={eyeOff} style={{ marginRight: '5px' }} />
                      Inactive
                    </IonBadge>
                  )}
                </div>
              </IonCardHeader>
              <IonCardContent>
                <p style={{ whiteSpace: 'pre-wrap' }}>{announcement.content}</p>
                
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                  <IonButton 
                    fill="outline" 
                    size="small"
                    onClick={() => handleEdit(announcement)}
                  >
                    <IonIcon icon={pencil} slot="start" />
                    Edit
                  </IonButton>
                  
                  {announcement.isActive ? (
                    <IonButton 
                      fill="outline" 
                      size="small" 
                      color="danger"
                      onClick={() => {
                        setAnnouncementToDelete(announcement.id!);
                        setShowDeleteAlert(true);
                      }}
                    >
                      <IonIcon icon={trash} slot="start" />
                      Delete
                    </IonButton>
                  ) : (
                    <IonButton 
                      fill="outline" 
                      size="small" 
                      color="success"
                      onClick={async () => {
                        if (!currentUser) return;
                        try {
                          await announcementsService.reactivateAnnouncement(
                            announcement.id!,
                            currentUser.uid,
                            currentUser.email || ''
                          );
                          setToastMessage('RHU announcement reactivated');
                          loadAnnouncements();
                        } catch (error) {
                          setToastMessage('Error reactivating RHU announcement');
                        } finally {
                          setShowToast(true);
                        }
                      }}
                    >
                      <IonIcon icon={eye} slot="start" />
                      Reactivate
                    </IonButton>
                  )}
                </div>
              </IonCardContent>
            </IonCard>
          ))}
        </IonList>

        {announcements.length === 0 && !loading && (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <p>No RHU announcements found</p>
            <IonButton onClick={openCreateModal}>
              <IonIcon icon={add} slot="start" />
              Create First Announcement
            </IonButton>
          </div>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={openCreateModal}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>
                {editingAnnouncement ? 'Edit RHU Announcement' : 'Create RHU Announcement'}
              </IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="stacked">Title *</IonLabel>
              <IonInput
                value={formData.title}
                onIonChange={(e) => setFormData({ ...formData, title: e.detail.value! })}
                placeholder="Enter announcement title"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Content *</IonLabel>
              <IonTextarea
                value={formData.content}
                onIonChange={(e) => setFormData({ ...formData, content: e.detail.value! })}
                placeholder="Enter announcement content"
                rows={6}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Priority</IonLabel>
              <IonSelect
                value={formData.priority}
                onIonChange={(e) => setFormData({ ...formData, priority: e.detail.value })}
              >
                <IonSelectOption value="low">Low</IonSelectOption>
                <IonSelectOption value="medium">Medium</IonSelectOption>
                <IonSelectOption value="high">High</IonSelectOption>
              </IonSelect>
            </IonItem>

            <div style={{ marginTop: '20px' }}>
              <IonButton expand="block" onClick={handleSubmit}>
                {editingAnnouncement ? 'Update' : 'Create'} RHU Announcement
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Confirm Delete"
          message="Are you sure you want to delete this RHU announcement? This action can be undone by reactivating it."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Delete',
              role: 'confirm',
              handler: handleDelete
            }
          ]}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
        />
      </IonContent>
    </IonPage>
  );
};

export default SARHUAnnouncements;
