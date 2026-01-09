import { toast } from 'react-toastify';
import axios from 'axios';

// Notification types for different events
export const NOTIFICATION_TYPES = {
  CUSTOMER_CREATED: 'customer_created',
  SERVICE_BOOKED: 'service_booked',
  BOOKING_CANCELLED: 'booking_cancelled',
  TECHNICIAN_LEAVE: 'technician_leave',
  GENERAL: 'general'
};

// Notification service class
class NotificationService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_APIURL;
  }

  // Send notification to backend for storage and broadcasting
  async sendNotification(notificationData) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.baseUrl}/api/Notifications/SendNotification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(notificationData)
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Get user notifications
  async getUserNotifications(userId) {
    try {
      // userId is now already decrypted from HeaderOne
      const roleFromStorage = localStorage.getItem('role');
      const userRole = roleFromStorage ? roleFromStorage.toLowerCase() : 'customer';
      const url = `${this.baseUrl}Bookings/notifications?userId=${userId}&userRole=${userRole}`;
      // console.log('Notification API URL:', url);
      // console.log('Using decrypted userId:', userId);
      const response = await axios.get(url);
      // console.log('Notification API Raw Response:', response.data);
      const payload = response?.data;
      // Normalize: backend may return an array or an object with { success, data }
      if (Array.isArray(payload)) return payload;
      if (payload && Array.isArray(payload.data)) return payload.data;
      return [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      // userId is now already decrypted from HeaderOne
      const roleFromStorage = localStorage.getItem('role');
      const userRole = roleFromStorage ? roleFromStorage.toLowerCase() : 'customer';
      const response = await axios.put(`${this.baseUrl}Bookings/notifications/${notificationId}/read`, null, {
        params: { userId: userId, userRole: userRole },
      });
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Event-specific notification methods
  async notifyCustomerCreated(customerData) {
    const notification = {
      type: NOTIFICATION_TYPES.CUSTOMER_CREATED,
      title: 'New Customer Registered',
      message: `Customer ${customerData.name} has been registered successfully`,
      data: customerData,
      priority: 'high',
      targetRoles: ['Admin', 'Distributor', 'Dealer']
    };

    return this.sendNotification(notification);
  }

  async notifyServiceBooked(bookingData) {
    const notification = {
      type: NOTIFICATION_TYPES.SERVICE_BOOKED,
      title: 'New Service Booking',
      message: `New booking created for ${bookingData.serviceName}`,
      data: bookingData,
      priority: 'high',
      targetRoles: ['Admin', 'Distributor', 'Dealer', 'Technician']
    };

    return this.sendNotification(notification);
  }

  async notifyBookingCancelled(bookingData) {
    const notification = {
      type: NOTIFICATION_TYPES.BOOKING_CANCELLED,
      title: 'Booking Cancelled',
      message: `Booking #${bookingData.bookingId} has been cancelled`,
      data: bookingData,
      priority: 'medium',
      targetRoles: ['Admin', 'Distributor', 'Dealer']
    };

    return this.sendNotification(notification);
  }

  async notifyTechnicianLeave(leaveData) {
    const notification = {
      type: NOTIFICATION_TYPES.TECHNICIAN_LEAVE,
      title: 'Technician Leave Request',
      message: `${leaveData.technicianName} has requested leave from ${leaveData.startDate} to ${leaveData.endDate}`,
      data: leaveData,
      priority: 'medium',
      targetRoles: ['Admin', 'Distributor']
    };

    return this.sendNotification(notification);
  }

  // Show toast notification for immediate feedback
  showToastNotification(title, message, type = 'info') {
    toast[type](message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
