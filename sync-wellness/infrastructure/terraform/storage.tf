resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "reports_bucket" {
  bucket        = "sync-wellness-reports-${random_id.bucket_suffix.hex}"
  force_destroy = false

  tags = {
    Name = "sync-wellness-reports"
  }
}

resource "aws_s3_bucket_public_access_block" "reports_access" {
  bucket = aws_s3_bucket.reports_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "reports_encryption" {
  bucket = aws_s3_bucket.reports_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
