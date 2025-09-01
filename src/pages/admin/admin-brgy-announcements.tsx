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
  IonDatetime,
  IonNote,
  IonGrid,
  IonRow,
  IonCol,
  IonThumbnail,
  IonItemDivider,
  IonFooter,
  IonSegment,
  IonSegmentButton,
  IonRefresher,
  IonRefresherContent
} from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { announcementsService } from '../../services/announcementsService';
import { Announcement, AnnouncementFormData, AnnouncementImage } from '../../types/announcements';
import { add, create, trash, pencil, eye, eyeOff, close, image, calendar, person, closeCircle, closeCircleSharp } from 'ionicons/icons';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { validateAccess, validateAdminBarangayAccess } from '../../utils/securityUtils';
import { logSecurityEvent, logEvent } from '../../utils/logger';

const BarangayAnnouncements: React.FC = () => {
  const { currentUser, userRole } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    content: '',
    priority: 'medium'
  });
  const [userBarangay, setUserBarangay] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);
  const [showUnprivateAlert, setShowUnprivateAlert] = useState(false);
  const [announcementToUnprivate, setAnnouncementToUnprivate] = useState<Announcement | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<AnnouncementImage[]>([]);
  const [selectedSegment, setSelectedSegment] = useState('details');
  const [selectedEditSegment, setSelectedEditSegment] = useState('details');

  useEffect(() => {
    if (currentUser) {
      loadUserBarangay();
    }
  }, [currentUser]);

  useEffect(() => {
    if (userBarangay && userRole) {
      // Validate access before loading announcements
      const access = validateAdminBarangayAccess(userRole, userBarangay, userBarangay);
      if (!access) {
        setAccessDenied(true);
        setToastMessage('Access denied: You do not have permission to view announcements for this barangay.');
        setShowToast(true);
        return;
      }
      loadAnnouncements();
    }
  }, [userBarangay, userRole]);

  const loadUserBarangay = async () => {
    if (!currentUser) {
      console.error('No current user available when loading barangay');
      return;
    }
    
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log('User document data:', data);
        setUserBarangay(data.barangayId || '');
        
        if (!data.barangayId) {
          console.error('BarangayId field is empty or missing in user document');
          setToastMessage('Your barangay information is not set. Please contact an administrator.');
          setShowToast(true);
        }
      } else {
        console.error('User document does not exist for UID:', currentUser.uid);
        setToastMessage('User profile not found. Please contact an administrator.');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error loading user barangay:', error);
      setToastMessage('Error loading user information');
      setShowToast(true);
    }
  };

  const loadAnnouncements = async () => {
    if (!userBarangay) return;
    
    setLoading(true);
    try {
      const data = await announcementsService.getAllAnnouncementsForBarangay(userBarangay);
      setAnnouncements(data);
      
      // Log successful load with detailed debugging info
      if (currentUser) {
        console.log(`Loaded ${data.length} announcements for barangay: ${userBarangay}`);
        logEvent('info', `Loaded announcements for barangay: ${userBarangay}`, {
          userId: currentUser.uid,
          userEmail: currentUser.email || '',
          userRole: userRole || '',
          metadata: {
            action: 'load_announcements',
            barangay: userBarangay,
            count: data.length,
            announcementIds: data.map(a => a.id)
          }
        });
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
      setToastMessage('Error loading announcements');
      setShowToast(true);
      
      // Log error with detailed debugging info
      if (currentUser) {
        logEvent('error', 'Failed to load announcements', {
          userId: currentUser.uid,
          userEmail: currentUser.email || '',
          userRole: userRole || '',
          metadata: {
            action: 'load_announcements_failed',
            barangay: userBarangay,
            error: error instanceof Error ? error.message : 'Unknown error',
            errorDetails: JSON.stringify(error)
          }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: CustomEvent) => {
    const name = (e.target as HTMLElement).getAttribute('name');
    const value = e.detail.value;
    if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setToastMessage('Please fill in all required fields (title and content)');
      setShowToast(true);
      return;
    }

    if (!currentUser || !userBarangay) {
      console.error('User information not available - currentUser:', currentUser, 'userBarangay:', userBarangay, 'userRole:', userRole);
      setToastMessage('User information not available. Please check if your barangay is properly set in your profile.');
      setShowToast(true);
      return;
    }

    // Validate access before submitting
    const accessValid = validateAdminBarangayAccess(userRole, userBarangay, userBarangay);
    if (!accessValid) {
      console.error('Access denied for user:', {
        uid: currentUser.uid,
        email: currentUser.email,
        userRole,
        userBarangay
      });
      setToastMessage('Access denied: You do not have permission to perform this action.');
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      if (editingAnnouncement) {
        const updatedData = {
          ...formData,
          existingImages: existingImages,
          newImages: selectedImages
        };
        await announcementsService.updateAnnouncement(
          editingAnnouncement.id!,
          updatedData,
          currentUser.uid,
          currentUser.email || ''
        );
        setToastMessage('Announcement updated successfully');
      } else {
        const formDataWithImages = {
          ...formData,
          images: selectedImages,
          isActive: false // New announcements are private by default
        };
        const announcementId = await announcementsService.createAnnouncement(
          formDataWithImages,
          userBarangay,
          currentUser.uid,
          currentUser.email || ''
        );
        setToastMessage('Announcement created successfully. It is currently private.');
      }
      
      setShowModal(false);
      resetForm();
      await loadAnnouncements();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setToastMessage(`Error saving announcement: ${errorMessage}`);
      console.error('Error saving announcement:', error);
    } finally {
      setLoading(false);
      setShowToast(true);
    }
  };

  const handleDelete = async () => {
    if (!announcementToDelete || !currentUser) return;

    // Validate access before archiving
    const accessValid = validateAdminBarangayAccess(userRole, userBarangay, userBarangay);
    if (!accessValid) {
      console.error('Access denied for archiving announcement - currentUser:', currentUser, 'userRole:', userRole, 'userBarangay:', userBarangay);
      setToastMessage('Access denied: You do not have permission to perform this action.');
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      // Archive the announcement (soft delete)
      await announcementsService.deleteAnnouncement(
        announcementToDelete,
        currentUser.uid,
        currentUser.email || ''
      );
      setToastMessage('Announcement archived successfully');
      
      await loadAnnouncements();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setToastMessage(`Error archiving announcement: ${errorMessage}`);
      console.error('Error archiving announcement:', error);
    } finally {
      setLoading(false);
      setShowToast(true);
      setShowDeleteAlert(false);
      setAnnouncementToDelete(null);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    // Validate access before editing
    if (!validateAdminBarangayAccess(userRole, userBarangay, userBarangay)) {
      console.error('Access denied for editing announcement - currentUser:', currentUser, 'userRole:', userRole, 'userBarangay:', userBarangay);
      setToastMessage('Access denied: You do not have permission to perform this action.');
      setShowToast(true);
      return;
    }
    
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority
    });

    if (announcement.images) {
      setExistingImages(announcement.images);
    } else {
      setExistingImages([]);
    }

    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'medium'
    });
    setEditingAnnouncement(null);
    resetImageSelection();
    setExistingImages([]);
  };

  const openCreateModal = () => {
    // Validate access before creating
    if (!validateAdminBarangayAccess(userRole, userBarangay, userBarangay)) {
      console.error('Access denied for creating announcement - currentUser:', currentUser, 'userRole:', userRole, 'userBarangay:', userBarangay);
      setToastMessage('Access denied: You do not have permission to perform this action.');
      setShowToast(true);
      return;
    }
    
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

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: File[] = [];
    const newPreviews: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        setToastMessage('Please select only image files (JPEG, PNG, GIF, etc.)');
        setShowToast(true);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setToastMessage(`File "${file.name}" is too large. Maximum size is 5MB.`);
        setShowToast(true);
        continue;
      }

      newImages.push(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          newPreviews.push(e.target.result as string);
          setImagePreviews(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }

    setSelectedImages(prev => [...prev, ...newImages]);
  };

  const removeNewImage = (index: number) => {
    const newSelectedImages = [...selectedImages];
    const newImagePreviews = [...imagePreviews];
    
    newSelectedImages.splice(index, 1);
    newImagePreviews.splice(index, 1);
    
    setSelectedImages(newSelectedImages);
    setImagePreviews(newImagePreviews);
  };

  const removeExistingImage = (index: number) => {
    const newExistingImages = [...existingImages];
    newExistingImages.splice(index, 1);
    setExistingImages(newExistingImages);
  };

  const resetImageSelection = () => {
    setSelectedImages([]);
    setImagePreviews([]);
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadAnnouncements();
    event.detail.complete();
  };

  const handleViewDetails = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDetailsModal(true);
  };

  if (accessDenied) {
    return (
      <IonPage>
        <IonHeader  className='ion-no-border'>
          <IonToolbar>
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>Barangay Announcements</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2>Access Denied</h2>
            <p>You do not have permission to view announcements for this barangay.</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader  className='ion-no-border'>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Barangay Announcements</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <IonLoading isOpen={loading} message="Please wait..." />

        <div className="ion-margin-bottom">
          <IonNote>Showing all announcements for Barangay {userBarangay}.</IonNote>
        </div>

        
          {announcements.map((announcement) => (
            <IonCard
              key={announcement.id}
              style={{ cursor: 'pointer' }}
              onClick={() => handleViewDetails(announcement)}
            >
              <IonCardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <IonCardTitle style={{ color: 'white' }} >{announcement.title}</IonCardTitle>
                  <IonChip color={getPriorityColor(announcement.priority)}>
                    {announcement.priority.toUpperCase()}
                  </IonChip>
                </div>
                <div style={{ fontSize: '0.8em', color: 'gray', marginTop: '15px' }}>
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
                <p style={{ whiteSpace: 'pre-wrap', marginBottom: '15px' }}>
                  {announcement.content.length > 150
                    ? `${announcement.content.substring(0, 100)}...`
                    : announcement.content
                  }
                </p>

                {announcement.images && announcement.images.length > 0 && (
                  <div>
                    <IonLabel><IonIcon icon={image} slot="start" /> {announcement.images.length} image{announcement.images.length > 1 ? 's' : ''} attached.</IonLabel>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <IonButton
                    fill="outline"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(announcement);
                    }}
                  >
                    <IonIcon icon={pencil} slot="start" />
                    Edit
                  </IonButton>

                  {announcement.isActive ? (
                    <IonButton
                      fill="outline"
                      size="small"
                      color="success"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAnnouncementToDelete(announcement.id!);
                        setShowDeleteAlert(true);
                      }}
                    >
                      <IonIcon icon={eye} slot="start" />
                      Public
                    </IonButton>
                  ) : (
                    <IonButton
                      fill="outline"
                      size="small"
                      color="medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!currentUser) return;

                        if (!validateAdminBarangayAccess(userRole, userBarangay, userBarangay)) {
                          setToastMessage('Access denied: You do not have permission to perform this action.');
                          setShowToast(true);
                          return;
                        }
                        setAnnouncementToUnprivate(announcement);
                        setShowUnprivateAlert(true);
                      }}
                    >
                      <IonIcon icon={eyeOff} slot="start" />
                      Privated
                    </IonButton>
                  )}
                </div>
              </IonCardContent>
              
            </IonCard>  
          ))}
          
      

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={openCreateModal}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>
                {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
              </IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonSegment value={selectedEditSegment} onIonChange={(e) => setSelectedEditSegment(e.detail.value as string)}>
              <IonSegmentButton value="details">
                <IonLabel>Details</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="images">
                <IonLabel>Images</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            {selectedEditSegment === 'details' && (
              <div className='ion-padding'>
                <IonItem>
                  <IonLabel position="stacked">Title *</IonLabel>
                  <IonInput
                    name="title"
                    value={formData.title}
                    onIonChange={handleFormChange}
                    placeholder="Enter announcement title"
                  />
                </IonItem>
                 <IonItem>
                  <IonLabel position="stacked">Priority</IonLabel>
                  <IonSelect
                    name="priority"
                    value={formData.priority}
                    onIonChange={handleFormChange}
                  >
                    <IonSelectOption value="low">Low</IonSelectOption>
                    <IonSelectOption value="medium">Medium</IonSelectOption>
                    <IonSelectOption value="high">High</IonSelectOption>
                  </IonSelect>
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Content *</IonLabel>
                  <IonTextarea
                    
                    name="content"
                    value={formData.content}
                    onIonChange={handleFormChange}
                    placeholder="Enter announcement content"
                    rows={15}
                  />
                </IonItem>

               
              </div>
            )}

            {selectedEditSegment === 'images' && (
              <>
                {editingAnnouncement && existingImages.length > 0 && (
                  <div className='ion-padding'>
                    <IonLabel>Existing Images:</IonLabel>
                    <IonGrid>
                      <IonRow>
                        {existingImages.map((image, index) => (
                          <IonCol size="6" key={index}>
                            <div style={{ position: 'relative', marginBottom: '10px' }}>
                              <img
                                src={image.url}
                                alt={`Existing image ${index + 1}`}
                                style={{
                                  width: '100%',
                                  height: '100px',
                                  objectFit: 'cover',
                                  borderRadius: '8px'
                                }}
                              />
                              <IonButton
                                fill="clear"
                                color="danger"
                                size="small"
                                style={{
                                  position: 'absolute',
                                  top: '5px',
                                  right: '5px',
                                  '--padding-start': '4px',
                                  '--padding-end': '4px'
                                }}
                                onClick={() => removeExistingImage(index)}
                              >
                                <IonIcon icon={closeCircleSharp} />
                              </IonButton>
                            </div>
                          </IonCol>
                        ))}
                      </IonRow>
                    </IonGrid>
                  </div>
                )}

                <IonItem>
                  <IonLabel position="stacked">{editingAnnouncement ? 'Add New Images: Select up to 5 images (max 5MB each)' : 'Images (Optional)'}</IonLabel>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    style={{ marginTop: '10px' }}
                  />
                  <IonNote slot="helper">
                    
                  </IonNote>
                </IonItem>

                {imagePreviews.length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    <IonLabel>New Images:</IonLabel>
                    <IonGrid>
                      <IonRow>
                        {imagePreviews.map((preview, index) => (
                          <IonCol size="6" key={index}>
                            <div style={{ position: 'relative', marginBottom: '10px' }}>
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                style={{
                                  width: '100%',
                                  height: '100px',
                                  objectFit: 'cover',
                                  borderRadius: '8px'
                                }}
                              />
                              <IonButton
                                fill="clear"
                                color="danger"
                                size="small"
                                style={{
                                  position: 'absolute',
                                  top: '5px',
                                  right: '5px',
                                  '--padding-start': '4px',
                                  '--padding-end': '4px'
                                }}
                                onClick={() => removeNewImage(index)}
                              >
                                <IonIcon icon={close} />
                              </IonButton>
                            </div>
                          </IonCol>
                        ))}
                      </IonRow>
                    </IonGrid>
                  </div>
                )}
              </>
            )}

          </IonContent>
          <IonFooter className='ion-padding'>
            <IonToolbar>
              <IonButton shape='round' expand="block" onClick={handleSubmit}>
                <IonIcon icon={editingAnnouncement ? pencil : create} slot="start" />
                {editingAnnouncement ? 'Update' : 'Create'} Announcement
              </IonButton>
            </IonToolbar>
          </IonFooter>
        </IonModal>

        <IonModal
          isOpen={showDetailsModal}
          onDidDismiss={() => {
            setShowDetailsModal(false);
            setSelectedAnnouncement(null);
          }}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Announcement Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowDetailsModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
           
            {selectedAnnouncement && (
              <>
                <IonSegment value={selectedSegment} onIonChange={(e) => setSelectedSegment(e.detail.value as string)}>
                  <IonSegmentButton value="details">
                    <IonLabel>Details</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="history">
                    <IonLabel>History</IonLabel>
                  </IonSegmentButton>
                </IonSegment>
               <div className='ion-padding'>
              {selectedSegment === 'details' && (
                  <>
                    <div style={{ marginBottom: '20px' }}>
                      <IonLabel color={'medium'}>
                        <h3>Title:</h3>
                      </IonLabel>
                      <h2 style={{ marginBottom: '10px' }}>{selectedAnnouncement.title}</h2>
                      Priority:
                      <IonChip color={getPriorityColor(selectedAnnouncement.priority)}>
                        {selectedAnnouncement.priority.toUpperCase()}
                      </IonChip>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                      <IonLabel color={'medium'}>
                        <h3>Content:</h3>
                      </IonLabel>
                      <p style={{ whiteSpace: 'pre-wrap', marginTop: '10px', lineHeight: '1.5' }}>
                        {selectedAnnouncement.content}
                      </p>
                    </div>

                    {selectedAnnouncement.images && selectedAnnouncement.images.length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <IonLabel color={'medium'}>
                          <h3>Images: ({selectedAnnouncement.images.length})</h3>
                        </IonLabel>
                        <IonGrid style={{ marginTop: '10px' }}>
                          <IonRow>
                            {selectedAnnouncement.images.map((image, index) => (
                              <IonCol size="12" sizeMd="6" key={index}>
                                <div style={{ marginBottom: '15px' }}>
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
                                  <div style={{ marginTop: '5px', fontSize: '0.8em', color: 'gray' }}>
                                    {image.name} ({(image.size / 1024 / 1024).toFixed(2)} MB)
                                  </div>
                                </div>
                              </IonCol>
                            ))}
                          </IonRow>
                        </IonGrid>
                      </div>
                    )}
                  </>
                )}
            </div>
                

                {selectedSegment === 'history' && (
                  <>
                    {selectedAnnouncement.updatedAt && (
                      <IonItem>
                        <IonIcon icon={pencil} slot="start" />
                        Last updated: {formatDate(selectedAnnouncement.updatedAt)}
                      </IonItem>
                    )}
                    <IonItem>
                      <IonIcon icon={calendar} slot="start" />
                      Created: {formatDate(selectedAnnouncement.createdAt)}
                    </IonItem>
                    <IonItem>
                      <IonIcon icon={person} slot="start" />
                      Created by: {selectedAnnouncement.createdByEmail}
                    </IonItem>
                  </>
                )}
              </>
            )}
          </IonContent>
          <IonFooter className='ion-padding'>
            <IonToolbar>
                  <IonButton
                    expand="block"
                    shape='round'
                    onClick={() => {
                      setShowDetailsModal(false);
                      if (selectedAnnouncement) {
                        handleEdit(selectedAnnouncement);
                      }
                    }}
                  >
                    <IonIcon icon={pencil} slot="start" />
                    Edit Announcement
                  </IonButton>
               
            </IonToolbar>
          </IonFooter>
        </IonModal>

        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Archive Announcement"
          message="Are you sure you want to archive this announcement? Archived announcements can be reactivated later if needed."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Archive',
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

        <IonAlert
          isOpen={showUnprivateAlert}
          onDidDismiss={() => setShowUnprivateAlert(false)}
          header="Unprivate Announcement"
          message="Are you sure you want to unprivate this announcement? This action will make the announcement public and notify all users in your barangay."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Unprivate',
              role: 'confirm',
              handler: async () => {
                if (!announcementToUnprivate || !currentUser) return;

                setLoading(true);
                try {
                  await announcementsService.reactivateAnnouncement(
                    announcementToUnprivate.id!,
                    currentUser.uid,
                    currentUser.email || ''
                  );
                  setToastMessage('Announcement unprivated and users will be notified.');
                  loadAnnouncements();
                } catch (error) {
                  setToastMessage('Error unprivating announcement');
                  console.error('Error unprivating announcement:', error);
                } finally {
                  setLoading(false);
                  setShowToast(true);
                  setAnnouncementToUnprivate(null);
                }
              }
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default BarangayAnnouncements;
