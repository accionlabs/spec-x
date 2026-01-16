#!/bin/bash

# Wait for CouchDB to be ready
echo "Waiting for CouchDB to start..."
until curl -s http://localhost:5984/_up > /dev/null 2>&1; do
  sleep 1
done
echo "CouchDB is ready!"

COUCH_URL="http://admin:password@localhost:5984"

# Create system databases
echo "Creating system databases..."
curl -s -X PUT "$COUCH_URL/_users" > /dev/null
curl -s -X PUT "$COUCH_URL/_replicator" > /dev/null
curl -s -X PUT "$COUCH_URL/_global_changes" > /dev/null

# Function to create a database for a config/persona combination
create_db() {
  local db_name=$1
  echo "Creating database: $db_name"
  curl -s -X PUT "$COUCH_URL/$db_name" > /dev/null

  # Enable public access for demo (in production, use proper auth)
  curl -s -X PUT "$COUCH_URL/$db_name/_security" \
    -H "Content-Type: application/json" \
    -d '{"admins":{"names":["admin"],"roles":[]},"members":{"names":[],"roles":[]}}' > /dev/null
}

# Create default databases for demo
# Format: fieldservice-{configName}-{personaId}-{collection}
echo ""
echo "Creating demo databases..."

# For a demo config called "demo"
for persona in technician dispatcher manager; do
  create_db "fieldservice-demo-${persona}-workorders"
  create_db "fieldservice-demo-${persona}-equipment"
  create_db "fieldservice-demo-${persona}-checklists"
done

echo ""
echo "========================================="
echo "CouchDB sync server is ready!"
echo "========================================="
echo ""
echo "Admin URL:  http://localhost:5984/_utils"
echo "Sync URL:   http://localhost:5984"
echo ""
echo "Credentials:"
echo "  Username: admin"
echo "  Password: password"
echo ""
echo "To use in field-service-app, set sync URL to:"
echo "  http://localhost:5984"
echo ""
