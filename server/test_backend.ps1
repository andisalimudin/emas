$body = @{
    email = "test@example.com"
    password = "password"
    name = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:4000/auth/register" -ContentType "application/json" -Body $body
