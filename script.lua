-- ╔═══════════════════════════════════════════════════════════════╗
-- ║        Capybaras vs Plants — Stock Notifier                  ║
-- ║        Roblox → Railway                                     ║
-- ╚═══════════════════════════════════════════════════════════════╝

local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")
local Lighting = game:GetService("Lighting")

local Player = Players.LocalPlayer
local PlayerGui = Player:WaitForChild("PlayerGui")
local MainGui = PlayerGui:WaitForChild("MainGui")

-- ================================================================
-- CONFIG
-- ================================================================

local API_URL = "https://cvp-notifier-production.up.railway.app/api/update"

local API_KEY = ""

local SCAN_EVERY = 30

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

        task.wait(0.5)

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

        task.wait(0.5)

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
-- MERCHANT
-- ================================================================

local MerchantItems = {

    "Gilded Hatch Hammer",
    "Gold Scroll",
    "Totem Of Status"

}

local MerchantNames = {

    "King Capybara",
    "Martian",
    "Timbles",
    "Jester"

}

local function scanMerchant()

    local result = {

        name = nil,
        remainingSeconds = nil,
        items = {}

    }

    local toggle = MainGui:FindFirstChild("ToggleMerchantShopFrame", true)

    if toggle and toggle:IsA("BindableEvent") then

        pcall(function()
            toggle:Fire()
        end)

        task.wait(0.5)

    end

    local texts = getTextObjects(MainGui)

    for _, object in ipairs(texts) do

        local text = object.Text

        -- Merchant name

        for _, merchantName in ipairs(MerchantNames) do

            if text:find(merchantName, 1, true) then

                result.name = merchantName

            end

        end

        -- Remaining time

        local minutes, seconds =
            text:match("(%d+):(%d+)")

        if minutes and seconds then

            result.remainingSeconds =
                tonumber(minutes) * 60 +
                tonumber(seconds)

        end

        -- Merchant items

        for _, itemName in ipairs(MerchantItems) do

            if text:find(itemName, 1, true) then

                local stock = findStock(object)

                if stock == nil then
                    stock = 1
                end

                result.items[itemName] = stock

            end

        end

    end

    if not result.name
        and not next(result.items) then

        return nil

    end

    return result

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

    -- First use Lighting Sky

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

                            return {

                                name = profile.Name

                            }

                        end

                    end

                end

            end

        end

    end

    -- Fallback to GUI text

    for _, object in ipairs(getTextObjects(MainGui)) do

        for _, weatherName in ipairs(WeatherNames) do

            if object.Text == weatherName then

                return {

                    name = weatherName

                }

            end

        end

    end

    return nil

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

        merchant = merchant,

        weather = weather

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

        DataLabel.Text =
            "🥚 Eggs: " ..
            tostring(#EggNames) ..
            "\n⚙️ Gear: " ..
            tostring(#GearNames) ..
            "\n🚚 Merchant: " ..
            tostring(merchant and merchant.name or "None") ..
            "\n🌦 Weather: " ..
            tostring(weather and weather.name or "Clear")

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
