"""The single HTTP transport: every fetch goes through the markfetch CLI.

markfetch owns the wire — Chrome fingerprint, HTTP/1.1 (which slips the
Cloudflare HTTP/2 fingerprint check), redirects, timeouts. keepup only parses.
`--raw` returns the response body verbatim, bypassing markfetch's Readability
extraction and content-type gate, so any content type comes back as-is for a
keepup-side parser.
"""

import re
import subprocess

_TIMEOUT = 90  # a slow page must not stall the weekly run


def fetch_raw(url: str) -> str:
    """Return the raw response body for `url`, or raise on fetch failure.

    markfetch prints the body on stdout and `[code] message` on stderr with a
    non-zero exit. We surface the bare code (e.g. `http_error`, `timeout`) so a
    failed source's footnote reads in markfetch's own vocabulary.
    """
    try:
        result = subprocess.run(
            ["markfetch", "--raw", url], capture_output=True, text=True, timeout=_TIMEOUT
        )
    except subprocess.TimeoutExpired:
        raise RuntimeError("timeout") from None
    except FileNotFoundError:
        raise RuntimeError("markfetch not installed") from None
    if result.returncode != 0:
        stderr = result.stderr.strip()
        code = re.match(r"\[(\w+)\]", stderr)
        raise RuntimeError(code.group(1) if code else stderr or f"exit {result.returncode}")
    return result.stdout
