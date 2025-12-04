#!/bin/bash

PROJECT_ID="test-project-$(date +%s)"
echo "Testing bulk sync for project: $PROJECT_ID"

curl -X POST http://localhost:9999/api/sync/files \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'"$PROJECT_ID"'",
    "projectName": "Test Project",
    "files": [
      {
        "path": "index.html",
        "content": "<html><body>Hello World</body></html>"
      },
      {
        "path": "styles.css",
        "content": "body { background: #f0f0f0; }"
      }
    ]
  }'

echo -e "\n\nChecking if project exists..."
curl http://localhost:9999/api/projects/$PROJECT_ID
