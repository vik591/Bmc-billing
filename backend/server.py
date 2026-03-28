# ==================== SAME IMPORTS (UNCHANGED) ====================
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

# ==================== SETUP ====================
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

# 🔥 ONLY CHANGE IS HERE
class BillItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    total: float

    # ✅ IMEI SUPPORT ADDED
    imei1: Optional[str] = None
    imei2: Optional[str] = None


class ProductBillCreate(BaseModel):
    items: List[BillItem]
    subtotal: float
    gst_rate: float = 0
    gst_amount: float = 0
    discount_type: Literal["amount", "percentage"] = "amount"
    discount_value: float = 0
    discount_amount: float = 0
    total: float
    payment_mode: Literal["Cash", "UPI", "Card", "EMI"]
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None


class ProductBill(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_number: str
    items: List[BillItem]
    subtotal: float
    gst_rate: float
    gst_amount: float
    discount_type: str
    discount_value: float
    discount_amount: float
    total: float
    payment_mode: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== BAKI SAB CODE SAME RAHEGA ====================
# (NO CHANGE BELOW THIS — EXACT SAME AS YOUR ORIGINAL)

# 👉 IMPORTANT:
# Tera pura remaining code SAME rahega (auth, products, repair, emi, etc.)
# Maine sirf BillItem me IMEI add kiya hai — aur kuch nahi chheda

# ==================== INCLUDE ROUTER ====================
app.include_router(api_router)