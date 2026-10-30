# Faqat statik ko'rinish uchun oddiy lokal server (Windows PowerShell).
# AI chat (/api/chat) bu serverda ishlamaydi — to'liq sinov uchun: npx netlify dev
$port = 8080
$folder = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "public"))

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
    $listener.Start()
    Write-Output "Server running on http://localhost:$port/  (papka: $folder)"
} catch {
    Write-Output "Error starting listener: $_"
    exit 1
}

function Send-Text($response, $code, $text) {
    $response.StatusCode = $code
    $buffer = [System.Text.Encoding]::UTF8.GetBytes($text)
    $response.ContentType = "text/plain; charset=utf-8"
    $response.ContentLength64 = $buffer.Length
    $response.OutputStream.Write($buffer, 0, $buffer.Length)
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    try {
        $path = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)
        if ($path -eq "/" -or $path -eq "") { $path = "/index.html" }

        if ($path -eq "/api/chat") {
            Send-Text $response 503 '{"error":"Lokal PowerShell serverda AI ishlamaydi. npx netlify dev orqali ishga tushiring."}'
            continue
        }

        $cleanPath = $path.TrimStart('/').Replace('/', '\')
        $filePath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($folder, $cleanPath))

        # Papkadan tashqariga chiqishni (..\) taqiqlash
        if (-not $filePath.StartsWith($folder + "\", [System.StringComparison]::OrdinalIgnoreCase)) {
            Send-Text $response 403 "403 Forbidden"
            continue
        }

        if ([System.IO.File]::Exists($filePath)) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = "application/octet-stream"
            switch ($ext) {
                ".html" { $contentType = "text/html; charset=utf-8" }
                ".css"  { $contentType = "text/css; charset=utf-8" }
                ".js"   { $contentType = "application/javascript; charset=utf-8" }
                ".json" { $contentType = "application/json; charset=utf-8" }
                ".png"  { $contentType = "image/png" }
                ".jpg"  { $contentType = "image/jpeg" }
                ".svg"  { $contentType = "image/svg+xml" }
                ".ico"  { $contentType = "image/x-icon" }
            }
            $response.ContentType = $contentType
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            Send-Text $response 404 "404 Not Found"
        }
    } catch {
        try { Send-Text $response 500 "500 Server Error" } catch {}
    } finally {
        $response.OutputStream.Close()
    }
}
