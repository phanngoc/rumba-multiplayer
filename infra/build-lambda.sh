#!/bin/bash

# Script to build Lambda function packages
set -e

echo "Building Lambda functions..."

# Create build directory
mkdir -p build

# Build stop instance Lambda
echo "Building stop_instance Lambda..."
cd lambda
cp stop_instance.py index.py
zip -r ../build/stop_instance.zip index.py
rm index.py
cd ..

# Build start instance Lambda
echo "Building start_instance Lambda..."
cd lambda
cp start_instance.py index.py
zip -r ../build/start_instance.zip index.py
rm index.py
cd ..

echo "Lambda functions built successfully!"
echo "Files created:"
echo "  - build/stop_instance.zip"
echo "  - build/start_instance.zip"
