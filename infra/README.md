# Infrastructure Configuration

This directory contains resources for provisioning the AWS infrastructure.
In Phase 1, S3 integration is direct and configurable via environment variables.

In Phase 2, this will contain Terraform or AWS SAM / CloudFormation templates to automate the provisioning of:
- S3 Bucket (Data Storage)
- Lambda Function (FastAPI API server via Mangum)
- API Gateway (HTTP Router overlaying Lambda)
- IAM roles and policies
