#!/bin/bash
# Pilot Simulation Script
# Simulates a full VoiceForge AI campaign pipeline for testing.
# Usage: bash scripts/start-pilot-and-simulate.sh [base-url]

set -e

BASE_URL="${1:-http://localhost:3000}"
API_TOKEN="${VOICE_WEBHOOK_TOKEN:-pilot-dev-token}"

echo "========================================"
echo " VoiceForge AI — Pilot Simulation"
echo " Target: $BASE_URL"
echo "========================================"

# 1. Create test leads
echo ""
echo "[1/6] Creating test leads..."

LEADS=(
  '{"firstName":"John","lastName":"Smith","phone":"555-0101","email":"john@test.com","source":"Pilot","address":"123 Oak St"}'
  '{"firstName":"Sarah","lastName":"Jones","phone":"555-0102","email":"sarah@test.com","source":"Pilot","address":"456 Maple Ave"}'
  '{"firstName":"Mike","lastName":"Brown","phone":"555-0103","email":"mike@test.com","source":"Pilot","address":"789 Pine Rd"}'
)

for lead in "${LEADS[@]}"; do
  curl -s -X POST "$BASE_URL/api/leads" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_TOKEN" \
    -d "$lead" | head -c 200
  echo ""
done

# 2. Trigger a voice campaign
echo ""
echo "[2/6] Triggering voice campaign..."
curl -s -X POST "$BASE_URL/api/webhooks/crm" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{"event":"pilot-campaign","leads":["all"],"script":"Hi, this is a pilot test call from VoiceForge AI. We help homeowners sell faster. Would you like to learn more?"}'
echo ""

# 3. Simulate inbound call events (Twilio webhook format)
echo ""
echo "[3/6] Simulating call lifecycle events..."
for STATUS in "initiated" "ringing" "answered" "completed"; do
  echo "  -> Call status: $STATUS"
  curl -s -X POST "$BASE_URL/api/webhooks/voice" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "CallSid=pilot-call-001&CallStatus=$STATUS&From=555-0101&To=555-9999&CallDuration=45"
  echo ""
  sleep 1
done

# 4. Simulate voice→CRM timeline webhook
echo ""
echo "[4/6] Writing voice call to CRM timeline..."
curl -s -X POST "$BASE_URL/api/webhooks/voice" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{
    "callId":"pilot-call-001",
    "direction":"outbound",
    "from":"555-9999",
    "to":"555-0101",
    "status":"completed",
    "duration":45,
    "summary":"Discussed home selling options. Interested in CMA.",
    "sentiment":"positive",
    "outcome":"INTERESTED",
    "leadPhone":"555-0101"
  }'
echo ""

# 5. Simulate AI qualification
echo ""
echo "[5/6] Triggering AI lead qualification..."
curl -s -X POST "$BASE_URL/api/leads/qualify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{"leadPhone":"555-0101"}'
echo ""

# 6. Check system status
echo ""
echo "[6/6] System status check..."
curl -s "$BASE_URL/api/sse" | head -c 200
echo ""

echo ""
echo "========================================"
echo " Pilot simulation complete!"
echo " Check your dashboard at $BASE_URL"
echo "========================================"
