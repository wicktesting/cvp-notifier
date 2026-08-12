    -- ╔═══════════════════════════════════════════════════════════════╗
-- ║     Capybaras vs Plants — Stock Notifier                     ║
-- ║     Scans Egg Shop, Gear Shop, Merchant, Weather             ║
-- ║     Pushes to Railway API every 30 seconds                   ║
-- ╚═══════════════════════════════════════════════════════════════╝

local HttpService  = game:GetService("HttpService")
local RunService   = game:GetService("RunService")
local Players      = game:GetService("Players")
local lp           = Players.LocalPlayer
local pg           = lp:WaitForChild("PlayerGui")

-- ══════════════════════════════════════════════
-- CONFIG — edit these
-- ══════════════════════════════════════════════
local API_URL     = "https://cvp-notifier-production.up.railway.app/api/update"
local API_KEY     = ""          -- set if you added UPDATE_API_KEY in Railway
local SCAN_EVERY  = 30          -- seconds between scans
-- ══════════════════════════════════════════════

-- Remove existing GUI if re-running
if pg:FindFirstChild("CVPNotifier") then
    pg:FindFirstChild("CVPNotifier"):Destroy()
end

-- ── HTTP helper ────────────────────────────────────────────────────────────────
local function httpPost(url, body)
    local headers = {["Content-Type"] = "application/json"}
    if API_KEY ~= "" then headers["X-Api-Key"] = API_KEY end
    local ok, err = pcall(function()
        request({
            Url    = url,
            Method = "POST",
            Headers = headers,
            Body   = body,
        })
    end)
    return ok, err
end

-- ── GUI ────────────────────────────────────────────────────────────────────────
local sg = Instance.new("ScreenGui", pg)
sg.Name = "CVPNotifier"
sg.ResetOnSpawn = false
sg.ZIndexBehavior = Enum.ZIndexBehavior.Sibling

local frame = Instance.new("Frame", sg)
frame.Size = UDim2.new(0, 260, 0, 90)
frame.Position = UDim2.new(1, -270, 1, -100)
frame.BackgroundColor3 = Color3.fromRGB(20, 20, 28)
frame.BorderSizePixel = 0
Instance.new("UICorner", frame).CornerRadius = UDim.new(0, 8)
local stroke = Instance.new("UIStroke", frame)
stroke.Color = Color3.fromRGB(40, 40, 60)
stroke.Thickness = 1.5

local titleLbl = Instance.new("TextLabel", frame)
titleLbl.Size = UDim2.new(1, -10, 0, 20)
titleLbl.Position = UDim2.new(0, 10, 0, 6)
titleLbl.BackgroundTransparency = 1
titleLbl.Text = "🐾 CVP Notifier"
titleLbl.TextColor3 = Color3.fromRGB(235, 235, 255)
titleLbl.TextSize = 13
titleLbl.Font = Enum.Font.GothamBold
titleLbl.TextXAlignment = Enum.TextXAlignment.Left

local statusLbl = Instance.new("TextLabel", frame)
statusLbl.Size = UDim2.new(1, -10, 0, 16)
statusLbl.Position = UDim2.new(0, 10, 0, 28)
statusLbl.BackgroundTransparency = 1
statusLbl.Text = "⏳ Starting..."
statusLbl.TextColor3 = Color3.fromRGB(130, 130, 165)
statusLbl.TextSize = 11
statusLbl.Font = Enum.Font.Gotham
statusLbl.TextXAlignment = Enum.TextXAlignment.Left

local dataLbl = Instance.new("TextLabel", frame)
dataLbl.Size = UDim2.new(1, -10, 0, 30)
dataLbl.Position = UDim2.new(0, 10, 0, 46)
dataLbl.BackgroundTransparency = 1
dataLbl.Text = ""
dataLbl.TextColor3 = Color3.fromRGB(100, 200, 120)
dataLbl.TextSize = 10
dataLbl.Font = Enum.Font.Gotham
dataLbl.TextXAlignment = Enum.TextXAlignment.Left
dataLbl.TextWrapped = true

local closeBtn = Instance.new("TextButton", frame)
closeBtn.Size = UDim2.new(0, 20, 0, 20)
closeBtn.Position = UDim2.new(1, -24, 0, 4)
closeBtn.BackgroundColor3 = Color3.fromRGB(210, 60, 60)
closeBtn.Text = "✕"
closeBtn.TextColor3 = Color3.new(1,1,1)
closeBtn.TextSize = 11
closeBtn.Font = Enum.Font.GothamBold
closeBtn.BorderSizePixel = 0
Instance.new("UICorner", closeBtn).CornerRadius = UDim.new(0, 4)
closeBtn.MouseButton1Click:Connect(function() sg:Destroy() end)

-- ── Scanner helpers ────────────────────────────────────────────────────────────
local function findGui(name)
    return pg:FindFirstChild(name)
end

local function getAllText(gui)
    local results = {}
    if not gui then return results end
    for _, v in pairs(gui:GetDescendants()) do
        if v:IsA("TextLabel") and v.Text ~= "" and v.Visible then
            table.insert(results, {text = v.Text, name = v.Name, path = v:GetFullName()})
        end
    end
    return results
end

-- ── Egg Shop Scanner ───────────────────────────────────────────────────────────
local function scanEggShop()
    local items = {}
    local seen = {}
    pcall(function()
        -- Look for egg shop GUI
        for _, guiName in ipairs({"EggShop", "ShopGui", "EggShopGui", "Shop"}) do
            local gui = findGui(guiName)
            if gui then
                for _, v in pairs(gui:GetDescendants()) do
                    if v:IsA("TextLabel") and v.Text ~= "" then
                        local t = v.Text
                        -- Look for egg names
                        if (t:find("Egg") or t:find("egg")) and not seen[t] then
                            local parent = v.Parent
                            local stockLabel = nil
                            local rarityLabel = nil
                            -- Check siblings for stock info
                            if parent then
                                for _, sib in pairs(parent:GetDescendants()) do
                                    if sib:IsA("TextLabel") then
                                        if sib.Text:lower():find("stock") or sib.Text:lower():find("x%d") then
                                            stockLabel = sib.Text
                                        end
                                        if sib.Text:lower():find("common") or sib.Text:lower():find("rare")
                                        or sib.Text:lower():find("epic") or sib.Text:lower():find("legendary")
                                        or sib.Text:lower():find("mythic") or sib.Text:lower():find("divine")
                                        or sib.Text:lower():find("godly") or sib.Text:lower():find("secret") then
                                            rarityLabel = sib.Text
                                        end
                                    end
                                end
                            end
                            seen[t] = true
                            table.insert(items, {
                                name = t,
                                stock = stockLabel or "Unknown",
                                rarity = rarityLabel or "Unknown"
                            })
                        end
                    end
                end
            end
        end
        
        -- Fallback: scan ALL GUI text for egg names from CVP data
        local eggNames = {
            "Capybara Egg", "Alpha Capybara Egg", "Archer Capybara Egg",
            "Magic Capybara Egg", "Ghost Capybara Egg", "Golem Capybara Egg",
            "Robot Capybara Egg", "Disco Capybara Egg", "Angel Capybara Egg",
            "VIP Capybara Egg", "Bounty Hunter Capybara Egg", "Timekeeper Capybara Egg",
            "King Mystery Egg", "Void Mystery Egg",
        }
        for _, egui in pairs(pg:GetChildren()) do
            for _, v in pairs(egui:GetDescendants()) do
                if v:IsA("TextLabel") and v.Text ~= "" and v.Visible then
                    for _, eName in ipairs(eggNames) do
                        if v.Text:find(eName) and not seen[eName] then
                            seen[eName] = true
                            -- Try to find stock from nearby labels
                            local stockTxt = "In Stock"
                            local par = v.Parent
                            if par then
                                for _, sib in pairs(par:GetDescendants()) do
                                    if sib:IsA("TextLabel") and (sib.Text:find("x%d") or sib.Text:lower():find("stock")) then
                                        stockTxt = sib.Text
                                    end
                                end
                            end
                            table.insert(items, {name = eName, stock = stockTxt, rarity = "Unknown"})
                        end
                    end
                end
            end
        end
    end)
    return items
end

-- ── Gear Shop Scanner ──────────────────────────────────────────────────────────
local function scanGearShop()
    local items = {}
    local seen = {}
    local gearNames = {
        "Hatch Hammer", "Nametag", "Mutation Sponge", "Boombox",
        "Bizarre Stopwatch", "Gilded Hatch Hammer", "Gold Scroll", "Raygun",
        "Moonlit Scroll", "Chilly Scroll", "Toasty Scroll", "Tranquil Scroll",
        "Shocked Scroll", "Glitched Scroll", "Rainbow Scroll",
        "Totem Of Fortune", "Totem Of Wealth", "Totem Of Marrow",
        "Totem Of Might", "Alien Tesla", "Totem Of Status", "Totem Of Stars",
        "Bounty Hunter Trophy",
    }
    pcall(function()
        for _, egui in pairs(pg:GetChildren()) do
            for _, v in pairs(egui:GetDescendants()) do
                if v:IsA("TextLabel") and v.Text ~= "" and v.Visible then
                    for _, gName in ipairs(gearNames) do
                        if v.Text:find(gName) and not seen[gName] then
                            seen[gName] = true
                            local stockTxt = "In Stock"
                            local rarityTxt = "Unknown"
                            local par = v.Parent
                            if par then
                                for _, sib in pairs(par:GetDescendants()) do
                                    if sib:IsA("TextLabel") then
                                        if sib.Text:find("x%d") or sib.Text:lower():find("stock") then
                                            stockTxt = sib.Text
                                        end
                                        if sib.Text:lower():find("common") or sib.Text:lower():find("rare")
                                        or sib.Text:lower():find("epic") or sib.Text:lower():find("legendary")
                                        or sib.Text:lower():find("mythic") or sib.Text:lower():find("divine") then
                                            rarityTxt = sib.Text
                                        end
                                    end
                                end
                            end
                            table.insert(items, {name = gName, stock = stockTxt, rarity = rarityTxt})
                        end
                    end
                end
            end
        end
    end)
    return items
end

-- ── Merchant Scanner ───────────────────────────────────────────────────────────
local function scanMerchant()
    local merchantNames = {"King Capybara", "Martian", "Timbles", "Jester"}
    local result = nil
    pcall(function()
        for _, egui in pairs(pg:GetChildren()) do
            for _, v in pairs(egui:GetDescendants()) do
                if v:IsA("TextLabel") and v.Text ~= "" and v.Visible then
                    for _, mName in ipairs(merchantNames) do
                        if v.Text:find(mName) then
                            -- Found a merchant! Get their items
                            local items = {}
                            local timeLeft = nil
                            local par = v.Parent
                            if par then
                                for _, sib in pairs(par:GetDescendants()) do
                                    if sib:IsA("TextLabel") and sib ~= v then
                                        if sib.Text:find("%d+:%d+") or sib.Text:lower():find("leave") then
                                            timeLeft = sib.Text
                                        end
                                    end
                                end
                            end
                            -- Scan nearby for merchant items
                            local gearNames = {
                                "Gilded Hatch Hammer", "Gold Scroll", "Totem Of Status",
                                "Raygun", "Alien Tesla", "Totem Of Stars",
                                "Totem Of Might", "Totem Of Marrow", "Rainbow Scroll",
                                "Moonlit Scroll", "Chilly Scroll", "Toasty Scroll",
                                "Tranquil Scroll", "Shocked Scroll", "Glitched Scroll",
                            }
                            for _, egui2 in pairs(pg:GetChildren()) do
                                for _, v2 in pairs(egui2:GetDescendants()) do
                                    if v2:IsA("TextLabel") and v2.Visible then
                                        for _, gName in ipairs(gearNames) do
                                            if v2.Text:find(gName) then
                                                table.insert(items, {name = gName, stock = "1"})
                                            end
                                        end
                                    end
                                end
                            end
                            result = {
                                name = mName,
                                active = true,
                                timeLeft = timeLeft,
                                items = items
                            }
                            break
                        end
                    end
                    if result then break end
                end
            end
            if result then break end
        end
    end)
    return result
end

-- ── Weather Scanner ────────────────────────────────────────────────────────────
local function scanWeather()
    local weatherNames = {
        "Night", "Rain", "Snowy", "Zen", "Meteor Shower",
        "Red Sun", "Heatwave", "Glitch", "Thunderstorm",
    }
    local found = nil
    pcall(function()
        for _, egui in pairs(pg:GetChildren()) do
            for _, v in pairs(egui:GetDescendants()) do
                if v:IsA("TextLabel") and v.Text ~= "" and v.Visible then
                    for _, wName in ipairs(weatherNames) do
                        if v.Text == wName or v.Text:find(wName) then
                            found = wName
                            break
                        end
                    end
                end
                if found then break end
            end
            if found then break end
        end
    end)
    return found
end

-- ── Main scan and push ─────────────────────────────────────────────────────────
local scanCount = 0

local function runScan()
    scanCount = scanCount + 1
    statusLbl.Text = "🔍 Scanning... (#" .. scanCount .. ")"
    statusLbl.TextColor3 = Color3.fromRGB(255, 200, 50)

    local eggShop  = scanEggShop()
    local gearShop = scanGearShop()
    local merchant = scanMerchant()
    local weather  = scanWeather()

    local payload = HttpService:JSONEncode({
        game     = "Capybaras vs Plants",
        eggShop  = eggShop,
        gearShop = gearShop,
        merchant = merchant,
        weather  = weather,
    })

    local ok, err = httpPost(API_URL, payload)

    if ok then
        statusLbl.Text = "✅ Sent #" .. scanCount .. " • " .. os.date("%H:%M:%S")
        statusLbl.TextColor3 = Color3.fromRGB(50, 200, 100)
        dataLbl.Text = "🥚 " .. #eggShop .. " eggs  ⚙️ " .. #gearShop .. " gear  "
            .. (merchant and "🚚 " .. merchant.name or "🚚 No merchant")
            .. "  " .. (weather and "🌦 " .. weather or "☀️ Clear")
    else
        statusLbl.Text = "❌ Failed: " .. tostring(err):sub(1, 40)
        statusLbl.TextColor3 = Color3.fromRGB(210, 60, 60)
    end
end

-- ── Auto scan loop ─────────────────────────────────────────────────────────────
statusLbl.Text = "🟢 Running — scans every " .. SCAN_EVERY .. "s"
statusLbl.TextColor3 = Color3.fromRGB(50, 200, 100)

task.spawn(function()
    while sg and sg.Parent do
        local ok2, err2 = pcall(runScan)
        if not ok2 then
            statusLbl.Text = "❌ Error: " .. tostring(err2):sub(1,40)
            statusLbl.TextColor3 = Color3.fromRGB(210, 60, 60)
        end
        task.wait(SCAN_EVERY)
    end
end)

print("[CVP Notifier] Started! Pushing to " .. API_URL)
