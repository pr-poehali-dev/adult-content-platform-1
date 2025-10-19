import json
import os
import jwt
from typing import Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import psycopg2
import psycopg2.extras

class GoogleTokenRequest(BaseModel):
    token: str = Field(..., min_length=1)
    name: str
    email: str
    picture: str
    google_id: str

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Authenticate users with Google OAuth and store in database
    Args: event with httpMethod, body; context with request_id
    Returns: JWT token and user data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    database_url = os.environ.get('DATABASE_URL', '')
    google_client_id = os.environ.get('GOOGLE_CLIENT_ID', '')
    
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Database not configured'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    auth_data = GoogleTokenRequest(**body_data)
    
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT id, email, name, avatar_url, created_at FROM users WHERE google_id = '" + auth_data.google_id.replace("'", "''") + "'"
    )
    user = cursor.fetchone()
    
    if user:
        user_id, email, name, avatar_url, created_at = user
        cursor.execute(
            "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = " + str(user_id)
        )
        conn.commit()
    else:
        safe_google_id = auth_data.google_id.replace("'", "''")
        safe_email = auth_data.email.replace("'", "''")
        safe_name = auth_data.name.replace("'", "''")
        safe_picture = auth_data.picture.replace("'", "''")
        
        cursor.execute(
            f"INSERT INTO users (google_id, email, name, avatar_url) VALUES ('{safe_google_id}', '{safe_email}', '{safe_name}', '{safe_picture}') RETURNING id, email, name, avatar_url, created_at"
        )
        result = cursor.fetchone()
        user_id, email, name, avatar_url, created_at = result
        conn.commit()
    
    cursor.execute(
        f"SELECT plan_name, expires_at, status FROM subscriptions WHERE user_id = {user_id} AND status = 'active' AND expires_at > CURRENT_TIMESTAMP ORDER BY expires_at DESC LIMIT 1"
    )
    subscription = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    jwt_secret = os.environ.get('JWT_SECRET', 'default-secret-change-me')
    token_payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(days=30)
    }
    jwt_token = jwt.encode(token_payload, jwt_secret, algorithm='HS256')
    
    user_data = {
        'user_id': user_id,
        'email': email,
        'name': name,
        'avatar_url': avatar_url,
        'token': jwt_token,
        'subscription': None
    }
    
    if subscription:
        plan_name, expires_at, status = subscription
        user_data['subscription'] = {
            'plan': plan_name,
            'expires_at': expires_at.isoformat() if expires_at else None,
            'status': status
        }
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps(user_data)
    }