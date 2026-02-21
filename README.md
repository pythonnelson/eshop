# E-Shop

A full-stack e-commerce platform with multi-vendor support, admin dashboard, customer ordering, and Stripe payments.

## Tech Stack

- **Backend:** Django 5.2, Django REST Framework, JWT auth, Stripe, SQLite
- **Frontend:** React 19, Material UI, React Router, Stripe Elements

## Features

- **Customers:** Browse products, add to cart, checkout with Stripe, track orders, rate delivered products
- **Vendors:** Manage products, view sales, update inventory
- **Admins:** Approve products, toggle active/featured, manage orders
- **Product ratings:** Customers rate orders after delivery; top-rated products are auto-marked as featured

## Project Structure

```
eshop/
├── backend/          # Django REST API
│   ├── api/          # Project settings, URLs
│   ├── admin_panel/  # Admin product approval
│   ├── authentication/
│   ├── notifications/
│   ├── orders/       # Cart, orders, Stripe
│   ├── products/
│   ├── vendors/
│   └── manage.py
├── frontend/         # React SPA
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       └── api/
└── README.md
```

## Setup

### Backend

1. Create and activate a virtual environment:

   ```bash
   cd backend
   python -m venv env
   source env/bin/activate   # Windows: env\Scripts\activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Copy `.env.example` to `.env` (or create `.env`) and configure:

   ```env
   SECRET_KEY=your-django-secret-key
   DEBUG=True
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

4. Run migrations and start the server:

   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

   API: http://localhost:8000/api/

### Frontend

1. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Create `.env` with:

   ```env
   REACT_APP_API_URL=http://localhost:8000/api
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

3. Start the dev server:

   ```bash
   npm start
   ```

   App: http://localhost:3000

## Stripe

- Use test keys for development. Create keys at [Stripe Dashboard → API keys](https://dashboard.stripe.com/test/apikeys).
- Backend: set `STRIPE_SECRET_KEY` (sk_test_...)
- Frontend: set `REACT_APP_STRIPE_PUBLISHABLE_KEY` (pk_test_...)

## License

MIT
