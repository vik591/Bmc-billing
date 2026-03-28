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

# ==================== CONFIG ====================
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

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

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Literal["admin", "staff"] = "staff"


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    role: Literal["admin", "staff"]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: User


class ProductCreate(BaseModel):
    name: str
    category: str
    price: float
    cost_price: float = 0
    stock: int = 0
    low_stock_threshold: int = 5
    barcode: Optional[str] = None


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    price: float
    cost_price: float
    stock: int
    low_stock_threshold: int
    barcode: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# 🔥 FIXED PART
class BillItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    total: float
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


# ==================== AUTH ====================

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user_doc is None:
        raise HTTPException(status_code=401, detail="User not found")

    if isinstance(user_doc.get("created_at"), str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])

    return User(**user_doc)


# ==================== ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Bharti Mobile Collection API"}


@api_router.get("/products")
async def get_products(current_user: User = Depends(get_current_user)):
    return await db.products.find({}, {"_id": 0}).to_list(1000)


@api_router.get("/customers")
async def get_customers(current_user: User = Depends(get_current_user)):
    return await db.customers.find({}, {"_id": 0}).to_list(1000)


@api_router.post("/product-bills")
async def create_product_bill(bill_data: ProductBillCreate, current_user: User = Depends(get_current_user)):
    count = await db.product_bills.count_documents({})
    invoice_number = f"INV-{count + 1:06d}"

    bill = ProductBill(
        invoice_number=invoice_number,
        created_by=current_user.id,
        **bill_data.model_dump()
    )

    bill_dict = bill.model_dump()
    bill_dict["created_at"] = bill_dict["created_at"].isoformat()

    await db.product_bills.insert_one(bill_dict)
    return bill


# ==================== FINAL ====================
app.include_router(api_router)