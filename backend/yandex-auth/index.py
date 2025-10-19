import json
import os
import jwt
from typing import Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import psycopg2
import psycopg2.extras

class YandexAuthRequest(BaseModel):
    code: str = Field(..., min_length=1)
    redirect_uri: str

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Authenticate users with Yandex OAuth and store in database
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
    yandex_client_id = os.environ.get('YANDEX_CLIENT_ID', '')
    yandex_client_secret = os.environ.get('YANDEX_CLIENT_SECRET', '')
    
    if not all([database_url, yandex_client_id, yandex_client_secret]):
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Configuration missing', 'message': 'Настройте ключи Яндекс OAuth в секретах проекта'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    auth_request = YandexAuthRequest(**body_data)
    
    import urllib.request
    import urllib.parse
    
    token_data = urllib.parse.urlencode({
        'grant_type': 'authorization_code',
        'code': auth_request.code,
        'client_id': yandex_client_id,
        'client_secret': yandex_client_secret
    }).encode()
    
    token_req = urllib.request.Request(
        'https://oauth.yandex.ru/token',
        data=token_data,
        method='POST'
    )
    
    with urllib.request.urlopen(token_req) as response:
        token_response = json.loads(response.read().decode())
    
    access_token = token_response.get('access_token')
    
    if not access_token:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Failed to get access token'})
        }
    
    user_req = urllib.request.Request(
        'https://login.yandex.ru/info?format=json',
        headers={'Authorization': f'OAuth {access_token}'}
    )
    
    with urllib.request.urlopen(user_req) as response:
        user_info = json.loads(response.read().decode())
    
    yandex_id = user_info.get('id', '')
    email = user_info.get('default_email', user_info.get('emails', [''])[0])
    name = user_info.get('display_name', user_info.get('real_name', 'Пользователь'))
    avatar_url = f"https://avatars.yandex.net/get-yapic/{user_info.get('default_avatar_id', '')}/islands-200" if user_info.get('default_avatar_id') else ''
    
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    safe_yandex_id = str(yandex_id).replace("'", "''")
    
    cursor.execute(
        f"SELECT id, email, name, avatar_url, created_at, role FROM t_p71282790_adult_content_platfo.users WHERE google_id = '{safe_yandex_id}'"
    )
    user = cursor.fetchone()
    
    if user:
        user_id, email_db, name_db, avatar_url_db, created_at, role = user
        cursor.execute(
            f"UPDATE t_p71282790_adult_content_platfo.users SET last_login = CURRENT_TIMESTAMP WHERE id = {user_id}"
        )
        conn.commit()
    else:
        safe_email = email.replace("'", "''")
        safe_name = name.replace("'", "''")
        safe_avatar = avatar_url.replace("'", "''")
        
        cursor.execute(
            f"INSERT INTO t_p71282790_adult_content_platfo.users (google_id, email, name, avatar_url) VALUES ('{safe_yandex_id}', '{safe_email}', '{safe_name}', '{safe_avatar}') RETURNING id, email, name, avatar_url, created_at, role"
        )
        result = cursor.fetchone()
        user_id, email, name, avatar_url, created_at, role = result
        conn.commit()
    
    cursor.execute(
        f"SELECT plan_name, expires_at, status FROM t_p71282790_adult_content_platfo.subscriptions WHERE user_id = {user_id} AND status = 'active' AND expires_at > CURRENT_TIMESTAMP ORDER BY expires_at DESC LIMIT 1"
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
        'id': user_id,
        'user_id': user_id,
        'email': email,
        'name': name,
        'avatar_url': avatar_url,
        'role': role,
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