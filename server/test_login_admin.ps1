$body = @{
    email = "admin@goldexclude.com"
    password = "adminpassword123"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:4000/auth/login" -ContentType "application/json" -Body $body
