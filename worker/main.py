"""
Video Worker Daemon
Continuously polls Supabase video_render_jobs for queued tasks and executes the video repurposing pipeline.
System Layer: worker / main
"""

import time
import sys
import argparse
from config import get_supabase_client
from pipeline import run_job_pipeline

def poll_and_process_jobs(run_once: bool = False):
    """
    Main polling daemon loop for processing queued video render jobs.
    """
    supabase = get_supabase_client()
    print("[worker] Video Repurposing Worker started.")
    print("[worker] Polling Supabase 'video_render_jobs' for status='queued'...")

    while True:
        try:
            # Poll for 1 queued job
            res = (
                supabase.table("video_render_jobs")
                .select("*")
                .eq("status", "queued")
                .order("created_at", desc=False)
                .limit(1)
                .execute()
            )

            jobs = res.data or []

            if not jobs:
                if run_once:
                    print("[worker] No queued jobs found (--once specified). Exiting.")
                    break
                time.sleep(5)
                continue

            job = jobs[0]
            job_id = job["id"]
            print(f"\n[worker] Found queued job {job_id} (article={job['article_id']}). Starting processing...")

            def update_progress(status: str, progress_pct: int, stage: str, error_message: str = None):
                update_payload = {
                    "status": status,
                    "progress_pct": progress_pct,
                    "stage_message": stage,
                    "updated_at": "now()",
                }
                if error_message:
                    update_payload["error_message"] = error_message
                supabase.table("video_render_jobs").update(update_payload).eq("id", job_id).execute()

            try:
                update_progress("transcribing", 10, "Starting video download...")
                run_job_pipeline(job, on_progress=update_progress)
                print(f"[worker] Successfully completed job {job_id}.")
            except Exception as job_err:
                print(f"[worker] Error processing job {job_id}: {job_err}", file=sys.stderr)
                update_progress("failed", 0, "Video render failed.", error_message=str(job_err))

            if run_once:
                break

        except KeyboardInterrupt:
            print("\n[worker] Worker shutting down gracefully.")
            break
        except Exception as poll_err:
            print(f"[worker] Polling error: {poll_err}. Retrying in 10s...", file=sys.stderr)
            time.sleep(10)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RepurposeApp Background Video Worker")
    parser.add_argument("--once", action="store_true", help="Process at most one job and exit")
    args = parser.parse_args()

    poll_and_process_jobs(run_once=args.once)

