"""Create notifications for system actions."""
from django.db.models import Q

from authentication.models import User
from .models import Notification


def get_admin_users():
    """Return all admin users (ADMIN role or superuser)."""
    return User.objects.filter(Q(user_type='ADMIN') | Q(is_superuser=True))


def notify_user(user, title, message, notification_type='', link=''):
    """Create a notification for a user."""
    Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        link=link or '',
    )


def notify_admins(title, message, notification_type='', link=''):
    """Create notifications for all admin users."""
    for admin in get_admin_users():
        notify_user(admin, title, message, notification_type, link)
