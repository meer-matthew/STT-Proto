from flask import Blueprint, request, jsonify
from datetime import datetime
from app import db
from app.models.notification import Notification
from app.routes.auth import token_required

bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')


@bp.route('', methods=['GET'])
@token_required
def get_notifications(current_user):
    """
    Get all notifications for the current user

    Query parameters:
    - unread_only: boolean (optional) - if true, only return unread notifications
    - limit: integer (optional) - limit number of notifications returned
    """
    try:
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        limit = request.args.get('limit', type=int)

        query = Notification.query.filter_by(user_id=current_user.id)

        if unread_only:
            query = query.filter_by(is_read=False)

        query = query.order_by(Notification.created_at.desc())

        if limit:
            query = query.limit(limit)

        notifications = query.all()

        return jsonify({
            'notifications': [n.to_dict() for n in notifications],
            'total': len(notifications)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/unread-count', methods=['GET'])
@token_required
def get_unread_count(current_user):
    """Get count of unread notifications for the current user"""
    try:
        count = Notification.query.filter_by(
            user_id=current_user.id,
            is_read=False
        ).count()

        return jsonify({'unread_count': count}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:notification_id>/read', methods=['PUT'])
@token_required
def mark_as_read(current_user, notification_id):
    """Mark a specific notification as read"""
    try:
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=current_user.id
        ).first()

        if not notification:
            return jsonify({'error': 'Notification not found'}), 404

        if not notification.is_read:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            db.session.commit()

        return jsonify(notification.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/read-all', methods=['PUT'])
@token_required
def mark_all_as_read(current_user):
    """Mark all notifications as read for the current user"""
    try:
        notifications = Notification.query.filter_by(
            user_id=current_user.id,
            is_read=False
        ).all()

        count = 0
        for notification in notifications:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            count += 1

        db.session.commit()

        return jsonify({
            'message': f'{count} notifications marked as read',
            'count': count
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:notification_id>', methods=['DELETE'])
@token_required
def delete_notification(current_user, notification_id):
    """Delete a specific notification"""
    try:
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=current_user.id
        ).first()

        if not notification:
            return jsonify({'error': 'Notification not found'}), 404

        db.session.delete(notification)
        db.session.commit()

        return jsonify({'message': 'Notification deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
