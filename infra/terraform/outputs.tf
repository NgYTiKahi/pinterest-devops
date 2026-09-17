output "public_ip" {
  value = aws_instance.app.public_ip
}
output "app_url" {
  value = "http://${aws_instance.app.public_ip}"
}
output "ansible_inventory" {
  value = "[pins]\npins-vps ansible_host=${aws_instance.app.public_ip} ansible_user=ubuntu\n"
}
