from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/notify', methods=['POST'])
def notify():
    # Notification logic will be implemented here
    return jsonify({'message': 'Notification endpoint reached'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001) 