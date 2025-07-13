from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

CRM_BEARER_TOKEN = os.getenv('CRM_BEARER_TOKEN', 'super-crm-token')
notifications = []  # In-memory store

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
    notifications.append(data)
    print('CRM Notification received:', data)
    return jsonify({'message': 'Notification received'}), 200

@app.route('/notifications', methods=['GET'])
def get_notifications():
    return jsonify(notifications)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001) 