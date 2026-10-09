Add-Type -AssemblyName System.Drawing
$dir = Join-Path (Get-Location) 'assets\img\products'
$before = 0; $after = 0; $n = 0

foreach ($f in Get-ChildItem $dir -Filter *.jpg) {
  $before += $f.Length
  try {
    $src = [System.Drawing.Image]::FromFile($f.FullName)
    $max = 900
    $w = $src.Width; $h = $src.Height
    if ($w -le $max -and $h -le $max -and $f.Length -lt 260000) { $src.Dispose(); $after += $f.Length; continue }
    $scale = [Math]::Min(1.0, [Math]::Min($max / $w, $max / $h))
    $nw = [int]($w * $scale); $nh = [int]($h * $scale)
    $bmp = New-Object System.Drawing.Bitmap($nw, $nh)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, 0, 0, $nw, $nh)
    $g.Dispose()
    $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $ps = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $ps.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 80)
    $tmp = $f.FullName + '.tmp.jpg'
    $bmp.Save($tmp, $enc, $ps)
    $bmp.Dispose(); $src.Dispose()
    Move-Item $tmp $f.FullName -Force
    $after += (Get-Item $f.FullName).Length
    $n++
  } catch {
    Write-Output ("skip " + $f.Name + " :: " + $_.Exception.Message)
    $after += $f.Length
  }
}
Write-Output ("resized: $n files")
Write-Output ("before: " + [math]::Round($before/1MB,2) + " MB")
Write-Output ("after:  " + [math]::Round($after/1MB,2) + " MB")
Get-ChildItem $dir -Filter *.jpg | Sort-Object Length -Descending | Select-Object -First 5 |
  ForEach-Object { 'largest: {0} {1:N0} bytes' -f $_.Name, $_.Length }
