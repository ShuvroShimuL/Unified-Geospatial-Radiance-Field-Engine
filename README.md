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

## How It Works

### Gaussian Splatting
Gaussian Splatting represents a 3D scene as millions of tiny semi-transparent
ellipsoids (splats), each with a position, color, opacity, and shape. When you
zoom into a splat zone on the map, the viewer streams the `.ksplat` file and
renders these ellipsoids sorted by depth — producing photorealistic imagery
that looks like a real drone photo.

The splat renderer runs on an `OffscreenCanvas` with its own WebGL2 context,
then composites the output into the Cesium scene via a `PostProcessStage` with
log-to-linear depth conversion to ensure correct occlusion with 3D buildings.

### Spatial RAG
When you click anywhere on the map, the app:
1. Converts the screen click → world coordinates → WGS84 lat/lon
2. Queries Supabase PostGIS to find splat metadata within ~500m
3. Embeds your query using OpenAI `text-embedding-3-small` (1536-dim)
4. Runs a vector similarity search against `spatial_docs` via pgvector
5. Passes the retrieved context chunks to `gpt-4o-mini` via LangChain
6. Returns a context-aware response about what's at that location

### Coordinate Precision
All global positions are stored in ECEF (Earth-Centered Earth-Fixed) as
`float64`. Only a small residual (camera − splat center) is passed to the
GPU as `float32`, keeping errors below 1mm at any location on Earth.

## Demo
1. Open the app and wait for the fly-in animation to Dhaka
2. Type `23.7619, 90.4234` in the search bar — or click "📷 View Splat Demo"
3. Fly toward the cyan ring at Hatirjheel Lake
4. Watch the progress bar as the Gaussian Splat streams in (~30–60s on first load)
5. Click anywhere to query the Spatial RAG engine

## Testing
```bash
cd backend
pytest tests/ -v
```

## Repository Structure

- `frontend/`: Vite application with Cesium compositing placeholder logic.
- `backend/`: FastAPI service managing RAG queries and splat metadata.
- `processing/`: Placeholder offline scripts for future Drone data pipelines via Colab.
