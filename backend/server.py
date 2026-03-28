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

# ==================== ENV ====================
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

SECRET_KEY = os.environ.get("SECRET_KEY", "secret")
ALGORITHM = "HS256"

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

    # 🔥 IMEI SUPPORT
    imei1: Optional[str] = None
    imei2: Optional[str] = None

class Product(BaseModel):
    id: str
    name: str
    category: str
    price: float
    stock: int

class ProductBillCreate(BaseModel):
    items: List[BillItem]
    subtotal: float
    gst_rate: float
    gst_amount: float
    discount_type: str
    discount_value: float
    discount_amount: float
    total: float
    payment_mode: str
    customer_name: Optional[str]
    customer_phone: Optional[str]

# ==================== AUTH ====================

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return {"id": "test-user"}

# ==================== ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "API Running"}

# ==================== PRODUCTS ====================

@api_router.get("/products")
async def get_products(current_user: dict = Depends(get_current_user)):
    return await db.products.find({}, {"_id": 0}).to_list(1000)

@api_router.post("/products")
async def create_product(product: dict, current_user: dict = Depends(get_current_user)):
    product["id"] = str(uuid.uuid4())
    await db.products.insert_one(product)
    return product

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    await db.products.update_one({"id": product_id}, {"$set": data})
    return {"msg": "updated"}

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    await db.products.delete_one({"id": product_id})
    return {"msg": "deleted"}

# ==================== BILL ====================

@api_router.post("/product-bills")
async def create_bill(data: ProductBillCreate, current_user: dict = Depends(get_current_user)):
    
    bill = data.model_dump()
    bill["id"] = str(uuid.uuid4())
    bill["invoice_number"] = f"INV-{str(uuid.uuid4())[:6]}"
    bill["created_at"] = datetime.now(timezone.utc).isoformat()

    await db.product_bills.insert_one(bill)

    return bill

@api_router.get("/product-bills")
async def get_bills(current_user: dict = Depends(get_current_user)):
    return await db.product_bills.find({}, {"_id": 0}).to_list(100)

# ==================== CUSTOMERS ====================

@api_router.get("/customers")
async def get_customers(current_user: dict = Depends(get_current_user)):
    return await db.customers.find({}, {"_id": 0}).to_list(1000)

# ==================== DASHBOARD ====================

@api_router.get("/dashboard/stats")
async def dashboard(current_user: dict = Depends(get_current_user)):
    return {
        "today_sales": 0,
        "monthly_sales": 0,
        "total_products_sold": 0,
        "pending_payments": 0,
        "repair_orders_in_progress": 0,
        "low_stock_products": 0
    }

# ==================== FINAL ====================

app.include_router(api_router)