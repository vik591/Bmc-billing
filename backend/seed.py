import asyncio
import sys
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path('/app/backend')
load_dotenv(ROOT_DIR / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_data():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]

    # Create admin user
    existing_admin = await db.users.find_one({"email": "admin@bmc.com"})
    if not existing_admin:
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": "admin@bmc.com",
            "name": "Admin User",
            "role": "admin",
            "hashed_password": pwd_context.hash("admin123"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        print("✓ Admin user created (email: admin@bmc.com, password: admin123)")
    else:
        print("✓ Admin user already exists")

    # Create sample products
    existing_products = await db.products.count_documents({})
    if existing_products == 0:
        sample_products = [
            {
                "id": str(uuid.uuid4()),
                "name": "iPhone 15 Pro",
                "category": "Mobile",
                "price": 129900,
                "cost_price": 115000,
                "stock": 5,
                "low_stock_threshold": 2,
                "barcode": "IP15PRO001",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Tempered Glass",
                "category": "Accessories",
                "price": 299,
                "cost_price": 150,
                "stock": 50,
                "low_stock_threshold": 10,
                "barcode": "TG001",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Phone Case",
                "category": "Accessories",
                "price": 499,
                "cost_price": 250,
                "stock": 30,
                "low_stock_threshold": 10,
                "barcode": "CASE001",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Fast Charger 20W",
                "category": "Charger",
                "price": 799,
                "cost_price": 450,
                "stock": 25,
                "low_stock_threshold": 5,
                "barcode": "CHG20W001",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Wireless Earbuds",
                "category": "Earphones",
                "price": 1999,
                "cost_price": 1200,
                "stock": 15,
                "low_stock_threshold": 5,
                "barcode": "EB001",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.products.insert_many(sample_products)
        print(f"✓ Created {len(sample_products)} sample products")
    else:
        print(f"✓ Products already exist ({existing_products} products)")

    # Create shop settings
    existing_settings = await db.shop_settings.find_one({"id": "shop_settings"})
    if not existing_settings:
        shop_settings = {
            "id": "shop_settings",
            "shop_name": "Bharti Mobile Collection",
            "contact_number": "8982132343",
            "address": "Main Market, Your City, State - 123456",
            "gst_number": "",
            "upi_id": "bmc@upi",
            "logo_base64": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.shop_settings.insert_one(shop_settings)
        print("✓ Shop settings created")
    else:
        print("✓ Shop settings already exist")

    client.close()
    print("\n✅ Database seeded successfully!")
    print("\n🔐 Login Credentials:")
    print("Email: admin@bmc.com")
    print("Password: admin123")

if __name__ == "__main__":
    asyncio.run(seed_data())
