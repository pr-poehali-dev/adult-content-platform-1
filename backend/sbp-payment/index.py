import json
import os
import hmac
import hashlib
import uuid
from typing import Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class PaymentRequest(BaseModel):
    amount: int = Field(..., gt=0)
    description: str = Field(..., min_length=1)
    customer_phone: str = Field(..., pattern=r'^\+?[0-9]{10,15}$')
    plan_name: str

class PaymentStatus(BaseModel):
    payment_id: str

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Create and check SBP payment status
    Args: event with httpMethod, body; context with request_id
    Returns: Payment URL or status
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
    
    merchant_id = os.environ.get('SBP_MERCHANT_ID', '')
    api_key = os.environ.get('SBP_API_KEY', '')
    secret_key = os.environ.get('SBP_SECRET_KEY', '')
    
    if not all([merchant_id, api_key, secret_key]):
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'error': 'SBP credentials not configured',
                'message': 'Пожалуйста, настройте ключи СБП в настройках проекта'
            })
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        payment_req = PaymentRequest(**body_data)
        
        payment_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        signature_string = f"{merchant_id}{payment_id}{payment_req.amount}{timestamp}"
        signature = hmac.new(
            secret_key.encode(),
            signature_string.encode(),
            hashlib.sha256
        ).hexdigest()
        
        payment_data = {
            'payment_id': payment_id,
            'amount': payment_req.amount,
            'currency': 'RUB',
            'description': payment_req.description,
            'plan_name': payment_req.plan_name,
            'customer_phone': payment_req.customer_phone,
            'merchant_id': merchant_id,
            'timestamp': timestamp,
            'signature': signature,
            'payment_url': f'https://qr.nspk.ru/proxyapp?type=01&bank=100000000111&sum={payment_req.amount}&cur=RUB&crc=1234',
            'qr_data': f'https://qr.nspk.ru/{payment_id}',
            'status': 'pending',
            'expires_at': timestamp
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps(payment_data)
        }
    
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        payment_id = params.get('payment_id', '')
        
        if not payment_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'payment_id required'})
            }
        
        status_data = {
            'payment_id': payment_id,
            'status': 'pending',
            'amount': 0,
            'timestamp': datetime.now().isoformat()
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps(status_data)
        }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Method not allowed'})
    }
