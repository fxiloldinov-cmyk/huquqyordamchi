# PWA ikonalari: tamg'a belgisi (public/assets/favicon.svg) PNG shaklida. Windows'da System.Drawing bilan chiziladi.
# Ishga tushirish: powershell -ExecutionPolicy Bypass -File scripts/make-icons.ps1
Add-Type -AssemblyName System.Drawing
$out = Join-Path $PSScriptRoot '..\public\assets'

function Draw-Icon([int]$size, [string]$file, [bool]$maskable) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.Clear([System.Drawing.Color]::Transparent)
  $ink = [System.Drawing.ColorTranslator]::FromHtml('#1d2b3a')
  $bronze = [System.Drawing.ColorTranslator]::FromHtml('#b48c49')
  $cream = [System.Drawing.ColorTranslator]::FromHtml('#e8dcc0')
  $s = $size / 64.0; $off = 0
  # maskable: butun maydon to'q fon, belgi xavfsiz zonada (72%)
  if ($maskable) { $g.FillRectangle((New-Object System.Drawing.SolidBrush $ink), 0, 0, $size, $size); $k = 0.72; $off = $size * (1 - $k) / 2; $s = $size * $k / 64.0 }
  else { $g.FillEllipse((New-Object System.Drawing.SolidBrush $ink), [float](2 * $s), [float](2 * $s), [float](60 * $s), [float](60 * $s)) }
  $P = { param($x, $y) New-Object System.Drawing.PointF ([float]($off + $x * $s)), ([float]($off + $y * $s)) }
  # Ichki bronza halqa (muhr)
  $ring = New-Object System.Drawing.Pen $bronze, ([float](1.6 * $s))
  $g.DrawEllipse($ring, [float]($off + 6.5 * $s), [float]($off + 6.5 * $s), [float](51 * $s), [float](51 * $s))
  # H va ikki oyoq
  $pen = New-Object System.Drawing.Pen $cream, ([float](3.8 * $s))
  $pen.StartCap = 'Round'; $pen.EndCap = 'Round'; $pen.LineJoin = 'Round'
  foreach ($l in @(@(22,18,22,46), @(42,18,42,46), @(22,32,42,32), @(32,32,26,46), @(32,32,38,46))) {
    $g.DrawLine($pen, (& $P $l[0] $l[1]), (& $P $l[2] $l[3]))
  }
  $bmp.Save((Join-Path $out $file), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}
Draw-Icon 192 'icon-192.png' $false
Draw-Icon 512 'icon-512.png' $false
Draw-Icon 512 'icon-maskable-512.png' $true
"ikonalar tayyor: $out"
