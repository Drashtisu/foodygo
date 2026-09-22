# FoodyGo - Food Delivery Platform

Full-stack food delivery application with a React (Vite) frontend and an Event-Driven Microservices backend built with Node.js, Express, MongoDB, and Apache Kafka.



### 1. Backend Setup
```bash
cd backend
npm install



# Start all microservices:
cd  backend
npm run dev
```
The API Gateway main  api  will be : `http://localhost:8000`

### 2. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```





1. Go to [Render.com](https://render.com) and create a **New Web Service**.
2. Connect your GitHub repository.
3. Configure the following settings:
    Name: `foodygo-backend`
    Root Directory: `backend`
    Runtime: `Node`
    Build Command: `npm install`
    Start Command: `npm start`
4. Add Environment Variables in Render all services  port  and  jwt   and mongo URI:
    `MONGO_URI`: 
    `JWT_SECRET`: 
    `PORT`: `8000` 
    `AUTH_SERVICE_PORT`: `8001`
    `RESTAURANT_SERVICE_PORT`: `8002`
    `ORDER_SERVICE_PORT`: `8003`
    `PAYMENT_SERVICE_PORT`: `8004`
    `DELIVERY_SERVICE_PORT`: `8005`
    `NOTIFICATION_SERVICE_PORT`: `8006`
    `SUPPORT_SERVICE_PORT`: `8007`
5. Click Deploy Web Service.
6. Once deployed, you  gettuing  your backend render  url ,copy your Render URL  add  paste  in the  frontend    VITE_API_BASE_URL -  this env 



##  Deploying Frontend on Vercel

1. Go to [Vercel.com](https://vercel.com) and click Add New > Project.
2. Import your GitHub repository.
3. In the project configuration:
    Root Directory: Click Edit and select `frontend`.
    Framework Preset: `Vite`
    Build Command: `npm run build`
    Output Directory: `dist`
4. Expand Environment Variables and add:
    Name: `VITE_API_BASE_URL`
    Value: `https://foodygo-backend.onrender.com/api/v1` *(replace with your actual Render backend URL)*
5. Click Deploy.


