// Notification helper functions
import { query } from './postgres.js'

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}

export async function createNotification(userId, type, title, message, link = null) {
  try {
    const id = generateId()
    await query(
      `INSERT INTO notifications (id, user_id, type, title, message, link, read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, CURRENT_TIMESTAMP)`,
      [id, userId, type, title, message, link]
    )
    
    // TODO: Send email notification if user has email notifications enabled
    console.log(`Notification created for user ${userId}: ${title}`)
    
    return { id, success: true }
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

export async function markAsRead(notificationId, userId) {
  try {
    await query(
      'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    )
    return { success: true }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    throw error
  }
}

export async function markAllAsRead(userId) {
  try {
    await query(
      'UPDATE notifications SET read = true WHERE user_id = $1 AND read = false',
      [userId]
    )
    return { success: true }
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    throw error
  }
}
