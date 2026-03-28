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

ROOT_DIR = Path(file).parent
load_dotenv(ROOT_DIR / '.env')

MongoDB connection

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT Configuration

SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI()

@app.get("/")
def root():
return {"status": "running"}

app.add_middleware(
CORSMiddleware,
allow_origins=[""],
allow_credentials=True,
allow_methods=[""],
allow_headers=["*"],
)
api_router = APIRouter(prefix="/api")

==================== MODELS ====================

User Models

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

Product Models

class ProductCreate(BaseModel):
name: str
category: str  # Mobile, Cover, Tempered Glass, Charger, Earphones, etc.
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

Product Bill Models

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

Repair Bill Models

class RepairBillCreate(BaseModel):
customer_name: str
customer_phone: str
device_model: str
imei_number: Optional[str] = None
problem_description: str
repair_charges: float
advance_paid: float = 0
delivery_status: Literal["Pending", "Completed"] = "Pending"

class RepairBill(BaseModel):
model_config = ConfigDict(extra="ignore")
id: str = Field(default_factory=lambda: str(uuid.uuid4()))
invoice_number: str
customer_name: str
customer_phone: str
device_model: str
imei_number: Optional[str] = None
problem_description: str
repair_charges: float
advance_paid: float
pending_amount: float
delivery_status: str
created_by: str
created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

Customer Models

class Customer(BaseModel):
model_config = ConfigDict(extra="ignore")
id: str = Field(default_factory=lambda: str(uuid.uuid4()))
name: str
phone: str
email: Optional[str] = None
total_purchases: float = 0
last_visit: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

EMI Models

class EMICreate(BaseModel):
customer_name: str
customer_phone: str
product_bill_id: Optional[str] = None
total_amount: float
down_payment: float
installment_amount: float
total_installments: int
paid_installments: int = 0

class EMI(BaseModel):
model_config = ConfigDict(extra="ignore")
id: str = Field(default_factory=lambda: str(uuid.uuid4()))
customer_name: str
customer_phone: str
product_bill_id: Optional[str] = None
total_amount: float
down_payment: float
installment_amount: float
total_installments: int
paid_installments: int
pending_amount: float
next_due_date: Optional[datetime] = None
created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EMIPayment(BaseModel):
emi_id: str
amount: float

Shop Settings Models

class ShopSettingsUpdate(BaseModel):
shop_name: Optional[str] = None
contact_number: Optional[str] = None
address: Optional[str] = None
gst_number: Optional[str] = None
upi_id: Optional[str] = None
logo_base64: Optional[str] = None

class ShopSettings(BaseModel):
model_config = ConfigDict(extra="ignore")
id: str = "shop_settings"
shop_name: str = "Bharti Mobile Collection"
contact_number: str = "8982132343"
address: str = "Your Shop Address"
gst_number: Optional[str] = None
upi_id: Optional[str] = None
logo_base64: Optional[str] = None
updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

Purchase Entry Models

class PurchaseCreate(BaseModel):
product_id: str
quantity: int
cost_price: float
supplier_name: Optional[str] = None

class Purchase(BaseModel):
model_config = ConfigDict(extra="ignore")
id: str = Field(default_factory=lambda: str(uuid.uuid4()))
product_id: str
product_name: str
quantity: int
cost_price: float
total_cost: float
supplier_name: Optional[str] = None
created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

Dashboard Stats Model

class DashboardStats(BaseModel):
today_sales: float
monthly_sales: float
total_products_sold: int
pending_payments: float
repair_orders_in_progress: int
low_stock_products: int

==================== AUTH HELPERS ====================

def verify_password(plain_password, hashed_password):
return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
return pwd_context.hash(password)

def create_access_token(data: dict):
to_encode = data.copy()
expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
to_encode.update({"exp": expire})
encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
return encoded_jwt

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
  
if isinstance(user_doc.get('created_at'), str):  
    user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])  
  
return User(**user_doc)

==================== ROUTES ====================

@api_router.get("/")
async def root():
return {"message": "Bharti Mobile Collection API"}

Auth Routes

@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
existing_user = await db.users.find_one({"email": user_data.email})
if existing_user:
raise HTTPException(status_code=400, detail="Email already registered")

hashed_password = get_password_hash(user_data.password)  
user = User(  
    email=user_data.email,  
    name=user_data.name,  
    role=user_data.role  
)  
  
user_dict = user.model_dump()  
user_dict['created_at'] = user_dict['created_at'].isoformat()  
user_dict['hashed_password'] = hashed_password  
  
await db.users.insert_one(user_dict)  
return user

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
if not user_doc or not verify_password(credentials.password, user_doc['hashed_password']):
raise HTTPException(status_code=401, detail="Incorrect email or password")

if isinstance(user_doc.get('created_at'), str):  
    user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])  
  
user = User(**{k: v for k, v in user_doc.items() if k != 'hashed_password'})  
access_token = create_access_token(data={"sub": user.id})  
  
return Token(access_token=access_token, token_type="bearer", user=user)

Product Routes

@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate, current_user: User = Depends(get_current_user)):
product_obj = Product(**product.model_dump())
product_dict = product_obj.model_dump()
product_dict['created_at'] = product_dict['created_at'].isoformat()
await db.products.insert_one(product_dict)
return product_obj

@api_router.get("/products", response_model=List[Product])
async def get_products(current_user: User = Depends(get_current_user)):
products = await db.products.find({}, {"_id": 0}).to_list(1000)
for product in products:
if isinstance(product.get('created_at'), str):
product['created_at'] = datetime.fromisoformat(product['created_at'])
return products

@api_router.get("/products/low-stock", response_model=List[Product])
async def get_low_stock_products(current_user: User = Depends(get_current_user)):
products = await db.products.find({}, {"_id": 0}).to_list(1000)
low_stock = [p for p in products if p['stock'] <= p['low_stock_threshold']]
for product in low_stock:
if isinstance(product.get('created_at'), str):
product['created_at'] = datetime.fromisoformat(product['created_at'])
return low_stock

@api_router.get("/products/search")
async def search_products(q: str, current_user: User = Depends(get_current_user)):
products = await db.products.find(
{"$or": [
{"name": {"$regex": q, "$options": "i"}},
{"category": {"$regex": q, "$options": "i"}},
{"barcode": q}
]},
{"_id": 0}
).to_list(20)
for product in products:
if isinstance(product.get('created_at'), str):
product['created_at'] = datetime.fromisoformat(product['created_at'])
return products

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_update: ProductCreate, current_user: User = Depends(get_current_user)):
update_dict = product_update.model_dump()
result = await db.products.update_one({"id": product_id}, {"$set": update_dict})
if result.matched_count == 0:
raise HTTPException(status_code=404, detail="Product not found")

updated_product = await db.products.find_one({"id": product_id}, {"_id": 0})  
if isinstance(updated_product.get('created_at'), str):  
    updated_product['created_at'] = datetime.fromisoformat(updated_product['created_at'])  
return Product(**updated_product)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: User = Depends(get_current_user)):
result = await db.products.delete_one({"id": product_id})
if result.deleted_count == 0:
raise HTTPException(status_code=404, detail="Product not found")
return {"message": "Product deleted successfully"}

Product Bills Routes

@api_router.post("/product-bills", response_model=ProductBill)
async def create_product_bill(bill_data: ProductBillCreate, current_user: User = Depends(get_current_user)):
# Generate invoice number
count = await db.product_bills.count_documents({})
invoice_number = f"INV-{count + 1:06d}"

bill = ProductBill(  
    invoice_number=invoice_number,  
    created_by=current_user.id,  
    **bill_data.model_dump()  
)  
  
# Update product stock  
for item in bill_data.items:  
    await db.products.update_one(  
        {"id": item.product_id},  
        {"$inc": {"stock": -item.quantity}}  
    )  
  
# Update/Create customer  
if bill_data.customer_phone:  
    customer_doc = await db.customers.find_one({"phone": bill_data.customer_phone})  
    if customer_doc:  
        await db.customers.update_one(  
            {"phone": bill_data.customer_phone},  
            {  
                "$set": {"last_visit": datetime.now(timezone.utc).isoformat(), "name": bill_data.customer_name or customer_doc.get('name', '')},  
                "$inc": {"total_purchases": bill_data.total}  
            }  
        )  
    else:  
        customer = Customer(  
            name=bill_data.customer_name or "",  
            phone=bill_data.customer_phone,  
            total_purchases=bill_data.total  
        )  
        customer_dict = customer.model_dump()  
        customer_dict['last_visit'] = customer_dict['last_visit'].isoformat()  
        await db.customers.insert_one(customer_dict)  
  
bill_dict = bill.model_dump()  
bill_dict['created_at'] = bill_dict['created_at'].isoformat()  
await db.product_bills.insert_one(bill_dict)  
return bill

@api_router.get("/product-bills", response_model=List[ProductBill])
async def get_product_bills(current_user: User = Depends(get_current_user)):
bills = await db.product_bills.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
for bill in bills:
if isinstance(bill.get('created_at'), str):
bill['created_at'] = datetime.fromisoformat(bill['created_at'])
return bills

@api_router.get("/product-bills/{bill_id}", response_model=ProductBill)
async def get_product_bill(bill_id: str, current_user: User = Depends(get_current_user)):
bill = await db.product_bills.find_one({"id": bill_id}, {"_id": 0})
if not bill:
raise HTTPException(status_code=404, detail="Bill not found")
if isinstance(bill.get('created_at'), str):
bill['created_at'] = datetime.fromisoformat(bill['created_at'])
return ProductBill(**bill)

Repair Bills Routes

@api_router.post("/repair-bills", response_model=RepairBill)
async def create_repair_bill(bill_data: RepairBillCreate, current_user: User = Depends(get_current_user)):
count = await db.repair_bills.count_documents({})
invoice_number = f"REP-{count + 1:06d}"

pending_amount = bill_data.repair_charges - bill_data.advance_paid  
  
bill = RepairBill(  
    invoice_number=invoice_number,  
    created_by=current_user.id,  
    pending_amount=pending_amount,  
    **bill_data.model_dump()  
)  
  
# Update/Create customer  
customer_doc = await db.customers.find_one({"phone": bill_data.customer_phone})  
if customer_doc:  
    await db.customers.update_one(  
        {"phone": bill_data.customer_phone},  
        {"$set": {"last_visit": datetime.now(timezone.utc).isoformat(), "name": bill_data.customer_name}}  
    )  
else:  
    customer = Customer(name=bill_data.customer_name, phone=bill_data.customer_phone)  
    customer_dict = customer.model_dump()  
    customer_dict['last_visit'] = customer_dict['last_visit'].isoformat()  
    await db.customers.insert_one(customer_dict)  
  
bill_dict = bill.model_dump()  
bill_dict['created_at'] = bill_dict['created_at'].isoformat()  
bill_dict['updated_at'] = bill_dict['updated_at'].isoformat()  
await db.repair_bills.insert_one(bill_dict)  
return bill

@api_router.get("/repair-bills", response_model=List[RepairBill])
async def get_repair_bills(current_user: User = Depends(get_current_user)):
bills = await db.repair_bills.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
for bill in bills:
if isinstance(bill.get('created_at'), str):
bill['created_at'] = datetime.fromisoformat(bill['created_at'])
if isinstance(bill.get('updated_at'), str):
bill['updated_at'] = datetime.fromisoformat(bill['updated_at'])
return bills

@api_router.put("/repair-bills/{bill_id}/status")
async def update_repair_status(bill_id: str, delivery_status: str, current_user: User = Depends(get_current_user)):
result = await db.repair_bills.update_one(
{"id": bill_id},
{"$set": {"delivery_status": delivery_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
)
if result.matched_count == 0:
raise HTTPException(status_code=404, detail="Repair bill not found")
return {"message": "Status updated successfully"}

@api_router.put("/repair-bills/{bill_id}/payment")
async def add_repair_payment(bill_id: str, payment_amount: float, current_user: User = Depends(get_current_user)):
bill = await db.repair_bills.find_one({"id": bill_id}, {"_id": 0})
if not bill:
raise HTTPException(status_code=404, detail="Repair bill not found")

new_advance = bill['advance_paid'] + payment_amount  
new_pending = bill['repair_charges'] - new_advance  
  
await db.repair_bills.update_one(  
    {"id": bill_id},  
    {"$set": {"advance_paid": new_advance, "pending_amount": new_pending, "updated_at": datetime.now(timezone.utc).isoformat()}}  
)  
return {"message": "Payment added successfully"}

Customer Routes

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(current_user: User = Depends(get_current_user)):
customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
for customer in customers:
if isinstance(customer.get('last_visit'), str):
customer['last_visit'] = datetime.fromisoformat(customer['last_visit'])
return customers

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
    if isinstance