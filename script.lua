-- ╔═══════════════════════════════════════════════════════════════╗
-- ║        Capybaras vs Plants — Stock Notifier                  ║
-- ║        Roblox → Railway                                     ║
-- ╚═══════════════════════════════════════════════════════════════╝

local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")
local Lighting = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Player = Players.LocalPlayer
local PlayerGui = Player:WaitForChild("PlayerGui")
local MainGui = PlayerGui:WaitForChild("MainGui")

-- Used by the merchant scanner below — a live server-side flag
-- plus the real remotes the server uses to push merchant state,
-- far more reliable than guessing via GUI text scraping.
local ServerInfo = ReplicatedStorage:WaitForChild("ServerInfo")
local Remotes = ReplicatedStorage:WaitForChild("Remotes")

-- ================================================================
-- CONFIG
-- ================================================================

local API_URL = "https://cvp-notifier-production.up.railway.app/api/update"

local API_KEY = ""

local SCAN_EVERY = 2

-- ================================================================
-- CLEAN OLD GUI
-- ================================================================

local oldGui = PlayerGui:FindFirstChild("CVPNotifier")

if oldGui then
    oldGui:Destroy()
end

-- ================================================================
-- HTTP FUNCTION
-- ================================================================

local function sendRequest(url, body)

    local headers = {
        ["Content-Type"] = "application/json"
    }

    if API_KEY ~= "" then
        headers["X-Api-Key"] = API_KEY
    end

    local requestFunction =
        request
        or http_request
        or (syn and syn.request)
        or (http and http.request)

    if not requestFunction then
        return false, "No HTTP request function found"
    end

    local success, response = pcall(function()

        return requestFunction({
            Url = url,
            Method = "POST",
            Headers = headers,
            Body = body
        })

    end)

    if not success then
        return false, tostring(response)
    end

    if not response then
        return false, "No response"
    end

    local statusCode = response.StatusCode or response.Status or 0

    if tonumber(statusCode) and tonumber(statusCode) >= 200
        and tonumber(statusCode) < 300 then

        return true, response.Body or ""

    end

    return false,
        "HTTP " ..
        tostring(statusCode) ..
        " " ..
        tostring(response.Body or "")

end

-- ================================================================
-- GUI
-- ================================================================

local ScreenGui = Instance.new("ScreenGui")

ScreenGui.Name = "CVPNotifier"
ScreenGui.ResetOnSpawn = false
ScreenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling

ScreenGui.Parent = PlayerGui

local Frame = Instance.new("Frame")

Frame.Size = UDim2.new(0, 320, 0, 125)
Frame.Position = UDim2.new(1, -330, 1, -135)

Frame.BackgroundColor3 = Color3.fromRGB(20, 20, 28)

Frame.BorderSizePixel = 0

Frame.Parent = ScreenGui

Instance.new("UICorner", Frame).CornerRadius = UDim.new(0, 8)

local Stroke = Instance.new("UIStroke", Frame)

Stroke.Color = Color3.fromRGB(50, 50, 70)
Stroke.Thickness = 1.5

local Title = Instance.new("TextLabel", Frame)

Title.Size = UDim2.new(1, -20, 0, 22)
Title.Position = UDim2.new(0, 10, 0, 7)

Title.BackgroundTransparency = 1

Title.Text = "🐾 CVP Notifier"

Title.TextColor3 = Color3.fromRGB(235, 235, 255)

Title.TextSize = 14
Title.Font = Enum.Font.GothamBold

Title.TextXAlignment = Enum.TextXAlignment.Left

local Status = Instance.new("TextLabel", Frame)

Status.Size = UDim2.new(1, -20, 0, 20)
Status.Position = UDim2.new(0, 10, 0, 31)

Status.BackgroundTransparency = 1

Status.Text = "Starting..."

Status.TextColor3 = Color3.fromRGB(160, 160, 180)

Status.TextSize = 11
Status.Font = Enum.Font.Gotham

Status.TextXAlignment = Enum.TextXAlignment.Left

local DataLabel = Instance.new("TextLabel", Frame)

DataLabel.Size = UDim2.new(1, -20, 0, 50)
DataLabel.Position = UDim2.new(0, 10, 0, 54)

DataLabel.BackgroundTransparency = 1

DataLabel.Text = ""

DataLabel.TextColor3 = Color3.fromRGB(100, 210, 130)

DataLabel.TextSize = 10
DataLabel.Font = Enum.Font.Gotham

DataLabel.TextXAlignment = Enum.TextXAlignment.Left
DataLabel.TextYAlignment = Enum.TextYAlignment.Top

DataLabel.TextWrapped = true

local Close = Instance.new("TextButton", Frame)

Close.Size = UDim2.new(0, 22, 0, 22)

Close.Position = UDim2.new(1, -27, 0, 5)

Close.BackgroundColor3 = Color3.fromRGB(200, 60, 60)

Close.BorderSizePixel = 0

Close.Text = "X"

Close.TextColor3 = Color3.new(1, 1, 1)

Close.TextSize = 11
Close.Font = Enum.Font.GothamBold

Instance.new("UICorner", Close).CornerRadius = UDim.new(0, 4)

Close.MouseButton1Click:Connect(function()

    ScreenGui:Destroy()

end)

-- ================================================================
-- MINIMIZE BUTTON
-- ================================================================

local TweenService = game:GetService("TweenService")

local FULL_HEIGHT = 125
local MIN_HEIGHT = 36

local Minimize = Instance.new("TextButton", Frame)

Minimize.Size = UDim2.new(0, 22, 0, 22)

Minimize.Position = UDim2.new(1, -53, 0, 5)

Minimize.BackgroundColor3 = Color3.fromRGB(60, 60, 80)

Minimize.BorderSizePixel = 0

Minimize.Text = "-"

Minimize.TextColor3 = Color3.new(1, 1, 1)

Minimize.TextSize = 14
Minimize.Font = Enum.Font.GothamBold

Instance.new("UICorner", Minimize).CornerRadius = UDim.new(0, 4)

local minimized = false

Minimize.MouseButton1Click:Connect(function()

    minimized = not minimized

    Status.Visible = not minimized
    DataLabel.Visible = not minimized

    Minimize.Text = minimized and "+" or "-"

    local targetHeight =
        minimized and MIN_HEIGHT or FULL_HEIGHT

    TweenService:Create(
        Frame,
        TweenInfo.new(0.18, Enum.EasingStyle.Quad),
        {
            Size = UDim2.new(0, 320, 0, targetHeight)
        }
    ):Play()

end)

-- ================================================================
-- UTILITY
-- ================================================================

local function lower(text)

    return tostring(text):lower()

end

local function getTextObjects(root)

    local results = {}

    if not root then
        return results
    end

    for _, object in ipairs(root:GetDescendants()) do

        if object:IsA("TextLabel")
            or object:IsA("TextButton")
            or object:IsA("TextBox") then

            if object.Text and object.Text ~= "" then

                table.insert(results, object)

            end

        end

    end

    return results

end

-- ================================================================
-- STOCK NUMBER
-- ================================================================

local function extractStock(text)

    if not text then
        return nil
    end

    text = tostring(text)

    -- x4
    local xNumber = text:match("[xX]%s*(%d+)")

    if xNumber then
        return tonumber(xNumber)
    end

    -- Stock: 4
    local stockNumber = text:match("[Ss]tock%s*:?%s*(%d+)")

    if stockNumber then
        return tonumber(stockNumber)
    end

    -- 4 in stock
    local inStock = text:match("(%d+)%s*[Ii]n [Ss]tock")

    if inStock then
        return tonumber(inStock)
    end

    return nil

end

-- ================================================================
-- FIND STOCK NEAR ITEM
-- ================================================================

local function findStock(itemObject)

    local current = itemObject

    for level = 1, 5 do

        if not current then
            break
        end

        for _, object in ipairs(current:GetDescendants()) do

            if object:IsA("TextLabel")
                or object:IsA("TextButton") then

                local stock = extractStock(object.Text)

                if stock ~= nil then
                    return stock
                end

                local txt = lower(object.Text)

                if txt:find("no stock")
                    or txt:find("out of stock")
                    or txt:find("sold out") then

                    return 0

                end

            end

        end

        current = current.Parent

    end

    return nil

end

-- ================================================================
-- EGG SHOP
-- ================================================================

local EggNames = {

    "Capybara Egg",
    "Alpha Capybara Egg",
    "Archer Capybara Egg",
    "Magic Capybara Egg",
    "Ghost Capybara Egg",
    "Golem Capybara Egg",
    "Robot Capybara Egg",
    "Disco Capybara Egg",
    "Angel Capybara Egg",

}

local function scanEggShop()

    local result = {}

    local found = {}

    local eventFolder = MainGui:FindFirstChild("Events")

    local toggle = MainGui:FindFirstChild("ToggleEggShopFrame", true)

    if toggle and toggle:IsA("BindableEvent") then

        pcall(function()
            toggle:Fire()
        end)

        task.wait(0.2)

    end

    for _, object in ipairs(getTextObjects(MainGui)) do

        local text = object.Text

        for _, eggName in ipairs(EggNames) do

            if text:find(eggName, 1, true) then

                if not found[eggName] then

                    found[eggName] = true

                    local stock = findStock(object)

                    if stock == nil then
                        stock = 0
                    end

                    result[eggName] = stock

                end

            end

        end

    end

    return result

end

-- ================================================================
-- GEAR SHOP
-- ================================================================

local GearNames = {

    "Hatch Hammer",
    "Nametag",
    "Mutation Sponge",
    "Boombox",
    "Bizarre Stopwatch"

}

local function scanGearShop()

    local result = {}

    local found = {}

    local toggle = MainGui:FindFirstChild("ToggleGearShopFrame", true)

    if toggle and toggle:IsA("BindableEvent") then

        pcall(function()
            toggle:Fire()
        end)

        task.wait(0.2)

    end

    for _, object in ipairs(getTextObjects(MainGui)) do

        local text = object.Text

        for _, gearName in ipairs(GearNames) do

            if text:find(gearName, 1, true) then

                if not found[gearName] then

                    found[gearName] = true

                    local stock = findStock(object)

                    if stock == nil then
                        stock = 0
                    end

                    result[gearName] = stock

                end

            end

        end

    end

    return result

end

-- ================================================================
-- MERCHANT — LIVE REMOTE STATE (this is the actual fix)
-- ================================================================
-- The GUI has NO text label that reliably holds the merchant's
-- identity (King Capybara / Martian / Timbles / Jester).
-- MerchantShopInfo only shows an intermittent "leaves in Xm Ys"
-- countdown, or is blank — reading it as the merchant's name is
-- what was silently breaking detection.
--
-- The real source of truth is the server pushing these remotes
-- directly, confirmed live:
--   Remotes.RequestMerchantStock:InvokeServer() -> name, stockTable
--   Remotes.UpdateTravelingMerchantStock(name, stockTable)  [pushed on change]
--   Remotes.MerchantLeft()                                  [pushed when merchant leaves]

local currentMerchantName = nil
local currentMerchantStock = nil -- { [itemName] = count }

local function formatStockText(count)

    if type(count) == "number" then

        if count > 0 then
            return "x" .. count .. " In stock"
        else
            return "NO STOCK"
        end

    end

    return tostring(count)

end

local function refreshMerchantFromServer()

    local RequestMerchantStock =
        Remotes:FindFirstChild("RequestMerchantStock")

    if not RequestMerchantStock then
        return
    end

    local ok, name, stock = pcall(function()
        return RequestMerchantStock:InvokeServer()
    end)

    if ok and typeof(name) == "string" and name ~= "" then
        currentMerchantName = name
        currentMerchantStock = stock
    end

end

-- Pull current state immediately in case a merchant is already
-- active when this script starts, so we don't have to wait for
-- the next UpdateTravelingMerchantStock push to learn about it.
do

    local active =
        ServerInfo:FindFirstChild("MERCHANT_ACTIVE")

    if active and active.Value then
        refreshMerchantFromServer()
    end

end

local updateMerchantEvent =
    Remotes:FindFirstChild("UpdateTravelingMerchantStock")

if updateMerchantEvent then

    updateMerchantEvent.OnClientEvent:Connect(function(name, stock)
        currentMerchantName = name
        currentMerchantStock = stock
    end)

end

local merchantLeftEvent =
    Remotes:FindFirstChild("MerchantLeft")

if merchantLeftEvent then

    merchantLeftEvent.OnClientEvent:Connect(function()
        currentMerchantName = nil
        currentMerchantStock = nil
    end)

end

-- Resolves the confirmed root frame the merchant (and other)
-- shop panels live under. Returns nil if it can't be found
-- within the timeout, rather than erroring the whole scan.
local function getShopRoot()

    local ok, root = pcall(function()

        return PlayerGui
            :WaitForChild("MainGui", 10)
            :WaitForChild("Root", 10)
            :WaitForChild("Frames", 10)

    end)

    if ok then
        return root
    end

    return nil

end

-- Reads the merchant's live countdown text directly from its
-- in-world billboard, rather than guessing from a fixed clock
-- cycle. Only used to DISPLAY the "leaves in" countdown — has
-- nothing to do with identifying WHICH merchant it is.
local function readMerchantCountdown()

    local ok, shop = pcall(function()

        return workspace
            :WaitForChild("World", 2)
            :WaitForChild("Map", 2)
            :FindFirstChild("TravelingMerchantShop")

    end)

    if not ok or not shop then
        return nil
    end

    local timerLabel = nil

    local billboardPart =
        shop:FindFirstChild("BillboardPart")

    if billboardPart then

        local cd =
            billboardPart:FindFirstChild("TravelingMerchantCountdown")

        local frame =
            cd and cd:FindFirstChild("Frame")

        timerLabel =
            frame and frame:FindFirstChild("Timer")

    end

    return timerLabel and timerLabel.Text or nil

end

local function scanMerchant()

    -- MERCHANT_ACTIVE is a real server-driven flag — trust it
    -- directly instead of guessing "is a merchant here" from
    -- GUI text.
    local active =
        ServerInfo:FindFirstChild("MERCHANT_ACTIVE")

    if not active or not active.Value then

        currentMerchantName = nil
        currentMerchantStock = nil

        return nil

    end

    if not currentMerchantName then

        -- MERCHANT_ACTIVE flipped true before our initial fetch
        -- or the push event caught up — try pulling once more
        -- before giving up on this scan.
        refreshMerchantFromServer()

    end

    if not currentMerchantName then

        warn("[CVP] MERCHANT_ACTIVE is true but no merchant identity has arrived yet from RequestMerchantStock / UpdateTravelingMerchantStock.")

        return nil

    end

    local items = {}

    if currentMerchantStock then

        for itemName, count in pairs(currentMerchantStock) do

            table.insert(items, {

                name = itemName,
                stock = formatStockText(count)

            })

        end

    end

    local timeLeft =
        readMerchantCountdown()

    print(
        "[CVP] Merchant scan result — name: " ..
        tostring(currentMerchantName) ..
        ", items found: " ..
        tostring(#items) ..
        ", timeLeft: " ..
        tostring(timeLeft)
    )

    return {

        name = currentMerchantName,
        timeLeft = timeLeft,
        items = items

    }

end

-- ================================================================
-- WEATHER
-- ================================================================

local WeatherNames = {

    "Night",
    "Rain",
    "Snowy",
    "Zen",
    "Meteor Shower",
    "Red Sun",
    "Heatwave",
    "Glitch",
    "Thunder",
    "Reverse Sun",
    "Taco Rain",
    "Blizzard"

}

local function identifyWeather()

    local found = {}
    local foundSet = {}

    local function addWeather(name)

        if name and not foundSet[name] then
            foundSet[name] = true
            table.insert(found, name)
        end

    end

    -- Sky-based (the game's primary ambient weather — usually
    -- just one, but doesn't rule out additional concurrent
    -- weather labels shown in the GUI below)

    local sky = Lighting:FindFirstChildWhichIsA("Sky")

    if sky then

        local profiles =
            MainGui:FindFirstChild("WeatherHandler")

        if profiles then

            profiles =
                profiles:FindFirstChild("Profiles")

        end

        if profiles then

            for _, profile in ipairs(profiles:GetChildren()) do

                local profileSky =
                    profile:FindFirstChildWhichIsA("Sky")

                if profileSky then

                    if profileSky.SkyboxBk == sky.SkyboxBk
                        and profileSky.SkyboxDn == sky.SkyboxDn
                        and profileSky.SkyboxFt == sky.SkyboxFt
                        and profileSky.SkyboxLf == sky.SkyboxLf
                        and profileSky.SkyboxRt == sky.SkyboxRt
                        and profileSky.SkyboxUp == sky.SkyboxUp then

                        if profile.Name ~= "Default" then

                            addWeather(profile.Name)

                        end

                    end

                end

            end

        end

    end

    -- GUI text — catches ALL currently active weather labels,
    -- not just the first match, since 2+ weathers can be active
    -- at the same time (e.g. Thunder AND Rain together).

    for _, object in ipairs(getTextObjects(MainGui)) do

        for _, weatherName in ipairs(WeatherNames) do

            if object.Text == weatherName then

                addWeather(weatherName)

            end

        end

    end

    if #found == 0 then
        return nil
    end

    return { names = found }

end

-- ================================================================
-- MAIN SCAN
-- ================================================================

local ScanNumber = 0

local function runScan()

    ScanNumber += 1

    Status.Text =
        "🔍 Scanning... #" ..
        tostring(ScanNumber)

    Status.TextColor3 =
        Color3.fromRGB(255, 200, 60)

    local eggShop = {}
    local gearShop = {}
    local merchant = nil
    local weather = nil

    local eggSuccess, eggResult =
        pcall(scanEggShop)

    if eggSuccess then
        eggShop = eggResult
    else
        warn("[CVP] Egg scanner error:", eggResult)
    end

    local gearSuccess, gearResult =
        pcall(scanGearShop)

    if gearSuccess then
        gearShop = gearResult
    else
        warn("[CVP] Gear scanner error:", gearResult)
    end

    local merchantSuccess, merchantResult =
        pcall(scanMerchant)

    if merchantSuccess then
        merchant = merchantResult
    else
        warn("[CVP] Merchant scanner error:", merchantResult)
    end

    local weatherSuccess, weatherResult =
        pcall(identifyWeather)

    if weatherSuccess then
        weather = weatherResult
    else
        warn("[CVP] Weather scanner error:", weatherResult)
    end

    local payload = {

        game = "Capybaras vs Plants",

        eggShop = eggShop,

        gearShop = gearShop,

        -- IMPORTANT: use `or false` here, not just `merchant`.
        -- If merchant is Lua nil, JSONEncode DROPS the key
        -- entirely instead of sending null — the API can't then
        -- tell "no merchant right now" apart from "this update
        -- just didn't mention merchant", and keeps showing the
        -- OLD merchant forever. Sending false is explicit and
        -- survives JSON encoding.
        merchant = merchant or false,

        weather = weather or false

    }

    local encoded

    local encodeSuccess, encodeResult =
        pcall(function()

            return HttpService:JSONEncode(payload)

        end)

    if not encodeSuccess then

        Status.Text = "❌ JSON encode failed"

        warn("[CVP] JSON error:", encodeResult)

        return

    end

    encoded = encodeResult

    print("======================================")
    print("[CVP] SCAN #" .. ScanNumber)
    print("======================================")

    print("Egg Shop:")
    print(HttpService:JSONEncode(eggShop))

    print("Gear Shop:")
    print(HttpService:JSONEncode(gearShop))

    print("Merchant:")
    print(HttpService:JSONEncode(merchant))

    print("Weather:")
    print(HttpService:JSONEncode(weather))

    print("Sending to Railway...")

    local success, response =
        sendRequest(API_URL, encoded)

    if success then

        Status.Text =
            "✅ Sent successfully #" ..
            tostring(ScanNumber)

        Status.TextColor3 =
            Color3.fromRGB(60, 210, 100)

        local eggInStock = 0

        for _, stock in pairs(eggShop) do
            if stock and stock > 0 then
                eggInStock += 1
            end
        end

        local gearInStock = 0

        for _, stock in pairs(gearShop) do
            if stock and stock > 0 then
                gearInStock += 1
            end
        end

        local weatherDisplay = "Clear"

        if weather and weather.names and #weather.names > 0 then
            weatherDisplay = table.concat(weather.names, ", ")
        end

        DataLabel.Text =
            "🥚 Eggs: " ..
            tostring(eggInStock) ..
            "/" ..
            tostring(#EggNames) ..
            " in stock" ..
            "\n⚙️ Gear: " ..
            tostring(gearInStock) ..
            "/" ..
            tostring(#GearNames) ..
            " in stock" ..
            "\n🚚 Merchant: " ..
            tostring(merchant and merchant.name or "None") ..
            "\n🌦 Weather: " ..
            weatherDisplay

        print("[CVP] Railway response:")
        print(response)

    else

        Status.Text =
            "❌ Railway failed"

        Status.TextColor3 =
            Color3.fromRGB(220, 70, 70)

        DataLabel.Text =
            tostring(response)

        warn("[CVP] Railway error:", response)

    end

end

-- ================================================================
-- START
-- ================================================================

print("======================================")
print("🐾 CVP NOTIFIER")
print("======================================")

print("MainGui:", MainGui:GetFullName())

print("API:", API_URL)

print("Starting scanner...")

Status.Text = "🟢 Running"

task.spawn(function()

    while ScreenGui.Parent do

        local success, errorMessage =
            pcall(runScan)

        if not success then

            warn(
                "[CVP] SCAN CRASH:",
                errorMessage
            )

            Status.Text =
                "❌ Scanner crashed"

            Status.TextColor3 =
                Color3.fromRGB(220, 70, 70)

            DataLabel.Text =
                tostring(errorMessage)

        end

        task.wait(SCAN_EVERY)

    end

end)

print("[CVP] Notifier started.")
