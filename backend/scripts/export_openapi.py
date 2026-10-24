"""Write the API's OpenAPI schema to stdout. The frontend generates its types from it.

Usage: uv run python scripts/export_openapi.py > ../frontend/openapi.json
"""

import json
import sys

from jobhunter.api.main import app

json.dump(app.openapi(), sys.stdout, indent=2, sort_keys=True)
sys.stdout.write("\n")
