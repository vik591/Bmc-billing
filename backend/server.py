# ==================== IMPORTS ====================
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
from pathlib import Path
import uuid

# ==================== INIT ====================
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

SECRET_KEY = os.environ.get("SECRET_KEY", "secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

@app.get("/")
def root():
    return {"status": "running"}

# ==================== MODELS ====================

class User(BaseModel):
    id: str
    email: str
    name: str
    role: str

class BillItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    total: float

    # 🔥 IMEI ADDED
    imei1: Optional[str] = None
    imei2: Optional[str] = None


class ProductBillCreate(BaseModel):
    items: List[BillItem]
    subtotal: float
    gst_rate: float = 0
    gst_amount: float = 0
    discount_type: str = "amount"
    discount_value: float = 0
    discount_amount: float = 0
    total: float
    payment_mode: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None


class ProductBill(ProductBillCreate):
    id: str
    invoice_number: str
    created_by: str
    created_at: datetime


# ==================== AUTH ====================

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return User(id="demo", email="demo", name="demo", role="admin")

# ==================== ROUTES ====================

@api_router.post("/product-bills")
async def create_bill(data: ProductBillCreate, user: User = Depends(get_current_user)):
    invoice = f"INV-{str(uuid.uuid4())[:6]}"
    bill = {
        "id": str(uuid.uuid4()),
        "invoice_number": invoice,
        "created_by": user.id,
        "created_at": datetime.now(timezone.utc),
        **data.model_dump()
    }
    await db.product_bills.insert_one(bill)
    return bill


@api_router.get("/product-bills/{bill_id}")
async def get_bill(bill_id: str, user: User = Depends(get_current_user)):
    bill = await db.product_bills.find_one({"id": bill_id}, {"_id": 0})
    if not bill:
        raise HTTPException(status_code=404)
    return bill


@api_router.get("/customers/{phone}/history")
async def get_customer_history(phone: str, user: User = Depends(get_current_user)):
    product_bills = await db.product_bills.find({"customer_phone": phone}, {"_id": 0}).to_list(100)
    repair_bills = await db.repair_bills.find({"customer_phone": phone}, {"_id": 0}).to_list(100)

    for bill in product_bills:
        if isinstance(bill.get('created_at'), str):
            bill['created_at'] = datetime.fromisoformat(bill['created_at'])

    for bill in repair_bills:
        if isinstance(bill.get('created_at'), str):
            bill['created_at'] = datetime.fromisoformat(bill['created_at'])
        if isinstance(bill.get('updated_at'), str):
            bill