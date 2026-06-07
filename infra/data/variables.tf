variable "region" {
    description = "General AWS region"
    type = "string"
    default = "eu-central-a"
}

variable "project" {
  description = "Prefix for resources"
  type = "string"
  default = "office-quest"
}

variable "ssh_public_key" {
  description = "Public SSH key"
  type = string
}