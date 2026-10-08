resource "aws_db_subnet_group" "sync_db_subnet_group" {
  name        = "sync-db-subnet-group"
  description = "Database subnet group for SYNC MySQL RDS"
  subnet_ids  = [aws_subnet.private_db_1.id, aws_subnet.private_db_2.id]

  tags = {
    Name = "sync-db-subnet-group"
  }
}

resource "aws_security_group" "rds_sg" {
  name        = "sync-rds-sg"
  description = "Allow inbound MySQL traffic from application EC2"
  vpc_id      = aws_vpc.sync_vpc.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "sync-rds-sg"
  }
}

resource "aws_db_instance" "sync_mysql" {
  identifier             = "sync-mysql-db"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.micro" # AWS Free Tier eligible (750 hours/month)
  allocated_storage      = 20            # AWS Free Tier maximum (20 GB)
  storage_type           = "gp2"         # AWS Free Tier General Purpose SSD
  multi_az               = false         # Single-AZ for Free Tier
  backup_retention_period = 1
  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.sync_db_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot    = true
  publicly_accessible    = false

  tags = {
    Name = "sync-mysql-rds"
  }
}

