resource "aws_vpc" "sync_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "sync-wellness-vpc"
  }
}

resource "aws_internet_gateway" "sync_igw" {
  vpc_id = aws_vpc.sync_vpc.id

  tags = {
    Name = "sync-wellness-igw"
  }
}

resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.sync_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "sync-public-subnet-1"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.sync_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name = "sync-public-subnet-2"
  }
}

resource "aws_subnet" "private_db_1" {
  vpc_id            = aws_vpc.sync_vpc.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "sync-private-db-subnet-1"
  }
}

resource "aws_subnet" "private_db_2" {
  vpc_id            = aws_vpc.sync_vpc.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name = "sync-private-db-subnet-2"
  }
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.sync_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.sync_igw.id
  }

  tags = {
    Name = "sync-public-rt"
  }
}

resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public_rt.id
}
