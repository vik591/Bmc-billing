# BMC Billing Application - Complete Source Code

## 🎯 Project Overview
Premium billing application for **Bharti Mobile Collection** - A professional mobile accessories and repair shop billing system built with FastAPI, MongoDB, and React.

## 📦 What's Included
```
bmc-billing-app/
├── backend/                 # FastAPI Backend
│   ├── server.py           # Main API server with all endpoints
│   ├── seed.py             # Database seeding script
│   ├── requirements.txt    # Python dependencies
│   └── .env                # Backend environment variables
│
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── pages/         # All application pages
│   │   ├── components/    # Reusable components + UI components
│   │   ├── contexts/      # React contexts (Auth)
│   │   └── lib/           # API client and utilities
│   ├── public/            # Static assets
│   ├── package.json       # Node dependencies
│   ├── tailwind.config.js # Tailwind configuration
│   └── .env               # Frontend environment variables
│
└── design_guidelines.json  # Complete design system specs
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB (local or cloud)
- Yarn package manager

### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Update .env file with your MongoDB URL
# MONGO_URL="mongodb://localhost:27017"
# DB_NAME="bmc_billing"

# Seed database with sample data
python seed.py

# Start server
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
yarn install

# Update .env file with your backend URL
# REACT_APP_BACKEND_URL=http://localhost:8001

# Start development server
yarn start
```

The app will be available at `http://localhost:3000`

## 🔐 Default Login Credentials
```
Email: admin@bmc.com
Password: admin123
```

## 🎨 Features

### Core Functionality
- ✅ **JWT Authentication** - Secure login with role-based access
- ✅ **Product Billing** - Full invoice system with GST, discounts, multiple payment modes
- ✅ **Repair Billing** - Customer repair order tracking
- ✅ **Dashboard** - Real-time sales metrics and analytics
- ✅ **Inventory Management** - Stock tracking with low stock alerts
- ✅ **Customer Management** - Automatic customer database with history
- ✅ **EMI Tracking** - Installment payment tracking
- ✅ **Invoice Generation** - PDF export and WhatsApp sharing
- ✅ **Reports** - Daily/Weekly/Monthly sales reports with charts
- ✅ **Barcode Scanning** - Camera-based product scanning
- ✅ **User Management** - Admin and Staff roles

### Design
- Premium black + gold theme
- Fully responsive (mobile & desktop)
- Modern glassmorphism effects
- Custom fonts: Manrope (headings) + Inter (body)
- Tailwind CSS + Shadcn UI components

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/search?q=` - Search products

### Billing
- `POST /api/product-bills` - Create product invoice
- `GET /api/product-bills` - List all invoices
- `POST /api/repair-bills` - Create repair order
- `GET /api/repair-bills` - List repair orders

### Dashboard & Reports
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/reports/sales?period=` - Sales reports

### Other Endpoints
- Customer management
- EMI tracking
- Inventory purchases
- Shop settings

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database
- **PyMongo (Motor)** - Async MongoDB driver
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing

### Frontend
- **React 18** - UI framework
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **Axios** - HTTP client
- **React Hook Form + Zod** - Form validation
- **Recharts** - Charts and analytics
- **jsPDF + html2canvas** - PDF generation
- **@zxing/library** - Barcode scanning
- **Sonner** - Toast notifications

## 📱 Key Features Explained

### Product Billing
- Product search with auto-suggest
- Barcode scanning support
- Dynamic quantity and price adjustment
- GST calculation (0%, 5%, 12%, 18%)
- Discount (amount or percentage)
- Multiple payment modes (Cash, UPI, Card, EMI)
- Auto-generated invoice numbers

### Repair Billing
- Customer and device details
- IMEI tracking
- Problem description
- Advance payment and pending amount tracking
- Delivery status (Pending/Completed)

### Invoice System
- Professional invoice layout
- Shop logo and details
- PDF download
- Direct WhatsApp sharing
- Print support

### Inventory
- Add/edit/delete products
- Barcode support
- Purchase entry
- Low stock alerts with visual indicators
- Profit margin tracking

## 🔒 Security Features
- JWT token-based authentication
- Bcrypt password hashing
- Role-based access control (Admin/Staff)
- Protected API routes
- CORS configuration

## 📝 Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=bmc_billing
SECRET_KEY=your-secret-key-change-in-production
CORS_ORIGINS=*
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

## 🎯 Deployment

### Backend Deployment (Any Python hosting)
1. Update environment variables for production
2. Use a production WSGI server (Gunicorn)
3. Set up MongoDB cloud instance (MongoDB Atlas)
4. Configure proper CORS origins

### Frontend Deployment (Vercel/Netlify)
1. Update `REACT_APP_BACKEND_URL` to production backend URL
2. Build: `yarn build`
3. Deploy the `build` folder

## 📄 Database Collections
- `users` - User accounts (admin/staff)
- `products` - Product inventory
- `product_bills` - Sales invoices
- `repair_bills` - Repair orders
- `customers` - Customer database
- `emis` - EMI records
- `shop_settings` - Shop configuration
- `purchases` - Purchase history

## 🤝 Support
For any questions or issues, please refer to the code comments or contact support.

## 📜 License
Proprietary - Built for Bharti Mobile Collection

## 🎉 Built with Emergent AI
This application was built using Emergent AI - Professional-grade AI coding assistant.

---

**Version:** 1.0.0  
**Last Updated:** March 2026  
**Developer:** Emergent Labs
