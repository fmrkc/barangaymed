export const formatTimeAgo = (date: Date | undefined | null): string => {
    if (!date) {
      return 'N/A';
    }
  
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
    if (seconds < 10) {
      return 'just now';
    }
  
    const intervals = {
      year: 31536000,
      month: 2592000,
      day: 86400,
      hour: 3600,
      minute: 60,
    };
  
    if (seconds >= intervals.year) {
      const counter = Math.floor(seconds / intervals.year);
      return `${counter} year${counter > 1 ? 's' : ''} ago`;
    }
    if (seconds >= intervals.month) {
      const counter = Math.floor(seconds / intervals.month);
      return `${counter} month${counter > 1 ? 's' : ''} ago`;
    }
    if (seconds >= intervals.day) {
      const counter = Math.floor(seconds / intervals.day);
      if (counter === 1) return 'yesterday';
      return `${counter} days ago`;
    }
    if (seconds >= intervals.hour) {
      const counter = Math.floor(seconds / intervals.hour);
      return `${counter} hour${counter > 1 ? 's' : ''} ago`;
    }
    if (seconds >= intervals.minute) {
      const counter = Math.floor(seconds / intervals.minute);
      return `${counter} minute${counter > 1 ? 's' : ''} ago`;
    }
    
    const counter = Math.floor(seconds);
    return `${counter} second${counter > 1 ? 's' : ''} ago`;
  };
  