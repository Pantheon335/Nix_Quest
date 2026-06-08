output "region" {
  value = var.region
}

output "backup_bucket" {
  value = aws_s3_bucket.backups.bucket
}

output "eip_allocation_id" {
  value = aws_eip.main.allocation_id
}

output "eip_public_ip" {
  value = aws_eip.main.public_ip
}

output "instance_profile_name" {
  value = aws_iam_instance_profile.ec2.name
}

output "key_name" {
  value = aws_key_pair.main.key_name
}

output "jwt_secret" {
  value     = random_password.JWT.result
  sensitive = true
}

output "admin_token" {
  value     = random_password.JWT_admin.result
  sensitive = true
}