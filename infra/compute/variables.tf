variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Name prefix for resources"
  type        = string
  default     = "office-quest"
}

variable "ssh_cidr" {
  description = "CIDR allowed to SSH"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t4g.small"
}

variable "repo_url" {
  description = "Public Git repo to clone and build on the instance"
  type        = string
}

variable "repo_branch" {
  description = "Branch to deploy"
  type        = string
  default     = "main"
}

variable "domain" {
  description = "Domain served by Caddy. --office-quest.pp.ua"
  type        = string
}

variable "acme_email" {
  description = "Contact email for Let's Encrypt"
  type        = string
}

variable "data_state_path" {
  description = "Path to the data stack's local state file"
  type        = string
  default     = "../data/terraform.tfstate"
}