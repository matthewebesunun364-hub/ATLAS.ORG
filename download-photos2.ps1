$ErrorActionPreference = 'Continue'
$dir = Join-Path (Get-Location) 'assets\img\products'

# full-size commons URLs that got rate-limited -> use the /thumb/ endpoint at 800px
$retry = @(
@('rice50','https://upload.wikimedia.org/wikipedia/commons/2/2a/Bag_of_rice_20221028_150305.jpg'),
@('rice10','https://upload.wikimedia.org/wikipedia/commons/d/d2/A_woman_drags_a_large_sack_of_rice_as_people_fight_over_food_aid_donated_by_the_Djiboutian_government_to_people_affected_by_the_recent_flooding_in_Beletweyne%2C_Somalia%2C_on_May_29%2C_2016._Flooding_in_the_%2827484883716%29.jpg'),
@('semo','https://upload.wikimedia.org/wikipedia/commons/a/ab/Kota_Ogi.jpg'),
@('yam','https://upload.wikimedia.org/wikipedia/commons/7/7c/Yam_roots.jpg'),
@('plantain','https://upload.wikimedia.org/wikipedia/commons/5/5a/Dodo%28Fried_ripe_plantains%29_and_Chicken.jpg'),
@('amala','https://upload.wikimedia.org/wikipedia/commons/d/d4/Yam_fufu.jpg'),
@('pupuru','https://upload.wikimedia.org/wikipedia/commons/a/ac/Pounding_yam_fufu.jpg'),
@('garri','https://upload.wikimedia.org/wikipedia/commons/a/a7/Cassava_flakes_%28Garri%29IMG_20250319_094449_570.jpg'),
@('fshrimp','https://upload.wikimedia.org/wikipedia/commons/f/ff/MC_%E6%BE%B3%E9%96%80_Macau_%E8%B7%AF%E6%B0%B9_Cotai_%E8%90%AC%E8%B1%AA%E9%85%92%E5%BA%97_JW_Marriott_Hotel_Macao_%E5%90%8D%E5%BB%9A%E9%83%BD%E5%8C%AF_Urban_Kitchen_Restaurant_%E8%87%AA%E5%8A%A9%E5%8D%88%E9%A4%90_lunch_buffet_food_seafood_shrimp_prawn_March_2026_N13P_02.jpg'),
@('fturkey','https://upload.wikimedia.org/wikipedia/commons/1/16/Market_of_Turkey_meat_in_Russia.jpg'),
@('fgizzard','https://upload.wikimedia.org/wikipedia/commons/f/fe/Chicken_gizzards.jpg'),
@('fbreast','https://upload.wikimedia.org/wikipedia/commons/5/57/Chickens_in_market.jpg'),
@('malt','https://upload.wikimedia.org/wikipedia/commons/f/f3/Moussy_Ice_Berry_flavor_nonalcoholic_malt_beverage_in_a_styrofoam_cup_1.jpg'),
@('water','https://upload.wikimedia.org/wikipedia/commons/0/06/Acea_USB_charge_and_drinking_water_bottle_refill.jpg'),
@('cubes','https://upload.wikimedia.org/wikipedia/commons/7/79/Bouillon_cube.jpg'),
@('soyaoil','https://upload.wikimedia.org/wikipedia/commons/b/bb/Dune_Aura_Soya_Oil_Bottles.jpg'),
@('indomie','https://upload.wikimedia.org/wikipedia/commons/4/44/INDOMIE_AND_EGG.jpg'),
@('milkpow','https://upload.wikimedia.org/wikipedia/commons/b/b9/Milk_powder_cropped.jpg'),
@('salt','https://upload.wikimedia.org/wikipedia/commons/7/7c/Rock_salt_%28halitite%29_%28Billianwala_Salt_Member%2C_Salt_Range_Formation%2C_Ediacaran_to_Lower_Cambrian%3B_Khewra_Salt_Mine%2C_Salt_Range%2C_Pakistan%29_14.jpg'),
@('tin','https://upload.wikimedia.org/wikipedia/commons/e/e8/Tomato_paste_on_spoon.jpg'),
@('bundle-frozen','https://upload.wikimedia.org/wikipedia/commons/8/83/Kuehlregal_USA.jpg')
)

function ConvertTo-Thumb($u) {
  if ($u -notmatch '^(https://upload\.wikimedia\.org/wikipedia/commons)/([0-9a-f])/([0-9a-f]{2})/(.+)$') { return $u }
  $file = $Matches[4]
  return "$($Matches[1])/thumb/$($Matches[2])/$($Matches[3])/$file/800px-$file"
}

$ok = 0; $bad = @()
foreach ($m in $retry) {
  $name = $m[0]; $url = ConvertTo-Thumb $m[1]
  $out = Join-Path $dir ($name + '.jpg')
  $done = $false
  foreach ($attempt in 1..3) {
    try {
      Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing -TimeoutSec 45 -Headers @{ 'User-Agent' = 'AyoolaSiteBot/1.0 (contact: site owner)' }
      $len = (Get-Item $out).Length
      if ($len -gt 4000) { $done = $true; $ok++; break }
      Remove-Item $out -Force
    } catch { }
    Start-Sleep -Seconds (2 * $attempt)
  }
  if (-not $done) { $bad += $name }
  Start-Sleep -Milliseconds 1200
}
Write-Output "retry ok: $ok / $($retry.Count)"
if ($bad.Count) { Write-Output ("still missing: " + ($bad -join ', ')) }
