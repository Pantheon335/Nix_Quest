variable "region" {
  description = "General AWS region"
  type        = string
  default     = "es-east-1"
}

variable "project" {
  description = "Prefix for resources"
  type        = string
  default     = "office-quest"
}

variable "ssh_public_key" {
  description = "SSH public key for EC2 access"
  type        = string
}
