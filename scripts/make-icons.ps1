# PWA ikonalari: Hidoya belgisi (public/assets/favicon.svg) PNG shaklida. Windows'da System.Drawing bilan chiziladi.
# Ishga tushirish: powershell -ExecutionPolicy Bypass -File scripts/make-icons.ps1
Add-Type -AssemblyName System.Drawing
$out = Join-Path $PSScriptRoot '..\public\assets'

function Draw-Icon([int]$size, [string]$file, [bool]$maskable) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.Clear([System.Drawing.Color]::Transparent)
  $navy = [System.Drawing.ColorTranslator]::FromHtml('#123a66')
  $paper = [System.Drawing.ColorTranslator]::FromHtml('#f5f7fa')
  $gold = [System.Drawing.ColorTranslator]::FromHtml('#c9a24b')
  # maskable: butun maydon to'q fon, belgi xavfsiz zonada (80%)
  $s = $size / 64.0
  if ($maskable) { $g.FillRectangle((New-Object System.Drawing.SolidBrush $navy), 0, 0, $size, $size); $k = 0.72; $off = $size * (1 - $k) / 2; $s = $size * $k / 64.0 }
  else {
    $off = 0
    $r = 14 * $s; $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $p.AddArc(0, 0, 2*$r, 2*$r, 180, 90); $p.AddArc($size-2*$r, 0, 2*$r, 2*$r, 270, 90); $p.AddArc($size-2*$r, $size-2*$r, 2*$r, 2*$r, 0, 90); $p.AddArc(0, $size-2*$r, 2*$r, 2*$r, 90, 90); $p.CloseFigure()
    $g.FillPath((New-Object System.Drawing.SolidBrush $navy), $p)
  }
  $P = { param($x, $y) New-Object System.Drawing.PointF ([float]($off + $x * $s)), ([float]($off + $y * $s)) }
  # Peshtoq: M17 59V33C17 22 25 15 32 11c7 4 15 11 15 22v26z
  $arch = New-Object System.Drawing.Drawing2D.GraphicsPath
  $arch.AddLine((& $P 17 59), (& $P 17 33))
  $arch.AddBezier((& $P 17 33), (& $P 17 22), (& $P 25 15), (& $P 32 11))
  $arch.AddBezier((& $P 32 11), (& $P 39 15), (& $P 47 22), (& $P 47 33))
  $arch.AddLine((& $P 47 33), (& $P 47 59))
  $arch.CloseFigure()
  $g.FillPath((New-Object System.Drawing.SolidBrush $paper), $arch)
  # Yulduz: M32 22l2.6 7.4L42 32l-7.4 2.6L32 42l-2.6-7.4L22 32l7.4-2.6z
  $star = [System.Drawing.PointF[]]@((& $P 32 22), (& $P 34.6 29.4), (& $P 42 32), (& $P 34.6 34.6), (& $P 32 42), (& $P 29.4 34.6), (& $P 22 32), (& $P 29.4 29.4))
  $g.FillPolygon((New-Object System.Drawing.SolidBrush $gold), $star)
  $bmp.Save((Join-Path $out $file), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}
Draw-Icon 192 'icon-192.png' $false
Draw-Icon 512 'icon-512.png' $false
Draw-Icon 512 'icon-maskable-512.png' $true
"ikonalar tayyor: $out"
