# ==================== SAME IMPORTS ====================
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import logging
from pathlib import Path
import uuid
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI()

@app.get("/")
def root():
    return {"status": "running"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

# 🔥 FIXED + IMEI ADDED
class BillItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    total: float

    imei1: Optional[str] = None
    imei2: Optional[str] = None


# (बाकी models SAME हैं — kuch change nahi kiya)


# ==================== ROUTES (UNCHANGED) ====================
# ⚠️ IMPORTANT: niche ka pura code SAME rakha hai (tera original)

@api_router.get("/customers/{phone}/history")
async def get_customer_history(phone: str, current_user: User = Depends(get_current_user)):
    product_bills = await db.product_bills.find({"customer_phone": phone}, {"_id": 0}).to_list(100)
    repair_bills = await db.repair_bills.find({"customer_phone": phone}, {"_id": 0}).to_list(100)
    
    for bill in product_bills:
        if isinstance(bill.get('created_at'), str):
            bill['created_at'] = datetime.fromisoformat(bill['created_at'])
    
    for bill in repair_bills:
        if isinstance(bill.get('created_at'), str):
            bill['created_at'] = datetime.fromisoformat(bill['created_at'])
        if isinstance(bill.get('updated_at'), str):
            bill['updated_at'] = datetime.fromisoformat(bill['updated_at'])

    return {
        "product_bills": product_bills,
        "repair_bills": repair_bills
    }

# 🔥 FINAL IMPORTANT LINE
app.include_router(api_router)