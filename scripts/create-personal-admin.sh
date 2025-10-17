#!/bin/bash

# Quick Admin Account Creation Script
# Usage: ./scripts/create-personal-admin.sh

echo "🏥 Hospital Management System - Quick Admin Creator"
echo "=================================================="
echo ""

# Prompt for user details
read -p "Enter your email address: " EMAIL
read -p "Enter your username: " USERNAME
read -s -p "Enter your password: " PASSWORD
echo ""
read -p "Enter your first name: " FIRST_NAME
read -p "Enter your last name: " LAST_NAME
read -p "Enter your employee ID (e.g., ADM001): " EMPLOYEE_ID
read -p "Enter your phone number: " PHONE

echo ""
echo "🔧 Creating admin account..."

# API endpoint
API_URL="https://web-production-68a4f3.up.railway.app/api/auth/register"

# Create the admin account
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"firstName\": \"$FIRST_NAME\",
    \"lastName\": \"$LAST_NAME\",
    \"employeeId\": \"$EMPLOYEE_ID\",
    \"department\": \"Administration\",
    \"role\": \"Admin\",
    \"phone\": \"$PHONE\",
    \"shift\": \"Day\"
  }")

# Check if the response contains success
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo ""
    echo "✅ Admin account created successfully!"
    echo "📧 Email: $EMAIL"
    echo "👤 Username: $USERNAME"
    echo "🔑 Role: Admin"
    echo "🆔 Employee ID: $EMPLOYEE_ID"
    echo ""
    echo "🎉 You can now log in with your credentials!"
else
    echo ""
    echo "❌ Failed to create admin account:"
    echo "$RESPONSE" | jq '.message // .errors // .' 2>/dev/null || echo "$RESPONSE"
fi

echo ""
echo "📋 Next steps:"
echo "1. Log in with your new credentials at:"
echo "   https://visionary-brigadeiros-5fc1fd.netlify.app/login"
echo "2. Consider removing test accounts from the database"
echo "3. Update deployment documentation with your admin credentials"