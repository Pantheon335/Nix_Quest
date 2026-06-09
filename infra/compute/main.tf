data "terraform_remote_state" "data" {
  backend = "local"
  config = {
    path = var.data_state_path
  }
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] #Canonical
  tags        = { Name = "${var.project}" }

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd*/ubuntu-noble-24.04-arm64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_vpc" "default" {
  default = true
}

resource "aws_security_group" "web" {
  name        = "${var.project}-web"
  description = "ToBeChanged"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_cidr]
  }
  ingress {
    description = "HTTP (ACME + redirect)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-web" }
}

resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = data.terraform_remote_state.data.outputs.key_name
  vpc_security_group_ids = [aws_security_group.web.id]
  iam_instance_profile   = data.terraform_remote_state.data.outputs.instance_profile_name

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = templatefile("${path.module}/user_data.sh.tftpl", {
    repo_url      = var.repo_url
    repo_branch   = var.repo_branch
    region        = var.region
    domain        = var.domain
    acme_email    = var.acme_email
    backup_bucket = data.terraform_remote_state.data.outputs.backup_bucket
    jwt_secret    = data.terraform_remote_state.data.outputs.jwt_secret
    admin_token   = data.terraform_remote_state.data.outputs.admin_token
  })

  # Re-run user_data if the bootstrap script changes.
  user_data_replace_on_change = true

  tags = { Name = var.project }
}

resource "aws_eip_association" "app" {
  instance_id   = aws_instance.app.id
  allocation_id = data.terraform_remote_state.data.outputs.eip_allocation_id
}