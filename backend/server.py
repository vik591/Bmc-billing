from fastapi import FastAPI, APIRouter, HTTPException, Depends
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
from pathlib import Path
import uuid

# ================= CONFIG =================
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
api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= MODELS =================

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
    role: str
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

# ✅ IMEI FIXED HERE
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
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_number: str
    items: List[BillItem]
    subtotal: float
    total: float
    payment_mode: str
    customer_name: Optional[str]
    customer_phone: Optional[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str

# ================= AUTH =================

def verify_password(p, h):
    return pwd_context.verify(p, h)

def hash_password(p):
    return pwd_context.hash(p)

def create_token(data: dict):
    data.update({"exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

async def get_user(token: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user = await db.users.find_one({"id": payload.get("sub")}, {"_id": 0})
        return User(**user)
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

# ================= ROUTES =================

@app.get("/")
def root():
    return {"status": "running"}

@api_router.post("/auth/register", response_model=User)
async def register(u: UserCreate):
    if await db.users.find_one({"email": u.email}):
        raise HTTPException(400, "Email exists")
    user = User(email=u.email, name=u.name, role=u.role)
    data = user.model_dump()
    data["created_at"] = data["created_at"].isoformat()
    data["hashed_password"] = hash_password(u.password)
    await db.users.insert_one(data)
    return user

@api_router.post("/auth/login", response_model=Token)
async def login(u: UserLogin):
    user = await db.users.find_one({"email": u.email}, {"_id": 0})
    if not user or not verify_password(u.password, user["hashed_password"]):
        raise HTTPException(401, "Invalid login")
    user_obj = User(**{k: v for k, v in user.items() if k != "hashed_password"})
    token = create_token({"sub": user_obj.id})
    return Token(access_token=token, token_type="bearer", user=user_obj)

@api_router.post("/products")
async def add_product(p: ProductCreate, user: User = Depends(get_user)):
    prod =