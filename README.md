# Unified Geospatial Radiance Field Engine

A multi-scale 3D spatial web application that integrates CesiumJS with Gaussian Splat rendering concepts and Spatial RAG for contextual intelligence.

## Architecture & Deployment

This project uses a separated frontend and backend architecture:
- **Frontend**: Vite + CesiumJS (Deploy to Vercel)
- **Backend**: FastAPI + asyncpg + OpenAI (Deploy to Render.com)
- **Database**: Supabase PostGIS + pgvector
- **Cache**: Upstash Redis (REST API)

### Important Note on Render.com Free Tier
The backend is deployed to Render's free web service tier. **It will sleep after 15 minutes of inactivity.** The first request after sleep may take up to 30 seconds (cold start). This is expected behavior for development.

## Setup Instructions

### 1. Database Setup
1. Create a Supabase project.
2. Go to the **SQL Editor** in the Supabase Dashboard.
3. Open `backend/db/schema.sql` and run it exactly once. This will enable PostGIS/pgvector, create tables, and insert test data.
4. Get your Connection String (URI mode) from Settings > Database and set it as `DATABASE_URL` in your `.env`.

### 2. Cache Setup
1. Create an Upstash Redis database.
2. Go to the REST API tab to get your URL and Token.
3. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in your `.env`.

### 3. Running Locally
Make sure you copy `.env.example` to `.env` in both the root (for backend) and `frontend/` directories, and fill in the values.

**Terminal 1: Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 10000 --reload
```

**Terminal 2: Frontend**
```bash
cd frontend
npm install
npm run dev
```

## Repository Structure

- `frontend/`: Vite application with Cesium compositing placeholder logic.
- `backend/`: FastAPI service managing RAG queries and splat metadata.
- `processing/`: Placeholder offline scripts for future Drone data pipelines via Colab.
