## Development Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env    # fill in your values
uvicorn main:app --reload --port 10000
```

### Frontend
```bash
cd frontend
npm install
cp ../.env.example .env.local  # fill in VITE_ prefixed vars
npm run dev
```

### Running Tests
```bash
cd backend
pytest tests/ -v
```

## Code Standards
- Python: follow PEP8, use type hints on all function signatures
- JavaScript: ES modules, no var (use const/let), async/await over .then()
- Never commit API keys — use environment variables only
- All new splat datasets: add a row to Supabase `splats` table + matching
  `spatial_docs` rows — no code changes required

## Adding a New Splat Location
1. Export your `.spz` or `.ksplat` file from Nerfstudio/COLMAP
2. Upload to Cloudflare R2 bucket `splats/`
3. Insert a row into `splats` table with correct ECEF centroid and bbox
4. Insert matching rows into `spatial_docs` with descriptive text
5. The app will automatically discover and render it — no frontend changes needed
