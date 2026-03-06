# Simple PowerShell HTTP Server for health+
# Run this script to start the web server on http://localhost:8000

$port = 8000
$url = "http://localhost:$port/"

# Create HTTP listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)

try {
    $listener.Start()
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "  health+ Server Started Successfully!" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Open your browser and visit:" -ForegroundColor Yellow
    Write-Host "  $url" -ForegroundColor White -BackgroundColor DarkBlue
    Write-Host ""
    Write-Host "  Press Ctrl+C to stop the server" -ForegroundColor Gray
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""

    # Open browser automatically
    Start-Process $url

    # MIME types mapping
    $mimeTypes = @{
        '.html' = 'text/html'
        '.htm'  = 'text/html'
        '.css'  = 'text/css'
        '.js'   = 'application/javascript'
        '.json' = 'application/json'
        '.png'  = 'image/png'
        '.jpg'  = 'image/jpeg'
        '.jpeg' = 'image/jpeg'
        '.gif'  = 'image/gif'
        '.svg'  = 'image/svg+xml'
        '.ico'  = 'image/x-icon'
        '.woff' = 'font/woff'
        '.woff2'= 'font/woff2'
        '.ttf'  = 'font/ttf'
        '.eot'  = 'application/vnd.ms-fontobject'
        '.txt'  = 'text/plain'
        '.xml'  = 'application/xml'
    }

    # Main server loop
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # Log request
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-Host "[$timestamp] " -ForegroundColor Gray -NoNewline
        Write-Host "$($request.HttpMethod) " -ForegroundColor Cyan -NoNewline
        Write-Host "$($request.Url.LocalPath)" -ForegroundColor White

        # Get file path
        $path = $request.Url.LocalPath
        if ($path -eq '/') {
            $path = '/index.html'
        }
        
        $filePath = Join-Path $PSScriptRoot $path.TrimStart('/')
        $filePath = $filePath -replace '/', '\'

        # Serve file
        if (Test-Path $filePath -PathType Leaf) {
            try {
                $content = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $content.Length
                
                # Set MIME type
                $extension = [System.IO.Path]::GetExtension($filePath)
                if ($mimeTypes.ContainsKey($extension)) {
                    $response.ContentType = $mimeTypes[$extension]
                } else {
                    $response.ContentType = 'application/octet-stream'
                }
                
                # Add CORS headers for development
                $response.Headers.Add("Access-Control-Allow-Origin", "*")
                $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
                
                $response.StatusCode = 200
                $response.OutputStream.Write($content, 0, $content.Length)
            }
            catch {
                Write-Host "  Error serving file: $_" -ForegroundColor Red
                $response.StatusCode = 500
            }
        }
        else {
            # 404 Not Found
            $response.StatusCode = 404
            $content = [System.Text.Encoding]::UTF8.GetBytes("404 - File Not Found: $path")
            $response.ContentLength64 = $content.Length
            $response.ContentType = 'text/plain'
            $response.OutputStream.Write($content, 0, $content.Length)
            Write-Host "  404 Not Found" -ForegroundColor Yellow
        }

        $response.Close()
    }
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    Write-Host ""
    Write-Host "Server stopped." -ForegroundColor Yellow
}
