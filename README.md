# FoodyGo - Food Delivery Platform

Full-stack food delivery application with a React (Vite) frontend and an Event-Driven Microservices backend built with Node.js, Express, MongoDB, and Apache Kafka.

---

## 📁 Repository Structure

```
foodfloods/
├── .gitignore              # Protects .env and node_modules from being pushed
├── README.md               # Deployment and setup instructions
├── frontend/               # React + Vite Frontend (Deploy to Vercel)
│   ├── src/
│   ├── public/
│   ├── vercel.json         # SPA routing rewrites for Vercel
│   ├── .env.example
│   └── package.json
└── backend/                # Microservices Backend (Deploy to Render)
    ├── services/           # Microservices (Gateway, Auth, Restaurant, Order, etc.)
    ├── models/             # Mongoose Models
    ├── shared/             # Shared DB & Kafka utilities
    ├── docker-compose.yml  # Kafka & Zookeeper setup
    ├── .env.example
    └── package.json
```

---

## 💻 Local Development Setup

### 1. Backend Setup
```bash
cd backend
npm install

# (Optional) Start Kafka & Zookeeper if using Docker:
npm run docker:kafka:up

# Start all microservices:
npm run dev
```
The API Gateway will be active at: `http://localhost:8000`

### 2. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The frontend will be active at: `http://localhost:5173`

---

## 🚀 How to Push to GitHub

1. Initialize Git in the project root:
   ```bash
   git init
   git add .
   git commit -m "feat: restructure into frontend and backend"
   ```
2. Create a new repository on [GitHub](https://github.com/new).
3. Connect your local repository and push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

*(Note: The root `.gitignore` automatically prevents your `.env` secrets and `node_modules` from being uploaded).*

---

## 🌐 Deploying Backend on Render

1. Go to [Render.com](https://render.com) and create a **New Web Service**.
2. Connect your GitHub repository.
3. Configure the following settings:
   * **Name:** `foodygo-backend`
   * **Root Directory:** `backend`
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
4. Add **Environment Variables** in Render settings:
   * `MONGO_URI`: *Your MongoDB Atlas connection string*
   * `JWT_SECRET`: *Your secure JWT secret key*
   * `PORT`: `8000` (Render will map this automatically)
   * `AUTH_SERVICE_PORT`: `8001`
   * `RESTAURANT_SERVICE_PORT`: `8002`
   * `ORDER_SERVICE_PORT`: `8003`
   * `PAYMENT_SERVICE_PORT`: `8004`
   * `DELIVERY_SERVICE_PORT`: `8005`
   * `NOTIFICATION_SERVICE_PORT`: `8006`
   * `SUPPORT_SERVICE_PORT`: `8007`
5. Click **Deploy Web Service**.
6. Once deployed, copy your Render URL (e.g., `https://foodygo-backend.onrender.com`).

---

## ⚡ Deploying Frontend on Vercel

1. Go to [Vercel.com](https://vercel.com) and click **Add New > Project**.
2. Import your GitHub repository.
3. In the project configuration:
   * **Root Directory:** Click *Edit* and select **`frontend`**.
   * **Framework Preset:** `Vite`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
4. Expand **Environment Variables** and add:
   * **Name:** `VITE_API_BASE_URL`
   * **Value:** `https://foodygo-backend.onrender.com/api/v1` *(replace with your actual Render backend URL)*
5. Click **Deploy**.

`frontend/vercel.json` ensures that all React Router pages (like `/restaurant/dashboard`, `/my-orders`, `/checkout`) route smoothly on page reload without 404 errors.
