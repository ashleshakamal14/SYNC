output "app_server_public_ip" {
  description = "Public IP of the SYNC application server"
  value       = aws_instance.app_server.public_ip
}

output "rds_endpoint" {
  description = "MySQL RDS database connection endpoint"
  value       = aws_db_instance.sync_mysql.endpoint
}

output "s3_reports_bucket_name" {
  description = "Name of the S3 bucket provisioned for reports"
  value       = aws_s3_bucket.reports_bucket.id
}
