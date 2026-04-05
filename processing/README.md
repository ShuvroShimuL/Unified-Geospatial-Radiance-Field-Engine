# Processing Pipeline — Offline, Run on Google Colab with GPU

These scripts run offline when processing real drone footage.
They are NOT part of the web application and do not deploy to Render/Vercel.

## Required Tools (install on Colab)
- COLMAP
- Nerfstudio
- ffmpeg (video → frames)
- Physical GCPs measured with RTK base station (minimum 5 per scene)

## Pipeline Steps
1. colmap_pipeline.sh  — SfM reconstruction + GCP ECEF alignment (RMSE < 5cm)
2. Nerfstudio gaussian-splatting training (run manually in Colab)
3. export_splat.py     — .ply → .spz → .ksplat + upload to Cloudflare R2
4. validate_quality.py — PSNR/SSIM gate (reject if PSNR < 28dB or SSIM < 0.88)

## Quality Gate Thresholds
| Metric | Minimum |
|--------|---------|
| PSNR   | 28 dB   |
| SSIM   | 0.88    |
| GCP alignment RMSE | 5 cm |

A companion Colab notebook will be provided when real drone data is available.