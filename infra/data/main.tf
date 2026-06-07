data "aws_caller_identity" "current" {}

locals {
    bucket_name = "${var.project}-backups-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket" "backups" {
    bucket = local.bucket_name

    lifecycle {
        prevent_destroy = true
    }  
}

resource "aws_s3_bucket_versioning" "backups" {
    bucket = aws_s3_bucket.backups.id
    versioning_configuration {
      status = "Enabled"
    }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
    bucket = aws_s3_bucket.backups.id
    rule {
        apply_server_side_encryption_by_default {
            sse_algorithm = "AES256"
        }
    }  
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket = aws_s3_bucket.backups.id
  block_public_acls = true
  block_public_policy = true
  ignore_public_acls = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id
  rule {
    id = "expire-history"
    status = "Enabled"
    filter {
        prefix = "db/history"
    }
    expiration {
      days = 30
    }
  }
}

resource "aws_eip" "main" {
  domain = "vpc"
  tags = { Name = ToBeChanged}
}

resource "random_password" "JWT" {
    length = 48
    special = false
}

resource "random_password" "JWT_admin" {
  length = 32
  special = false
}

data "aws_iam_policy_document" "assume" {
    statement {
      actions = ["sts:AssumeRole"]
      principals {
        type = "Service"
        identifiers = ["ec2.amazonaws.com"]
      }
    }
  
}

resource "aws_iam_role" "ec2" {
  name = "{$var.project}-ec2"
  assume_role_policy = data.aws_iam_policy_document.assume.json
}

data "aws_iam_policy_document" "s3_backups" {
  statement {
    sid = "ListBucket"
    actions = ["s3:ListBucket"]
    resources = [aws_s3_bucket.backups.arn]
  }
  statement {
    sid = "ObjectRW"
    actions = ["s3:GetObject", "s3:PutObject"]
    resources = ["${aws_s3_bucket.backups.arn}/*"]
  }
}

resource "aws_iam_role_policy" "s3_backups" {
  name = "${var.project}-s3-backups"
  role = aws_iam_role.ec2.id
  policy = data.aws_iam_policy_document.s3_backups.json
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.project}-ec2"
  role = aws_iam_role.ec2.name
}

resource "aws_key_pair" "main" {
  key_name = "${var.project}-key"
  public_key = var.ssh_public_key
}