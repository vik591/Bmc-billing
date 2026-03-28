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

SECRET_KEY = os.environ.get("SECRET_KEY", "secret")
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
    imei1: Optional[str] = None
    imei2: Optional[str] = None

class ProductBillCreate(BaseModel):
    items: List[BillItem]
    subtotal: float
    total: float
    payment_mode: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None

class ProductBill(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_number: str
    items: List[BillItem]
    subtotal: float
    total: float
    payment_mode: str
    customer_name: Optional[str]
    customer_phone: Optional[str]
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== AUTH ====================

def create_access_token(data: dict):
    to_encode = data.copy()
    to_encode.update({"exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return User(**user)

# ==================== ROUTES ====================

@api_router.get("/products")
async def get_products(current_user: User = Depends(get_current_user)):
    return await db.products.find({}, {"_id": 0}).to_list(1000)

@api_router.get("/customers")
async def get_customers(current_user: User = Depends(get_current_user)):
    return await db.customers.find({}, {"_id": 0}).to_list(1000)

@api_router.get("/dashboard/stats")
async def dashboard(current_user: User = Depends(get_current_user)):
    return {
        "today_sales": 0,
        "monthly_sales": 0,
        "total_products_sold": 0,
        "pending_payments": 0,
        "repair_orders_in_progress": 0,
        "low_stock_products": 0
    }

@api_router.post("/product-bills")
async def create_bill(bill: ProductBillCreate, current_user: User = Depends(get_current_user)):
    count = await db.product_bills.count_documents({})
    invoice = f"INV-{count+1:06d}"

    new_bill = ProductBill(
        invoice_number=invoice,
        created_by=current_user.id,
        **bill.model_dump()
    )

    await db.product_bills.insert_one(new_bill.model_dump())
    return new_bill

# ==================== FINAL ====================
app.include_router(api_router)