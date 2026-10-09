$ErrorActionPreference = 'Continue'
$dir = Join-Path (Get-Location) 'assets\img\products'
New-Item -ItemType Directory -Force -Path $dir | Out-Null

$map = @(
@('rice50','https://upload.wikimedia.org/wikipedia/commons/2/2a/Bag_of_rice_20221028_150305.jpg'),
@('rice10','https://upload.wikimedia.org/wikipedia/commons/d/d2/A_woman_drags_a_large_sack_of_rice_as_people_fight_over_food_aid_donated_by_the_Djiboutian_government_to_people_affected_by_the_recent_flooding_in_Beletweyne%2C_Somalia%2C_on_May_29%2C_2016._Flooding_in_the_%2827484883716%29.jpg'),
@('beans','https://live.staticflickr.com/5340/9188878929_e9f7a0f38e_b.jpg'),
@('semo','https://upload.wikimedia.org/wikipedia/commons/a/ab/Kota_Ogi.jpg'),
@('yam','https://upload.wikimedia.org/wikipedia/commons/7/7c/Yam_roots.jpg'),
@('plantain','https://upload.wikimedia.org/wikipedia/commons/5/5a/Dodo%28Fried_ripe_plantains%29_and_Chicken.jpg'),
@('amala','https://upload.wikimedia.org/wikipedia/commons/d/d4/Yam_fufu.jpg'),
@('pupuru','https://upload.wikimedia.org/wikipedia/commons/a/ac/Pounding_yam_fufu.jpg'),
@('egusi','https://live.staticflickr.com/7161/6465158185_0c95ee401f_b.jpg'),
@('garri','https://upload.wikimedia.org/wikipedia/commons/a/a7/Cassava_flakes_%28Garri%29IMG_20250319_094449_570.jpg'),
@('ftilapia','https://live.staticflickr.com/3893/15185635905_15fa390938_b.jpg'),
@('fmackerel','https://live.staticflickr.com/1599/24285162440_131d401e6e_b.jpg'),
@('fcroaker','https://live.staticflickr.com/7200/6932009095_173c012215_b.jpg'),
@('fshrimp','https://upload.wikimedia.org/wikipedia/commons/f/ff/MC_%E6%BE%B3%E9%96%80_Macau_%E8%B7%AF%E6%B0%B9_Cotai_%E8%90%AC%E8%B1%AA%E9%85%92%E5%BA%97_JW_Marriott_Hotel_Macao_%E5%90%8D%E5%BB%9A%E9%83%BD%E5%8C%AF_Urban_Kitchen_Restaurant_%E8%87%AA%E5%8A%A9%E5%8D%88%E9%A4%90_lunch_buffet_food_seafood_shrimp_prawn_March_2026_N13P_02.jpg'),
@('fshark','https://live.staticflickr.com/65535/48767678136_4050a73571_b.jpg'),
@('fcuttle','https://live.staticflickr.com/3227/3120827177_50bcb3a05a_b.jpg'),
@('fchicken','https://live.staticflickr.com/3708/12695961173_2d34f32b6d.jpg'),
@('fturkey','https://upload.wikimedia.org/wikipedia/commons/1/16/Market_of_Turkey_meat_in_Russia.jpg'),
@('fgizzard','https://upload.wikimedia.org/wikipedia/commons/f/fe/Chicken_gizzards.jpg'),
@('fbreast','https://upload.wikimedia.org/wikipedia/commons/5/57/Chickens_in_market.jpg'),
@('coke2l','https://live.staticflickr.com/45/140554799_53be80aae0_b.jpg'),
@('malt','https://upload.wikimedia.org/wikipedia/commons/f/f3/Moussy_Ice_Berry_flavor_nonalcoholic_malt_beverage_in_a_styrofoam_cup_1.jpg'),
@('water','https://upload.wikimedia.org/wikipedia/commons/0/06/Acea_USB_charge_and_drinking_water_bottle_refill.jpg'),
@('juice','https://live.staticflickr.com/5604/15458333317_38f828c71a_b.jpg'),
@('fanta','https://live.staticflickr.com/3251/2841593781_6b21acfe82_b.jpg'),
@('energy','https://images.rawpixel.com/editor_1024/cHJpdmF0ZS9zdGF0aWMvaW1hZ2Uvd2Vic2l0ZS8yMDIyLTA0L2xyL2Zyc21hc2hlZF9zb2RhX2RyaW5rX2NvbnRhaW5lci1pbWFnZS1rejJlN3VjMy5qcGc.jpg'),
@('wine','https://live.staticflickr.com/4144/4983046861_2bdf555324_b.jpg'),
@('palm','https://live.staticflickr.com/6007/5964882325_0704c6a6fe_b.jpg'),
@('tomato','https://images.rawpixel.com/editor_1024/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvYTAxMC1tYXJrdXNzLTExMTYuanBn.jpg'),
@('cubes','https://upload.wikimedia.org/wikipedia/commons/7/79/Bouillon_cube.jpg'),
@('thyme','https://cdn.stocksnap.io/img-thumbs/960w/6ASMNGB3YI.jpg'),
@('soyaoil','https://upload.wikimedia.org/wikipedia/commons/b/bb/Dune_Aura_Soya_Oil_Bottles.jpg'),
@('indomie','https://upload.wikimedia.org/wikipedia/commons/4/44/INDOMIE_AND_EGG.jpg'),
@('spaghetti','https://cdn.stocksnap.io/img-thumbs/960w/A06F9A9896.jpg'),
@('noodle5','https://live.staticflickr.com/4265/35862216926_d98b5b76d0_b.jpg'),
@('sugar','https://images.rawpixel.com/editor_1024/cHJpdmF0ZS9zdGF0aWMvaW1hZ2Uvd2Vic2l0ZS8yMDIyLTA0L2xyL3B4MTI0MjA0OC1pbWFnZS1rd3Z3NHN4NC5qcGc.jpg'),
@('biscuit','https://pd.w.org/2024/02/12765c2561ce84336.99322375-1152x2048.jpg'),
@('milk','https://upload.wikimedia.org/wikipedia/commons/0/0f/Dosenmilch.jpg'),
@('milkpow','https://upload.wikimedia.org/wikipedia/commons/b/b9/Milk_powder_cropped.jpg'),
@('salt','https://upload.wikimedia.org/wikipedia/commons/7/7c/Rock_salt_%28halitite%29_%28Billianwala_Salt_Member%2C_Salt_Range_Formation%2C_Ediacaran_to_Lower_Cambrian%3B_Khewra_Salt_Mine%2C_Salt_Range%2C_Pakistan%29_14.jpg'),
@('tin','https://upload.wikimedia.org/wikipedia/commons/e/e8/Tomato_paste_on_spoon.jpg'),
@('bundle-shop','https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/Stop%26Shop.jpg/3840px-Stop%26Shop.jpg'),
@('bundle-family','https://live.staticflickr.com/8392/8543057650_7e9bc06ab9_b.jpg'),
@('bundle-drinks','https://upload.wikimedia.org/wikipedia/commons/0/02/Stilles_Mineralwasser.jpg'),
@('bundle-frozen','https://upload.wikimedia.org/wikipedia/commons/8/83/Kuehlregal_USA.jpg')
)

$ok = 0; $bad = @()
foreach ($m in $map) {
  $name = $m[0]; $url = $m[1]
  $out = Join-Path $dir ($name + '.jpg')
  try {
    Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing -TimeoutSec 45 -Headers @{ 'User-Agent' = 'Mozilla/5.0 AyoolaSite/1.0' }
    $len = (Get-Item $out).Length
    if ($len -gt 4000) { $ok++ } else { $bad += "$name too small ($len)"; Remove-Item $out -Force }
  } catch { $bad += "$name :: " + $_.Exception.Message }
}
Write-Output "downloaded ok: $ok / $($map.Count)"
if ($bad.Count) { Write-Output "problems:"; $bad | ForEach-Object { Write-Output "  $_" } }
