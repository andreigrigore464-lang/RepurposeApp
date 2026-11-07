"""
Configuration & Credentials Seam
Loads Supabase, Cloudflare R2, and Whisper device parameters from environment.
Supports .env.local file loading and Google Colab native Secrets (🔑 tab).
System Layer: worker / config
"""

import os
import boto3
from supabase import create_client, Client

def load_env_local():
    """Attempt to load local environment from .env.local if present."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    env_paths = [
        os.path.join(base_dir, ".env.local"),
        os.path.join(base_dir, "..", ".env.local"),
        ".env.local",
        "../.env.local",
        "/content/RepurposeApp/worker/.env.local",
    ]
    for path in env_paths:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        clean_k = k.strip()
                        clean_v = v.strip().strip('"').strip("'")
                        if clean_v:
                            os.environ[clean_k] = clean_v
            break

load_env_local()

def preload_cuda_libraries():
    """Forces loading of nvidia cublas and cudnn shared libraries into the process global symbol table."""
    import sys
    if not sys.platform.startswith("linux"):
        return

    import ctypes
    import glob

    try:
        import site
        dirs_to_check = []
        for p in site.getsitepackages():
            dirs_to_check.append(os.path.join(p, "nvidia", "cublas", "lib"))
            dirs_to_check.append(os.path.join(p, "nvidia", "cudnn", "lib"))

        dirs_to_check.extend(glob.glob("/usr/local/lib/python*/dist-packages/nvidia/cublas/lib"))
        dirs_to_check.extend(glob.glob("/usr/local/lib/python*/dist-packages/nvidia/cudnn/lib"))

        for lib_dir in dirs_to_check:
            if os.path.exists(lib_dir):
                cur_ld = os.environ.get("LD_LIBRARY_PATH", "")
                if lib_dir not in cur_ld:
                    os.environ["LD_LIBRARY_PATH"] = f"{lib_dir}:{cur_ld}"

                for so in sorted(glob.glob(os.path.join(lib_dir, "*.so*"))):
                    try:
                        ctypes.CDLL(so, mode=ctypes.RTLD_GLOBAL)
                    except Exception:
                        pass
    except Exception:
        pass

preload_cuda_libraries()

# Attempt to load from Google Colab Secrets (🔑 tab) if running inside Colab
try:
    from google.colab import userdata
    for colab_key in [
        "NEXT_PUBLIC_SUPABASE_URL",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "R2_ACCOUNT_ID",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_BUCKET_NAME",
        "GEMINI_API_KEY",
    ]:
        try:
            val = userdata.get(colab_key)
            if val:
                os.environ.setdefault(colab_key, val)
        except Exception:
            pass
except Exception:
    pass

# Supabase Credentials
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    or os.environ.get("SUPABASE_KEY")
)

# Cloudflare R2 Credentials
R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME", "repurpose-media")

# LLM Key (Gemini API for Auto-Hook extraction)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# Compute Device
try:
    import torch
    DEFAULT_DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    DEFAULT_COMPUTE_TYPE = "float16" if torch.cuda.is_available() else "int8"
except Exception:
    DEFAULT_DEVICE = "cpu"
    DEFAULT_COMPUTE_TYPE = "int8"

def get_supabase_client() -> Client:
    """Returns authenticated Supabase client."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def get_r2_client():
    """Returns boto3 S3 client configured for Cloudflare R2 endpoint."""
    if not R2_ACCOUNT_ID or not R2_ACCESS_KEY_ID or not R2_SECRET_ACCESS_KEY:
        raise ValueError("Missing Cloudflare R2 credentials (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY).")
    
    endpoint_url = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )
