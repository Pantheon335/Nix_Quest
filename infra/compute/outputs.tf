output "public_ip" {
  value = data.terraform_remote_state.data.outputs.eip_public_ip
}

output "url" {
  value = "https://${var.domain}"
}

output "ssh" {
  value = "ssh ubuntu@${data.terraform_remote_state.data.outputs.eip_public_ip}"
}

output "instance_id" {
  value = aws_instance.app.id
}