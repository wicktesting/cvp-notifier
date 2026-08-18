--[[
╔═══════════════════════════════════════════════════════════════╗
║        Capybaras vs Plants — Stock Notifier                  ║
║        Roblox → Railway                                      ║
╚═══════════════════════════════════════════════════════════════╝

Includes:
• Egg Shop
• Gear Shop
• Traveling Merchant
• Weather
• Dr. Carrot Scrap Shop
]]

-- ================================================================
-- SERVICES
-- ================================================================

local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")
local Lighting = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Player = Players.LocalPlayer
local PlayerGui = Player:WaitForChild("PlayerGui")
local MainGui = PlayerGui:WaitForChild("MainGui")

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
-- HTTP
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

    local statusCode =
        response.StatusCode
        or response.Status
        or 0

    if tonumber(statusCode)
        and tonumber(statusCode) >= 200
        and tonumber(statusCode) < 300 then

        return true, response.Body or ""

    end

    return false,
        "HTTP "
        .. tostring(statusCode)
        .. " "
        .. tostring(response.Body or "")

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

Frame.Size = UDim2.new(0, 320, 0, 165)
Frame.Position = UDim2.new(1, -330, 1, -175)

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

DataLabel.Size = UDim2.new(1, -20, 0, 85)
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
-- MINIMIZE
-- ================================================================

local FULL_HEIGHT = 165
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

    local xNumber =
        text:match("[xX]%s*(%d+)")

    if xNumber then
        return tonumber(xNumber)
    end

    local stockNumber =
        text:match("[Ss]tock%s*:?[ ]*(%d+)")

    if stockNumber then
        return tonumber(stockNumber)
    end

    local inStock =
        text:match("(%d+)%s*[Ii]n [Ss]tock")

    if inStock then
        return tonumber(inStock)
    end

    return nil

end

-- ================================================================
-- FIND STOCK
-- ================================================================

local function findStock(itemObject)

    local current = itemObject

    for _ = 1, 5 do

        if not current then
            break
        end

        for _, object in ipairs(current:GetDescendants()) do

            if object:IsA("TextLabel")
                or object:IsA("TextButton") then

                local stock =
                    extractStock(object.Text)

                if stock ~= nil then
                    return stock
                end

                local txt =
                    lower(object.Text)

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
    "Angel Capybara Egg"

}

local function scanEggShop()

    local result = {}
    local found = {}

    local toggle =
        MainGui:FindFirstChild("ToggleEggShopFrame", true)

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

                    local stock =
                        findStock(object)

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

    local toggle =
        MainGui:FindFirstChild("ToggleGearShopFrame", true)

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

                    local stock =
                        findStock(object)

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
-- TRAVELING MERCHANT
-- ================================================================

local currentMerchantName = nil
local currentMerchantStock = nil

local function formatStockText(count)

    if type(count) == "number" then

        if count > 0 then
            return "x" .. count .. " In stock"
        end

        return "NO STOCK"

    end

    return tostring(count)

end

local function refreshMerchantFromServer()

    local requestMerchant =
        Remotes:FindFirstChild("RequestMerchantStock")

    if not requestMerchant then
        return
    end

    local ok, name, stock =
        pcall(function()
            return requestMerchant:InvokeServer()
        end)

    if ok
        and typeof(name) == "string"
        and name ~= "" then

        currentMerchantName = name
        currentMerchantStock = stock

    end

end

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

    updateMerchantEvent.OnClientEvent:Connect(
        function(name, stock)

            currentMerchantName = name
            currentMerchantStock = stock

        end
    )

end

local merchantLeftEvent =
    Remotes:FindFirstChild("MerchantLeft")

if merchantLeftEvent then

    merchantLeftEvent.OnClientEvent:Connect(function()

        currentMerchantName = nil
        currentMerchantStock = nil

    end)

end

local function readMerchantCountdown()

    local ok, shop =
        pcall(function()

            return workspace
                :WaitForChild("World", 2)
                :WaitForChild("Map", 2)
                :FindFirstChild("TravelingMerchantShop")

        end)

    if not ok or not shop then
        return nil
    end

    local billboardPart =
        shop:FindFirstChild("BillboardPart")

    if not billboardPart then
        return nil
    end

    local cd =
        billboardPart:FindFirstChild(
            "TravelingMerchantCountdown"
        )

    local frame =
        cd and cd:FindFirstChild("Frame")

    local timerLabel =
        frame and frame:FindFirstChild("Timer")

    return timerLabel and timerLabel.Text or nil

end

local function scanMerchant()

    local active =
        ServerInfo:FindFirstChild("MERCHANT_ACTIVE")

    if not active or not active.Value then

        currentMerchantName = nil
        currentMerchantStock = nil

        return nil

    end

    if not currentMerchantName then
        refreshMerchantFromServer()
    end

    if not currentMerchantName then
        return nil
    end

    local items = {}

    if currentMerchantStock then

        for itemName, count in pairs(currentMerchantStock) do

            table.insert(items, {
                name = tostring(itemName),
                stock = formatStockText(count)
            })

        end

    end

    return {

        name = currentMerchantName,

        timeLeft = readMerchantCountdown(),

        items = items

    }

end

-- ================================================================
-- WEATHER
-- ================================================================

local function identifyWeather()

    local weatherValue =
        ServerInfo:FindFirstChild("ACTIVE_WEATHERS")

    if not weatherValue then
        return nil
    end

    local raw = weatherValue.Value

    if raw == nil or raw == "" then
        return nil
    end

    local found = {}

    if typeof(raw) == "string" then

        for name in raw:gmatch("[^,;+]+") do

            name =
                name:match("^%s*(.-)%s*$")

            if name ~= "" then
                table.insert(found, name)
            end

        end

    elseif typeof(raw) == "table" then

        for _, name in ipairs(raw) do
            table.insert(found, tostring(name))
        end

    end

    if #found == 0 then
        return nil
    end

    return {
        names = found
    }

end

-- ================================================================
-- DR CARROT SHOP
-- ================================================================
--
-- Actual discovered structure:
--
-- MainGui
--   Root
--     Frames
--       DrCarrotShop
--         Details
--         List
--           ItemTemplate
--           EggTemplate
--
-- We DO NOT hardcode Capybara as the only item.
-- The game generates the actual shop entries.
--
-- ================================================================

local function getText(root, childName)

    if not root then
        return nil
    end

    local object =
        root:FindFirstChild(childName, true)

    if not object then
        return nil
    end

    if object:IsA("TextLabel")
        or object:IsA("TextButton")
        or object:IsA("TextBox") then

        return object.Text

    end

    return nil

end

local function getImage(root, childName)

    if not root then
        return nil
    end

    local object =
        root:FindFirstChild(childName, true)

    if object
        and object:IsA("ImageLabel") then

        return object.Image

    end

    return nil

end

local function readDrCarrotEntry(entry)

    if not entry or not entry:IsA("Frame") then
        return nil
    end

    local itemName =
        getText(entry, "Title")

    if not itemName or itemName == "" then
        return nil
    end

    local stockText =
        getText(entry, "Stock")

    local stock =
        extractStock(stockText)

    if stock == nil then
        stock = 0
    end

    local rarity =
        getText(entry, "Rarity")

    local description =
        getText(entry, "Description")

    local moneyCost = nil

    local buy =
        entry:FindFirstChild("Buy")

    if buy then

        local details =
            buy:FindFirstChild("Details")

        if details then

            local cost =
                details:FindFirstChild("Cost")

            if cost
                and cost:IsA("TextLabel") then

                moneyCost = cost.Text

            end

        end

    end

    local robuxCost = nil

    local robux =
        entry:FindFirstChild("BuyWithRobux")

    if robux then

        local details =
            robux:FindFirstChild("Details")

        if details then

            local cost =
                details:FindFirstChild("Cost")

            if cost
                and cost:IsA("TextLabel") then

                robuxCost = cost.Text

            end

        end

    end

    local image =
        getImage(entry, "Image")

    if not image then
        image = getImage(entry, "EggImage")
    end

    return {

        name = itemName,

        stock = stock,

        stockText = stockText,

        rarity = rarity,

        description = description,

        moneyCost = moneyCost,

        robuxCost = robuxCost,

        image = image

    }

end

local function scanDrCarrotShop()

    local result = {

        theme = "DrCarrot",

        restockTimer = nil,

        items = {}

    }

    local shop =
        MainGui
            :FindFirstChild("Root")
            and MainGui.Root:FindFirstChild("Frames")
            and MainGui.Root.Frames:FindFirstChild(
                "DrCarrotShop"
            )

    if not shop then

        return result

    end

    -- ------------------------------------------------------------
    -- RESTOCK TIMER
    -- ------------------------------------------------------------

    local details =
        shop:FindFirstChild("Details")

    if details then

        local background =
            details:FindFirstChild("Background")

        if background then

            local timer =
                background:FindFirstChild(
                    "RestockTimer"
                )

            if timer
                and timer:IsA("TextLabel") then

                result.restockTimer =
                    timer.Text

            end

        end

    end

    -- ------------------------------------------------------------
    -- SHOP LIST
    -- ------------------------------------------------------------

    local list =
        shop:FindFirstChild("List")

    if not list then
        return result
    end

    for _, child in ipairs(list:GetChildren()) do

        if child:IsA("Frame")
            and child.Name ~= "ItemTemplate"
            and child.Name ~= "EggTemplate" then

            local item =
                readDrCarrotEntry(child)

            if item then
                table.insert(result.items, item)
            end

        end

    end

    -- ------------------------------------------------------------
    -- FALLBACK
    --
    -- Some versions may leave the shop entry directly based
    -- on the template. This lets us see the currently populated
    -- template while debugging the new event.
    -- ------------------------------------------------------------

    if #result.items == 0 then

        local itemTemplate =
            list:FindFirstChild("ItemTemplate")

        if itemTemplate then

            local item =
                readDrCarrotEntry(itemTemplate)

            if item then

                item.template = true

                table.insert(
                    result.items,
                    item
                )

            end

        end

        local eggTemplate =
            list:FindFirstChild("EggTemplate")

        if eggTemplate then

            local item =
                readDrCarrotEntry(eggTemplate)

            if item then

                item.template = true

                table.insert(
                    result.items,
                    item
                )

            end

        end

    end

    return result

end

-- ================================================================
-- SCAN
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
    local drCarrotShop = nil

    -- ------------------------------------------------------------
    -- EGGS
    -- ------------------------------------------------------------

    local eggSuccess, eggResult =
        pcall(scanEggShop)

    if eggSuccess then
        eggShop = eggResult
    else
        warn("[CVP] Egg scanner error:", eggResult)
    end

    -- ------------------------------------------------------------
    -- GEAR
    -- ------------------------------------------------------------

    local gearSuccess, gearResult =
        pcall(scanGearShop)

    if gearSuccess then
        gearShop = gearResult
    else
        warn("[CVP] Gear scanner error:", gearResult)
    end

    -- ------------------------------------------------------------
    -- MERCHANT
    -- ------------------------------------------------------------

    local merchantSuccess, merchantResult =
        pcall(scanMerchant)

    if merchantSuccess then
        merchant = merchantResult
    else
        warn("[CVP] Merchant scanner error:", merchantResult)
    end

    -- ------------------------------------------------------------
    -- WEATHER
    -- ------------------------------------------------------------

    local weatherSuccess, weatherResult =
        pcall(identifyWeather)

    if weatherSuccess then
        weather = weatherResult
    else
        warn("[CVP] Weather scanner error:", weatherResult)
    end

    -- ------------------------------------------------------------
    -- DR CARROT
    -- ------------------------------------------------------------

    local drSuccess, drResult =
        pcall(scanDrCarrotShop)

    if drSuccess then
        drCarrotShop = drResult
    else
        warn(
            "[CVP] Dr Carrot scanner error:",
            drResult
        )
    end

    -- ------------------------------------------------------------
    -- PAYLOAD
    -- ------------------------------------------------------------

    local payload = {

        game = "Capybaras vs Plants",

        eggShop = eggShop,

        gearShop = gearShop,

        merchant = merchant or false,

        weather = weather or false,

        drCarrotShop =
            drCarrotShop or {
                theme = "DrCarrot",
                items = {}
            }

    }

    -- ------------------------------------------------------------
    -- ENCODE
    -- ------------------------------------------------------------

    local encodeSuccess, encoded =
        pcall(function()

            return HttpService:JSONEncode(payload)

        end)

    if not encodeSuccess then

        Status.Text =
            "❌ JSON encode failed"

        Status.TextColor3 =
            Color3.fromRGB(220, 70, 70)

        warn(
            "[CVP] JSON error:",
            encoded
        )

        return

    end

    -- ------------------------------------------------------------
    -- DEBUG
    -- ------------------------------------------------------------

    print("======================================")
    print("[CVP] SCAN #" .. ScanNumber)
    print("======================================")

    print("Egg Shop:")
    print(
        HttpService:JSONEncode(
            eggShop
        )
    )

    print("Gear Shop:")
    print(
        HttpService:JSONEncode(
            gearShop
        )
    )

    print("Merchant:")
    print(
        HttpService:JSONEncode(
            merchant
        )
    )

    print("Weather:")
    print(
        HttpService:JSONEncode(
            weather
        )
    )

    print("Dr Carrot Shop:")
    print(
        HttpService:JSONEncode(
            drCarrotShop
        )
    )

    print("Sending to Railway...")

    -- ------------------------------------------------------------
    -- SEND
    -- ------------------------------------------------------------

    local success, response =
        sendRequest(
            API_URL,
            encoded
        )

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

        local drCount = 0
        local drStock = 0

        if drCarrotShop
            and drCarrotShop.items then

            drCount =
                #drCarrotShop.items

            for _, item in ipairs(
                drCarrotShop.items
            ) do

                if item.stock
                    and item.stock > 0 then

                    drStock += 1

                end

            end

        end

        local weatherDisplay = "Clear"

        if weather
            and weather.names
            and #weather.names > 0 then

            weatherDisplay =
                table.concat(
                    weather.names,
                    ", "
                )

        end

        DataLabel.Text =
            "🥚 Eggs: "
            .. tostring(eggInStock)
            .. "/"
            .. tostring(#EggNames)
            .. " in stock"
            .. "\n⚙️ Gear: "
            .. tostring(gearInStock)
            .. "/"
            .. tostring(#GearNames)
            .. " in stock"
            .. "\n🥕 Dr Carrot: "
            .. tostring(drStock)
            .. "/"
            .. tostring(drCount)
            .. " in stock"
            .. "\n🚚 Merchant: "
            .. tostring(
                merchant
                and merchant.name
                or "None"
            )
            .. "\n🌦 Weather: "
            .. weatherDisplay

        print("[CVP] Railway response:")
        print(response)

    else

        Status.Text =
            "❌ Railway failed"

        Status.TextColor3 =
            Color3.fromRGB(220, 70, 70)

        DataLabel.Text =
            tostring(response)

        warn(
            "[CVP] Railway error:",
            response
        )

    end

end

-- ================================================================
-- START
-- ================================================================

print("======================================")
print("🐾 CVP NOTIFIER")
print("======================================")

print(
    "MainGui:",
    MainGui:GetFullName()
)

print(
    "API:",
    API_URL
)

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
                Color3.fromRGB(
                    220,
                    70,
                    70
                )

            DataLabel.Text =
                tostring(errorMessage)

        end

        task.wait(SCAN_EVERY)

    end

end)

print("[CVP] Notifier started.")
