const markAsRead = async (notificationId: string) => {
  if (!currentUser) return;

  try {
    // Persist to Firestore (or your backend)
    await notificationsService.markAsRead(currentUser.uid, notificationId);

    // Optimistically update local state
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );

    setUnreadCount(prev => Math.max(0, prev - 1));
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};
