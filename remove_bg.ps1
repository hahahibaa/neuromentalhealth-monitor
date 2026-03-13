Add-Type -AssemblyName System.Drawing
$imgPath = "C:\Users\Divanshu\.gemini\antigravity\scratch\neuro-health\bg.png"
$outPath = "C:\Users\Divanshu\.gemini\antigravity\scratch\neuro-health\bg_transparent.png"
$img = [System.Drawing.Bitmap]::FromFile($imgPath)
$bgColor = $img.GetPixel(0, 0)
$img.MakeTransparent($bgColor)
$img.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
