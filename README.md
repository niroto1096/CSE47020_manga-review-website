# niroto1096-CSE470_sec-20_manga-review-website

## This repository contains a full-stack manga review website with separate frontend and backend applications.

## Frontend (client)
* Framework: React (with Vite for fast development)
* Styling: Tailwind CSS, shadcn/ui components
* Routing: React Router
* HTTP Requests: Axios
* State Management: React Context API
* Other Libraries: Radix UI, lucide-react, react-day-picker, react-slick
* Backend (server)
* Framework: Express.js
* Database: MongoDB (via Mongoose)
* Authentication: JWT, cookies
* File Uploads: Multer
* Email: Nodemailer (for OTP verification)
* Environment Variables: dotenv




## Backend (server)
* Framework: Express.js
* Database: MongoDB (via Mongoose)
* Authentication: JWT, cookies
* File Uploads: Multer
* Email: Nodemailer (for OTP verification)
* Environment Variables: dotenv



## How to Run the Project
# Prerequisites
* Node.js and npm installed
* MongoDB running locally (or update .env with your remote URI)


# Backend Setup
* Navigate to the server folder:
```
cd server
```

* Install dependencies:
```
npm install
```

* Configure environment variables in .env

* Start the backend server:
```
npm start
```


# Frontend Setup
* Open a new terminal and navigate to the client folder:
```
cd client
```

* Install dependencies:
```
npm install
```

* Start the frontend development server:
```
npm run dev
```

* The frontend runs on http://localhost:5173.