"""Shared Cloudflare Workers AI client. The endpoint is OpenAI-compatible, so
callers use the standard chat.completions API unchanged. Returns None when creds
are absent, letting every caller degrade gracefully instead of failing the run.
"""

import os

from openai import OpenAI


def client() -> OpenAI | None:
    account = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    token = os.environ.get("CLOUDFLARE_WORKERS_AI_KEEPUP")
    if not (account and token):
        return None
    return OpenAI(
        base_url=f"https://api.cloudflare.com/client/v4/accounts/{account}/ai/v1",
        api_key=token,
    )
