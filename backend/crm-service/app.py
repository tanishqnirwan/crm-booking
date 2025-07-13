from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

CRM_BEARER_TOKEN = os.getenv('CRM_BEARER_TOKEN', 'super-crm-token')
GMAIL_USER = os.getenv('GMAIL_USER', 'your-email@gmail.com')
GMAIL_PASSWORD = os.getenv('GMAIL_PASSWORD', 'your-app-password')

# Debug environment variables
print("=== CRM Service Environment Variables ===")
print(f"CRM_BEARER_TOKEN: {CRM_BEARER_TOKEN}")
print(f"GMAIL_USER: {GMAIL_USER}")
print(f"GMAIL_PASSWORD: {GMAIL_PASSWORD[:5]}..." if GMAIL_PASSWORD else "Not set")
print("========================================")

notifications = []  # In-memory store

def log_email_fallback(to_email, subject, html_content, text_content=None):
    """Log email content instead of sending when Gmail fails"""
    print(f"\n=== EMAIL LOGGED (Gmail Failed) ===")
    print(f"To: {to_email}")
    print(f"Subject: {subject}")
    print(f"Text Content: {text_content}")
    print(f"HTML Content: {html_content[:200]}...")
    print(f"=====================================\n")
    return True

def send_email(to_email, subject, html_content, text_content=None):
    """Send email using Gmail SMTP with fallback to logging"""
    try:
        print(f"Attempting to send email to: {to_email}")
        print(f"Gmail User: {GMAIL_USER}")
        print(f"Gmail Password: {GMAIL_PASSWORD[:5]}..." if GMAIL_PASSWORD else "Not set")
        
        if not GMAIL_USER or not GMAIL_PASSWORD:
            print("Gmail credentials not configured, logging email instead")
            return log_email_fallback(to_email, subject, html_content, text_content)
            
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = GMAIL_USER
        msg['To'] = to_email
        
        # Add text and HTML parts
        if text_content:
            text_part = MIMEText(text_content, 'plain')
            msg.attach(text_part)
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        print(f"Connecting to Gmail SMTP...")
        # Send email
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            print(f"Logging in to Gmail...")
            server.login(GMAIL_USER, GMAIL_PASSWORD)
            print(f"Sending email...")
            server.send_message(msg)
        
        print(f"Email sent successfully to {to_email}")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"Gmail authentication failed: {e}")
        print("Falling back to email logging...")
        return log_email_fallback(to_email, subject, html_content, text_content)
        
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        import traceback
        traceback.print_exc()
        print("Falling back to email logging...")
        return log_email_fallback(to_email, subject, html_content, text_content)

def send_booking_confirmation_email(user_data, event_data, facilitator_data, booking_id):
    """Send booking confirmation email to user"""
    subject = f"Booking Confirmed - {event_data.get('title', 'Event')}"
    
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #28a745; margin-bottom: 20px;">✅ Booking Confirmed!</h2>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #333; margin-bottom: 15px;">Event Details</h3>
                <p><strong>Event:</strong> {event_data.get('title', 'Unknown Event')}</p>
                <p><strong>Facilitator:</strong> {facilitator_data.get('name', 'Unknown')}</p>
                <p><strong>Booking ID:</strong> #{booking_id}</p>
                <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Confirmed</span></p>
            </div>
            
            <div style="background-color: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
                <h4 style="margin-top: 0; color: #007bff;">What's Next?</h4>
                <ul style="margin-bottom: 0;">
                    <li>You'll receive a reminder before the event</li>
                    <li>Check your dashboard for event updates</li>
                    <li>Contact the facilitator if you have questions</li>
                </ul>
            </div>
            
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
                Thank you for choosing our platform!
            </p>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    Booking Confirmed!
    
    Event: {event_data.get('title', 'Unknown Event')}
    Facilitator: {facilitator_data.get('name', 'Unknown')}
    Booking ID: #{booking_id}
    Status: Confirmed
    
    What's Next?
    - You'll receive a reminder before the event
    - Check your dashboard for event updates
    - Contact the facilitator if you have questions
    
    Thank you for choosing our platform!
    """
    
    return send_email(user_data.get('email'), subject, html_content, text_content)

def send_facilitator_notification_email(facilitator_data, user_data, event_data, booking_id, action):
    """Send notification email to facilitator"""
    action_text = {
        'payment_completed': 'New Booking Payment',
        'approved': 'Booking Approved',
        'rejected': 'Booking Rejected'
    }.get(action, action)
    
    subject = f"{action_text} - {event_data.get('title', 'Event')}"
    
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #007bff; margin-bottom: 20px;">🔔 {action_text}</h2>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #333; margin-bottom: 15px;">Booking Details</h3>
                <p><strong>Event:</strong> {event_data.get('title', 'Unknown Event')}</p>
                <p><strong>Customer:</strong> {user_data.get('name', 'Unknown')} ({user_data.get('email', 'No email')})</p>
                <p><strong>Booking ID:</strong> #{booking_id}</p>
                <p><strong>Action:</strong> <span style="color: #007bff; font-weight: bold;">{action_text}</span></p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                <h4 style="margin-top: 0; color: #856404;">Quick Actions</h4>
                <ul style="margin-bottom: 0;">
                    <li>Review the booking in your dashboard</li>
                    <li>Contact the customer if needed</li>
                    <li>Update event details if necessary</li>
                </ul>
            </div>
            
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
                Manage your bookings at your facilitator dashboard.
            </p>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    {action_text}
    
    Event: {event_data.get('title', 'Unknown Event')}
    Customer: {user_data.get('name', 'Unknown')} ({user_data.get('email', 'No email')})
    Booking ID: #{booking_id}
    Action: {action_text}
    
    Quick Actions:
    - Review the booking in your dashboard
    - Contact the customer if needed
    - Update event details if necessary
    
    Manage your bookings at your facilitator dashboard.
    """
    
    return send_email(facilitator_data.get('email'), subject, html_content, text_content)

def send_booking_status_email(user_data, event_data, facilitator_data, booking_id, status):
    """Send booking status update email to user"""
    status_text = {
        'approved': 'Approved',
        'rejected': 'Rejected',
        'cancelled': 'Cancelled'
    }.get(status, status or 'Unknown')
    
    status_color = {
        'approved': '#28a745',
        'rejected': '#dc3545',
        'cancelled': '#dc3545'
    }.get(status, '#6c757d')
    
    subject = f"Booking {status_text} - {event_data.get('title', 'Event')}"
    
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: {status_color}; margin-bottom: 20px;">
                {'✅' if status == 'approved' else '❌'} Booking {status_text}!
            </h2>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #333; margin-bottom: 15px;">Event Details</h3>
                <p><strong>Event:</strong> {event_data.get('title', 'Unknown Event')}</p>
                <p><strong>Facilitator:</strong> {facilitator_data.get('name', 'Unknown')}</p>
                <p><strong>Booking ID:</strong> #{booking_id}</p>
                <p><strong>Status:</strong> <span style="color: {status_color}; font-weight: bold;">{status_text}</span></p>
            </div>
            
            {f'''
            <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                <h4 style="margin-top: 0; color: #155724;">Next Steps</h4>
                <ul style="margin-bottom: 0;">
                    <li>Prepare for your session</li>
                    <li>Check event details and timing</li>
                    <li>Contact facilitator if you have questions</li>
                </ul>
            </div>
            ''' if status == 'approved' else f'''
            <div style="background-color: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
                <h4 style="margin-top: 0; color: #721c24;">What Happened?</h4>
                <p style="margin-bottom: 0;">Your booking was {status_text.lower()}. This could be due to:</p>
                <ul style="margin-bottom: 0;">
                    <li>Event cancellation by facilitator</li>
                    <li>Payment issues</li>
                    <li>Event capacity reached</li>
                </ul>
            </div>
            '''}
            
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
                Thank you for choosing our platform!
            </p>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    Booking {status_text}!
    
    Event: {event_data.get('title', 'Unknown Event')}
    Facilitator: {facilitator_data.get('name', 'Unknown')}
    Booking ID: #{booking_id}
    Status: {status_text}
    
    {f'''
    Next Steps:
    - Prepare for your session
    - Check event details and timing
    - Contact facilitator if you have questions
    ''' if status == 'approved' else f'''
    What Happened?
    Your booking was {status_text.lower()}. This could be due to:
    - Event cancellation by facilitator
    - Payment issues
    - Event capacity reached
    '''}
    
    Thank you for choosing our platform!
    """
    
    return send_email(user_data.get('email'), subject, html_content, text_content)

def send_event_cancellation_email(user_data, event_data, facilitator_data, booking_id):
    """Send event cancellation email to user"""
    subject = f"Event Cancelled - {event_data.get('title', 'Event')}"
    
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #dc3545; margin-bottom: 20px;">❌ Event Cancelled</h2>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #333; margin-bottom: 15px;">Event Details</h3>
                <p><strong>Event:</strong> {event_data.get('title', 'Unknown Event')}</p>
                <p><strong>Facilitator:</strong> {facilitator_data.get('name', 'Unknown')}</p>
                <p><strong>Booking ID:</strong> #{booking_id}</p>
                <p><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">Cancelled</span></p>
            </div>
            
            <div style="background-color: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
                <h4 style="margin-top: 0; color: #721c24;">What This Means</h4>
                <ul style="margin-bottom: 0;">
                    <li>Your booking has been cancelled</li>
                    <li>Any payment will be refunded automatically</li>
                    <li>You can book other events in our platform</li>
                </ul>
            </div>
            
            <div style="background-color: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff; margin-top: 15px;">
                <h4 style="margin-top: 0; color: #007bff;">Next Steps</h4>
                <ul style="margin-bottom: 0;">
                    <li>Check your dashboard for refund status</li>
                    <li>Browse other available events</li>
                    <li>Contact support if you have questions</li>
                </ul>
            </div>
            
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
                We apologize for any inconvenience caused.
            </p>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    Event Cancelled
    
    Event: {event_data.get('title', 'Unknown Event')}
    Facilitator: {facilitator_data.get('name', 'Unknown')}
    Booking ID: #{booking_id}
    Status: Cancelled
    
    What This Means:
    - Your booking has been cancelled
    - Any payment will be refunded automatically
    - You can book other events in our platform
    
    Next Steps:
    - Check your dashboard for refund status
    - Browse other available events
    - Contact support if you have questions
    
    We apologize for any inconvenience caused.
    """
    
    return send_email(user_data.get('email'), subject, html_content, text_content)

@app.route('/notify', methods=['POST'])
def notify():
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return jsonify({'error': 'Missing or invalid Authorization header'}), 401
    token = auth.split(' ', 1)[1]
    if token != CRM_BEARER_TOKEN:
        return jsonify({'error': 'Invalid Bearer token'}), 403
    data = request.get_json()
    required = ['booking_id', 'user', 'event', 'facilitator_id']
    if not all(field in data for field in required):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Add timestamp to notification
    notification_data = {
        **data,
        'timestamp': datetime.now().isoformat(),
        'id': len(notifications) + 1
    }
    
    notifications.append(notification_data)
    print('CRM Notification received:', notification_data)
    
    # Send email notifications
    try:
        action = data.get('action', 'unknown')
        print(f"Processing notification for action: {action}")
        
        # Send email to user for payment completed
        if action == 'payment_completed' and data.get('user', {}).get('email'):
            print(f"Sending payment confirmation email to user: {data['user']['email']}")
            send_booking_confirmation_email(
                data['user'],
                data['event'],
                data.get('facilitator', {}),
                data['booking_id']
            )
        
        # Send email to user for booking status changes
        if action in ['approved', 'rejected'] and data.get('user', {}).get('email'):
            print(f"Sending status email to user: {data['user']['email']}")
            send_booking_status_email(
                data['user'],
                data['event'],
                data.get('facilitator', {}),
                data['booking_id'],
                action
            )
        
        # Send email to user for event cancellations
        if action == 'cancelled' and data.get('user', {}).get('email'):
            print(f"Sending cancellation email to user: {data['user']['email']}")
            send_event_cancellation_email(
                data['user'],
                data['event'],
                data.get('facilitator', {}),
                data['booking_id']
            )
        
        # Send email to facilitator for all actions
        if data.get('facilitator', {}).get('email'):
            print(f"Sending notification email to facilitator: {data['facilitator']['email']}")
            send_facilitator_notification_email(
                data['facilitator'],
                data['user'],
                data['event'],
                data['booking_id'],
                action
            )
            
    except Exception as e:
        print(f"Failed to send email notifications: {e}")
        import traceback
        traceback.print_exc()
    
    return jsonify({'message': 'Notification received', 'id': notification_data['id']}), 200

@app.route('/notifications', methods=['GET'])
def get_notifications():
    return jsonify(notifications)

@app.route('/notifications/<int:notification_id>', methods=['DELETE'])
def delete_notification(notification_id):
    global notifications
    notifications = [n for n in notifications if n.get('id') != notification_id]
    return jsonify({'message': 'Notification deleted'}), 200

@app.route('/notifications/clear', methods=['DELETE'])
def clear_notifications():
    global notifications
    notifications = []
    return jsonify({'message': 'All notifications cleared'}), 200

@app.route('/test-email', methods=['POST'])
def test_email():
    """Test endpoint to verify email functionality"""
    try:
        data = request.get_json()
        to_email = data.get('email', 'tanishqcodes9@gmail.com')
        
        subject = "Test Email from CRM Service"
        html_content = """
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h2 style="color: #28a745; margin-bottom: 20px;">✅ Email Test Successful!</h2>
                <p>This is a test email from the CRM service to verify email functionality.</p>
                <p>If you received this email, the Gmail SMTP configuration is working correctly.</p>
            </div>
        </body>
        </html>
        """
        
        text_content = """
        Test Email from CRM Service
        
        This is a test email from the CRM service to verify email functionality.
        If you received this email, the Gmail SMTP configuration is working correctly.
        """
        
        success = send_email(to_email, subject, html_content, text_content)
        
        if success:
            return jsonify({'message': 'Test email sent successfully'}), 200
        else:
            return jsonify({'error': 'Failed to send test email'}), 500
            
    except Exception as e:
        return jsonify({'error': f'Test email failed: {str(e)}'}), 500

@app.route('/test-gmail-auth', methods=['GET'])
def test_gmail_auth():
    """Test Gmail authentication"""
    try:
        print(f"Testing Gmail authentication...")
        print(f"Gmail User: {GMAIL_USER}")
        print(f"Gmail Password: {GMAIL_PASSWORD[:5]}..." if GMAIL_PASSWORD else "Not set")
        
        if not GMAIL_USER or not GMAIL_PASSWORD:
            return jsonify({'error': 'Gmail credentials not configured'}), 400
        
        # Test SMTP connection
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            print("Connecting to Gmail SMTP...")
            server.login(GMAIL_USER, GMAIL_PASSWORD)
            print("Gmail authentication successful!")
            
        return jsonify({
            'message': 'Gmail authentication successful',
            'user': GMAIL_USER,
            'password_length': len(GMAIL_PASSWORD) if GMAIL_PASSWORD else 0
        }), 200
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"Gmail authentication failed: {e}")
        return jsonify({
            'error': 'Gmail authentication failed',
            'details': str(e),
            'user': GMAIL_USER,
            'password_length': len(GMAIL_PASSWORD) if GMAIL_PASSWORD else 0
        }), 401
        
    except Exception as e:
        print(f"Gmail test failed: {e}")
        return jsonify({
            'error': 'Gmail test failed',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001) 