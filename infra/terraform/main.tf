data "aws_availability_zones" "available" {
  state = "available"
}
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}
resource "aws_vpc" "app" {
  cidr_block           = "10.42.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = { Name = var.project_name }
}
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.app.id
  cidr_block              = "10.42.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true
}
resource "aws_internet_gateway" "app" {
  vpc_id = aws_vpc.app.id
}
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.app.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.app.id
  }
}
resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}
resource "aws_security_group" "app" {
  name_prefix = "${var.project_name}-"
  description = "Restricted demo HTTP and SSH; no database or monitoring ingress"
  vpc_id      = aws_vpc.app.id
}
resource "aws_vpc_security_group_ingress_rule" "ssh" {
  security_group_id = aws_security_group.app.id
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_ipv4         = var.admin_cidr
}
resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.app.id
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = var.admin_cidr
}
resource "aws_vpc_security_group_egress_rule" "outbound" {
  security_group_id = aws_security_group.app.id
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}
resource "aws_key_pair" "app" {
  key_name_prefix = "${var.project_name}-"
  public_key      = var.ssh_public_key
}
resource "aws_instance" "app" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.app.id]
  key_name                    = aws_key_pair.app.key_name
  associate_public_ip_address = true
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }
  root_block_device {
    volume_type           = "gp3"
    volume_size           = 30
    encrypted             = true
    delete_on_termination = true
  }
  tags       = { Name = var.project_name }
  depends_on = [aws_route_table_association.public]
}
