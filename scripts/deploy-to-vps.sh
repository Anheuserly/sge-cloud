#!/usr/bin/env bash
# ========================================================================================
#             AUTOMATED LOCAL-TO-VPS DEPLOYMENT & SYNC SCRIPT
#             Target Node: configured by local environment variables
# ========================================================================================

: "${VPS_HOST:?Set VPS_HOST locally before running this script}"
: "${VPS_USER:?Set VPS_USER locally before running this script}"
: "${VPS_PATH:=/opt/sge-datahub/current}"

echo "================================================================="
echo "   STARTING LOCAL TO NETCUP VPS SYNC & DEPLOYMENT"
echo "   Target VPS: ${VPS_USER}@${VPS_HOST}:${VPS_PATH}"
echo "================================================================="

# Step 1: Push latest Git commits
echo "[1/3] Pushing latest code to GitHub main branch..."
git add .
git commit -m "VPS Sync: $(date)" || true
git push origin main

# Step 2: SSH into Netcup VPS & pull latest code
echo "[2/3] Pulling latest code and building on Netcup VPS..."
ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PATH} && git pull origin main && npm install --production=false && npm run build && systemctl restart sge-datahub.service"

# Step 3: Check live health status
echo "[3/3] Checking live API health status..."
curl -sI https://storage.amcmep.in

echo -e "\n================================================ metaphysics =="
echo "   SYNC AND DEPLOYMENT TO NETCUP VPS COMPLETED!"
echo "================================================================="
