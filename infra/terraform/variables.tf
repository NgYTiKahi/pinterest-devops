variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}
variable "project_name" {
  type    = string
  default = "pins-demo"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,24}$", var.project_name))
    error_message = "Use 3-25 lowercase letters, numbers or hyphens."
  }
}
variable "instance_type" {
  type    = string
  default = "t3.medium"
}
variable "admin_cidr" {
  description = "Your trusted public IPv4/32. Used for SSH and demo HTTP; no public-all default."
  type        = string
  validation {
    condition     = can(cidrnetmask(var.admin_cidr)) && can(regex("/32$", var.admin_cidr))
    error_message = "Provide a single trusted IPv4 /32."
  }
}
variable "ssh_public_key" {
  description = "Public SSH key only. Never put a private key in Terraform."
  type        = string
  validation {
    condition     = can(regex("^ssh-(ed25519|rsa) ", var.ssh_public_key))
    error_message = "Provide an OpenSSH ed25519 or rsa public key."
  }
}
