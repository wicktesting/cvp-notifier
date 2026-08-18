-- ╔═══════════════════════════════════════════════════════════════╗
-- ║        Capybaras vs Plants — Stock Notifier                  ║
-- ║        Roblox → Railway                                      ║
-- ║                                                               ║
-- ║  Tracks:                                                       ║
-- ║   • Egg Shop                                                   ║
-- ║   • Gear Shop                                                  ║
-- ║   • Traveling Merchant                                        ║
-- ║   • Weather                                                    ║
-- ║   • Dr Carrot Scrap Shop                                       ║
-- ║   • Bounties                                                    ║
-- ╚═══════════════════════════════════════════════════════════════╝


-- ================================================================
-- SERVICES
-- ================================================================

local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")


-- ================================================================
-- PLAYER / GUI
-- ================================================================

local Player = Players.LocalPlayer

local PlayerGui =
    Player:WaitForChild("PlayerGui")

local MainGui =
    PlayerGui:WaitForChild("MainGui")


-- ================================================================
-- REPLICATED STORAGE
-- ================================================================

local ServerInfo =
    ReplicatedStorage:WaitForChild("ServerInfo")

local Remotes =
    ReplicatedStorage:WaitForChild("Remotes")


-- ================================================================
-- CONFIG
-- ================================================================

local API_URL =
    "https://cvp-notifier-production.up.railway.app/api/update"

local API_KEY = ""

local SCAN_EVERY = 2


-- ================================================================
-- CLEAN OLD GUI
-- ================================================================

local oldGui =
    PlayerGui:FindFirstChild("CVPNotifier")

if oldGui then
    oldGui:Destroy()
end


-- ================================================================
-- HTTP REQUEST
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

    local success, response =
        pcall(function()

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
-- NOTIFIER GUI
-- ================================================================

local ScreenGui =
    Instance.new("ScreenGui")

ScreenGui.Name =
    "CVPNotifier"

ScreenGui.ResetOnSpawn =
    false

ScreenGui.ZIndexBehavior =
    Enum.ZIndexBehavior.Sibling

ScreenGui.Parent =
    PlayerGui


local Frame =
    Instance.new("Frame")

Frame.Size =
    UDim2.new(0, 350, 0, 175)

Frame.Position =
    UDim2.new(1, -360, 1, -185)

Frame.BackgroundColor3 =
    Color3.fromRGB(20, 20, 28)

Frame.BorderSizePixel =
    0

Frame.Parent =
    ScreenGui

Instance.new(
    "UICorner",
    Frame
).CornerRadius =
    UDim.new(0, 8)


local Stroke =
    Instance.new("UIStroke", Frame)

Stroke.Color =
    Color3.fromRGB(50, 50, 70)

Stroke.Thickness =
    1.5


local Title =
    Instance.new("TextLabel", Frame)

Title.Size =
    UDim2.new(1, -20, 0, 22)

Title.Position =
    UDim2.new(0, 10, 0, 7)

Title.BackgroundTransparency =
    1

Title.Text =
    "🐾 CVP Notifier"

Title.TextColor3 =
    Color3.fromRGB(235, 235, 255)

Title.TextSize =
    14

Title.Font =
    Enum.Font.GothamBold

Title.TextXAlignment =
    Enum.TextXAlignment.Left


local Status =
    Instance.new("TextLabel", Frame)

Status.Size =
    UDim2.new(1, -20, 0, 20)

Status.Position =
    UDim2.new(0, 10, 0, 31)

Status.BackgroundTransparency =
    1

Status.Text =
    "Starting..."

Status.TextColor3 =
    Color3.fromRGB(160, 160, 180)

Status.TextSize =
    11

Status.Font =
    Enum.Font.Gotham

Status.TextXAlignment =
    Enum.TextXAlignment.Left


local DataLabel =
    Instance.new("TextLabel", Frame)

DataLabel.Size =
    UDim2.new(1, -20, 0, 100)

DataLabel.Position =
    UDim2.new(0, 10, 0, 54)

DataLabel.BackgroundTransparency =
    1

DataLabel.Text =
    ""

DataLabel.TextColor3 =
    Color3.fromRGB(100, 210, 130)

DataLabel.TextSize =
    10

DataLabel.Font =
    Enum.Font.Gotham

DataLabel.TextXAlignment =
    Enum.TextXAlignment.Left

DataLabel.TextYAlignment =
    Enum.TextYAlignment.Top

DataLabel.TextWrapped =
    true


local Close =
    Instance.new("TextButton", Frame)

Close.Size =
    UDim2.new(0, 22, 0, 22)

Close.Position =
    UDim2.new(1, -27, 0, 5)

Close.BackgroundColor3 =
    Color3.fromRGB(200, 60, 60)

Close.BorderSizePixel =
    0

Close.Text =
    "X"

Close.TextColor3 =
    Color3.new(1, 1, 1)

Close.TextSize =
    11

Close.Font =
    Enum.Font.GothamBold

Instance.new(
    "UICorner",
    Close
).CornerRadius =
    UDim.new(0, 4)


Close.MouseButton1Click:Connect(function()

    ScreenGui:Destroy()

end)


-- ================================================================
-- MINIMIZE
-- ================================================================

local FULL_HEIGHT = 175
local MIN_HEIGHT = 36

local Minimize =
    Instance.new("TextButton", Frame)

Minimize.Size =
    UDim2.new(0, 22, 0, 22)

Minimize.Position =
    UDim2.new(1, -53, 0, 5)

Minimize.BackgroundColor3 =
    Color3.fromRGB(60, 60, 80)

Minimize.BorderSizePixel =
    0

Minimize.Text =
    "-"

Minimize.TextColor3 =
    Color3.new(1, 1, 1)

Minimize.TextSize =
    14

Minimize.Font =
    Enum.Font.GothamBold

Instance.new(
    "UICorner",
    Minimize
).CornerRadius =
    UDim.new(0, 4)


local minimized = false


Minimize.MouseButton1Click:Connect(function()

    minimized =
        not minimized

    Status.Visible =
        not minimized

    DataLabel.Visible =
        not minimized

    Minimize.Text =
        minimized
        and "+"
        or "-"

    local targetHeight =
        minimized
        and MIN_HEIGHT
        or FULL_HEIGHT

    TweenService:Create(
        Frame,
        TweenInfo.new(
            0.18,
            Enum.EasingStyle.Quad
        ),
        {
            Size =
                UDim2.new(
                    0,
                    350,
                    0,
                    targetHeight
                )
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

    for _, object in
        ipairs(root:GetDescendants()) do

        if object:IsA("TextLabel")
            or object:IsA("TextButton")
            or object:IsA("TextBox") then

            if object.Text
                and object.Text ~= "" then

                table.insert(
                    results,
                    object
                )

            end

        end

    end

    return results

end


local function findFramesRoot()

    local root =
        MainGui:FindFirstChild("Root")

    if not root then
        return nil
    end

    return root:FindFirstChild("Frames")

end


local function findShopFrame(name)

    local frames =
        findFramesRoot()

    if not frames then
        return nil
    end

    return frames:FindFirstChild(name)

end


-- ================================================================
-- STOCK PARSING
-- ================================================================

local function extractStock(text)

    if not text then
        return nil
    end

    text =
        tostring(text)

    local xNumber =
        text:match(
            "[xX]%s*(%d+)"
        )

    if xNumber then
        return tonumber(xNumber)
    end

    local stockNumber =
        text:match(
            "[Ss]tock%s*:?%s*(%d+)"
        )

    if stockNumber then
        return tonumber(stockNumber)
    end

    local inStock =
        text:match(
            "(%d+)%s*[Ii]n [Ss]tock"
        )

    if inStock then
        return tonumber(inStock)
    end

    return nil

end


local function findStock(itemObject)

    local current =
        itemObject

    for level = 1, 5 do

        if not current then
            break
        end

        for _, object in
            ipairs(current:GetDescendants()) do

            if object:IsA("TextLabel")
                or object:IsA("TextButton") then

                local stock =
                    extractStock(
                        object.Text
                    )

                if stock ~= nil then
                    return stock
                end

                local text =
                    lower(object.Text)

                if text:find("no stock")
                    or text:find("out of stock")
                    or text:find("sold out") then

                    return 0

                end

            end

        end

        current =
            current.Parent

    end

    return nil

end


-- ================================================================
-- GENERIC SHOP SCANNER
-- ================================================================

local function scanNamedShop(
    frameName,
    toggleName,
    itemNames
)

    local result = {}
    local found = {}

    local shop =
        findShopFrame(frameName)

    local toggle =
        MainGui:FindFirstChild(
            toggleName,
            true
        )

    if toggle
        and toggle:IsA("BindableEvent") then

        pcall(function()
            toggle:Fire()
        end)

        task.wait(0.25)

        shop =
            findShopFrame(frameName)
            or shop

    end

    local searchRoot =
        shop or MainGui

    for _, object in
        ipairs(
            getTextObjects(searchRoot)
        ) do

        local text =
            tostring(object.Text)

        for _, itemName in
            ipairs(itemNames) do

            if text:find(
                itemName,
                1,
                true
            ) then

                if not found[itemName] then

                    found[itemName] =
                        true

                    local stock =
                        findStock(object)

                    if stock == nil then
                        stock = 0
                    end

                    result[itemName] =
                        stock

                end

            end

        end

    end

    return result

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

    return scanNamedShop(
        "EggShop",
        "ToggleEggShopFrame",
        EggNames
    )

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

    return scanNamedShop(
        "GearShop",
        "ToggleGearShopFrame",
        GearNames
    )

end


-- ================================================================
-- LAST GOOD SHOP DATA
-- ================================================================

local lastGoodEggShop = nil
local lastGoodGearShop = nil


local function useLastGoodShopData(
    current,
    previous
)

    if type(current) ~= "table" then
        return previous or {}
    end

    if next(current) ~= nil then
        return current
    end

    return previous or {}

end


-- ================================================================
-- MERCHANT
-- ================================================================

local currentMerchantName = nil
local currentMerchantStock = nil


local function formatStockText(count)

    if type(count) == "number" then

        if count > 0 then
            return "x"
                .. tostring(count)
                .. " In stock"
        end

        return "NO STOCK"

    end

    return tostring(count)

end


local function refreshMerchantFromServer()

    local remote =
        Remotes:FindFirstChild(
            "RequestMerchantStock"
        )

    if not remote then
        return
    end

    local success, name, stock =
        pcall(function()

            return remote:InvokeServer()

        end)

    if success
        and typeof(name) == "string"
        and name ~= "" then

        currentMerchantName =
            name

        currentMerchantStock =
            stock

    end

end


do

    local active =
        ServerInfo:FindFirstChild(
            "MERCHANT_ACTIVE"
        )

    if active
        and active.Value then

        refreshMerchantFromServer()

    end

end


local merchantUpdate =
    Remotes:FindFirstChild(
        "UpdateTravelingMerchantStock"
    )

if merchantUpdate then

    merchantUpdate.OnClientEvent:Connect(
        function(name, stock)

            currentMerchantName =
                name

            currentMerchantStock =
                stock

        end
    )

end


local merchantLeft =
    Remotes:FindFirstChild(
        "MerchantLeft"
    )

if merchantLeft then

    merchantLeft.OnClientEvent:Connect(
        function()

            currentMerchantName =
                nil

            currentMerchantStock =
                nil

        end
    )

end


local function readMerchantCountdown()

    local ok, shop =
        pcall(function()

            return workspace
                :WaitForChild(
                    "World",
                    2
                )
                :WaitForChild(
                    "Map",
                    2
                )
                :FindFirstChild(
                    "TravelingMerchantShop"
                )

        end)

    if not ok
        or not shop then

        return nil

    end

    local billboard =
        shop:FindFirstChild(
            "BillboardPart"
        )

    if not billboard then
        return nil
    end

    local countdown =
        billboard:FindFirstChild(
            "TravelingMerchantCountdown"
        )

    local frame =
        countdown
        and countdown:FindFirstChild(
            "Frame"
        )

    local timer =
        frame
        and frame:FindFirstChild(
            "Timer"
        )

    return timer
        and timer.Text
        or nil

end


local function scanMerchant()

    local active =
        ServerInfo:FindFirstChild(
            "MERCHANT_ACTIVE"
        )

    if not active
        or not active.Value then

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

    if type(currentMerchantStock)
        == "table" then

        for itemName, count in
            pairs(currentMerchantStock) do

            table.insert(
                items,
                {
                    name =
                        tostring(itemName),

                    stock =
                        formatStockText(count)
                }
            )

        end

    end

    return {

        name =
            currentMerchantName,

        timeLeft =
            readMerchantCountdown(),

        items =
            items

    }

end


-- ================================================================
-- WEATHER
-- ================================================================

local function identifyWeather()

    local value =
        ServerInfo:FindFirstChild(
            "ACTIVE_WEATHERS"
        )

    if not value then

        warn(
            "[CVP] ACTIVE_WEATHERS not found"
        )

        return nil

    end

    local raw =
        value.Value

    if raw == nil
        or raw == "" then

        return nil

    end

    local found = {}

    if typeof(raw) == "string" then

        for name in
            raw:gmatch(
                "[^,;+]+"
            ) do

            name =
                name:match(
                    "^%s*(.-)%s*$"
                )

            if name ~= "" then
                table.insert(
                    found,
                    name
                )
            end

        end

    elseif typeof(raw) == "table" then

        for _, name in
            ipairs(raw) do

            table.insert(
                found,
                tostring(name)
            )

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
-- DR CARROT SCRAP SHOP
--
-- Confirmed source:
-- UpdateEventShopStock(payload)
--
-- Payload:
--   Theme
--   RestockUntil
--   ThemePurchases
--   Stock
--
-- Theme must be "DrCarrot".
-- ================================================================

local currentScrapShop = nil


local function normalizeScrapShopPayload(
    payload
)

    if type(payload) ~= "table" then
        return nil
    end

    local theme =
        payload.Theme
        or payload.theme

    if theme ~= "DrCarrot" then
        return nil
    end

    local rawStock =
        payload.Stock
        or payload.stock
        or {}

    local purchases =
        payload.ThemePurchases
        or payload.themePurchases
        or {}

    local items = {}

    for itemName, itemData in
        pairs(rawStock) do

        local stock = 0
        local rarity = nil
        local description = nil
        local scrap = nil
        local cost = nil
        local image = nil
        local devProductId = nil
        local tower = nil

        if type(itemData) == "table" then

            stock =
                tonumber(
                    itemData.Stock
                    or itemData.stock
                    or 0
                )
                or 0

            rarity =
                itemData.Rarity
                or itemData.rarity

            description =
                itemData.Description
                or itemData.description

            scrap =
                itemData.Scrap
                or itemData.ScrapCost

            cost =
                itemData.Cost
                or itemData.Price

            image =
                itemData.ImageID
                or itemData.Image

            devProductId =
                itemData.DevProductID

            tower =
                itemData.CorrespondingTowerName

        else

            stock =
                tonumber(itemData)
                or 0

        end

        local purchased =
            tonumber(
                purchases[itemName]
            )
            or 0

        stock =
            math.max(
                0,
                stock - purchased
            )

        table.insert(
            items,
            {
                name =
                    tostring(itemName),

                stock =
                    stock,

                rarity =
                    rarity,

                description =
                    description,

                scrap =
                    scrap,

                cost =
                    cost,

                image =
                    image,

                devProductId =
                    devProductId,

                correspondingTower =
                    tower
            }
        )

    end

    return {

        theme = "DrCarrot",

        restockUntil =
            payload.RestockUntil
            or payload.restockUntil,

        restocked =
            payload.Restocked == true,

        items =
            items

    }

end


local eventShopUpdate =
    Remotes:FindFirstChild(
        "UpdateEventShopStock"
    )

if eventShopUpdate then

    eventShopUpdate.OnClientEvent:Connect(
        function(payload)

            local normalized =
                normalizeScrapShopPayload(
                    payload
                )

            if normalized then

                currentScrapShop =
                    normalized

                print(
                    "[CVP] Dr Carrot Scrap Shop updated:",
                    #normalized.items,
                    "items"
                )

            end

        end
    )

else

    warn(
        "[CVP] UpdateEventShopStock not found"
    )

end


local function scanDrCarrotShop()

    if currentScrapShop then
        return currentScrapShop
    end

    local shop =
        findShopFrame(
            "DrCarrotShop"
        )

    if not shop then
        return nil
    end

    local list =
        shop:FindFirstChild(
            "List"
        )

    if not list then
        return nil
    end

    local items = {}

    for _, frame in
        ipairs(list:GetChildren()) do

        if frame:IsA("Frame") then

            local title =
                frame:FindFirstChild(
                    "Title",
                    true
                )

            if title
                and title:IsA("TextLabel")
                and title.Text ~= "" then

                local stockLabel =
                    frame:FindFirstChild(
                        "Stock",
                        true
                    )

                local stock =
                    extractStock(
                        stockLabel
                        and stockLabel.Text
                    )

                if stock == nil then
                    stock = findStock(frame)
                end

                if stock == nil then
                    stock = 0
                end

                local rarity =
                    frame:FindFirstChild(
                        "Rarity",
                        true
                    )

                local description =
                    frame:FindFirstChild(
                        "Description",
                        true
                    )

                table.insert(
                    items,
                    {
                        name =
                            title.Text,

                        stock =
                            stock,

                        rarity =
                            rarity
                            and rarity.Text
                            or nil,

                        description =
                            description
                            and description.Text
                            or nil
                    }
                )

            end

        end

    end

    if #items == 0 then
        return nil
    end

    return {

        theme = "DrCarrot",

        restockUntil = nil,

        items =
            items

    }

end


-- ================================================================
-- BOUNTIES
--
-- Confirmed:
-- RequestBounties
-- BountiesUpdated
-- TurnInBounty
-- RequestBountySkip
--
-- Easy = 3 tokens
-- Hard = 5 tokens
-- Rotation = 900 seconds
-- ================================================================

local currentBounties = nil


local function normalizeBountyPayload(
    payload
)

    if type(payload) ~= "table" then
        return nil
    end

    if payload.Bounties
        and type(payload.Bounties)
            == "table" then

        return payload.Bounties

    end

    if payload.bounties
        and type(payload.bounties)
            == "table" then

        return payload.bounties

    end

    if payload.Current
        and type(payload.Current)
            == "table" then

        return payload.Current

    end

    if payload.current
        and type(payload.current)
            == "table" then

        return payload.current

    end

    return payload

end


local function requestCurrentBounties()

    local remote =
        Remotes:FindFirstChild(
            "RequestBounties"
        )

    if not remote then

        warn(
            "[CVP] RequestBounties not found"
        )

        return nil

    end

    local success, result =
        pcall(function()

            return remote:InvokeServer()

        end)

    if not success then

        warn(
            "[CVP] RequestBounties failed:",
            result
        )

        return nil

    end

    local normalized =
        normalizeBountyPayload(
            result
        )

    if normalized then

        currentBounties =
            normalized

    end

    return normalized

end


local bountiesUpdated =
    Remotes:FindFirstChild(
        "BountiesUpdated"
    )

if bountiesUpdated then

    bountiesUpdated.OnClientEvent:Connect(
        function(payload)

            local normalized =
                normalizeBountyPayload(
                    payload
                )

            if normalized then

                currentBounties =
                    normalized

                print(
                    "[CVP] Bounties updated"
                )

            end

        end
    )

end


task.spawn(function()

    task.wait(2)

    requestCurrentBounties()

end)


-- ================================================================
-- SAFE JSON CONVERSION
--
-- Remote data is normally JSON-compatible, but this prevents
-- one unexpected Roblox userdata/function/Instance from killing
-- the entire scan.
-- ================================================================

local function sanitizeForJson(
    value,
    depth
)

    depth =
        depth or 0

    if depth > 8 then
        return nil
    end

    local valueType =
        typeof(value)

    if value == nil then
        return nil
    end

    if valueType == "string"
        or valueType == "number"
        or valueType == "boolean" then

        return value

    end

    if valueType ~= "table" then
        return tostring(value)
    end

    local result = {}

    for key, child in
        pairs(value) do

        local safeChild =
            sanitizeForJson(
                child,
                depth + 1
            )

        if safeChild ~= nil then

            result[tostring(key)] =
                safeChild

        end

    end

    return result

end


-- ================================================================
-- MAIN SCAN
-- ================================================================

local ScanNumber = 0


local function runScan()

    ScanNumber += 1

    Status.Text =
        "🔍 Scanning... #"
        .. tostring(ScanNumber)

    Status.TextColor3 =
        Color3.fromRGB(
            255,
            200,
            60
        )


    -- ------------------------------------------------------------
    -- EGG SHOP
    -- ------------------------------------------------------------

    local eggShop = {}

    local eggSuccess, eggResult =
        pcall(scanEggShop)

    if eggSuccess then

        eggShop =
            useLastGoodShopData(
                eggResult,
                lastGoodEggShop
            )

        if next(eggShop) ~= nil then
            lastGoodEggShop =
                eggShop
        end

    else

        warn(
            "[CVP] Egg scanner error:",
            eggResult
        )

        eggShop =
            lastGoodEggShop
            or {}

    end


    -- ------------------------------------------------------------
    -- GEAR SHOP
    -- ------------------------------------------------------------

    local gearShop = {}

    local gearSuccess, gearResult =
        pcall(scanGearShop)

    if gearSuccess then

        gearShop =
            useLastGoodShopData(
                gearResult,
                lastGoodGearShop
            )

        if next(gearShop) ~= nil then
            lastGoodGearShop =
                gearShop
        end

    else

        warn(
            "[CVP] Gear scanner error:",
            gearResult
        )

        gearShop =
            lastGoodGearShop
            or {}

    end


    -- ------------------------------------------------------------
    -- MERCHANT
    -- ------------------------------------------------------------

    local merchant = nil

    local merchantSuccess,
        merchantResult =
        pcall(scanMerchant)

    if merchantSuccess then
        merchant =
            merchantResult
    else
        warn(
            "[CVP] Merchant scanner error:",
            merchantResult
        )
    end


    -- ------------------------------------------------------------
    -- WEATHER
    -- ------------------------------------------------------------

    local weather = nil

    local weatherSuccess,
        weatherResult =
        pcall(identifyWeather)

    if weatherSuccess then
        weather =
            weatherResult
    else
        warn(
            "[CVP] Weather scanner error:",
            weatherResult
        )
    end


    -- ------------------------------------------------------------
    -- DR CARROT
    -- ------------------------------------------------------------

    local scrapShop = nil

    local scrapSuccess,
        scrapResult =
        pcall(scanDrCarrotShop)

    if scrapSuccess then
        scrapShop =
            scrapResult
    else
        warn(
            "[CVP] Scrap Shop scanner error:",
            scrapResult
        )
    end


    -- ------------------------------------------------------------
    -- BOUNTIES
    -- ------------------------------------------------------------

    local bounties =
        currentBounties

    if not bounties then
        bounties =
            requestCurrentBounties()
    end


    -- ------------------------------------------------------------
    -- PAYLOAD
    -- ------------------------------------------------------------

    local payload = {

        game =
            "Capybaras vs Plants",

        eggShop =
            eggShop,

        gearShop =
            gearShop,

        merchant =
            merchant
            or false,

        weather =
            weather
            or false,

        scrapShop =
            scrapShop
            or false,

        bounties =
            bounties
            or false

    }


    local safePayload =
        sanitizeForJson(
            payload
        )


    local encoded

    local encodeSuccess,
        encodeResult =
        pcall(function()

            return HttpService:JSONEncode(
                safePayload
            )

        end)


    if not encodeSuccess then

        Status.Text =
            "❌ JSON encode failed"

        Status.TextColor3 =
            Color3.fromRGB(
                220,
                70,
                70
            )

        warn(
            "[CVP] JSON error:",
            encodeResult
        )

        return

    end


    encoded =
        encodeResult


    -- ------------------------------------------------------------
    -- DEBUG
    -- ------------------------------------------------------------

    print(
        "======================================"
    )

    print(
        "[CVP] SCAN #"
        .. ScanNumber
    )

    print(
        "======================================"
    )

    print(
        "Egg Shop:",
        HttpService:JSONEncode(
            eggShop
        )
    )

    print(
        "Gear Shop:",
        HttpService:JSONEncode(
            gearShop
        )
    )

    print(
        "Merchant:",
        HttpService:JSONEncode(
            merchant
        )
    )

    print(
        "Weather:",
        HttpService:JSONEncode(
            weather
        )
    )

    print(
        "Dr Carrot Scrap Shop:",
        HttpService:JSONEncode(
            scrapShop
        )
    )

    print(
        "Bounties:",
        HttpService:JSONEncode(
            bounties
        )
    )

    print(
        "Sending to Railway..."
    )


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
            "✅ Sent successfully #"
            .. tostring(ScanNumber)

        Status.TextColor3 =
            Color3.fromRGB(
                60,
                210,
                100
            )


        local eggInStock = 0

        for _, stock in
            pairs(eggShop) do

            if tonumber(stock)
                and tonumber(stock) > 0 then

                eggInStock += 1

            end

        end


        local gearInStock = 0

        for _, stock in
            pairs(gearShop) do

            if tonumber(stock)
                and tonumber(stock) > 0 then

                gearInStock += 1

            end

        end


        local scrapCount = 0

        if scrapShop
            and type(scrapShop.items)
                == "table" then

            scrapCount =
                #scrapShop.items

        end


        local bountyCount = 0

        if type(bounties) == "table" then

            if #bounties > 0 then
                bountyCount =
                    #bounties
            else

                for _ in
                    pairs(bounties) do

                    bountyCount += 1

                end

            end

        end


        local weatherDisplay =
            "Clear"

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

            .. "\n🚚 Merchant: "
            .. tostring(
                merchant
                and merchant.name
                or "None"
            )

            .. "\n🌦 Weather: "
            .. weatherDisplay

            .. "\n🥕 Scrap Shop: "
            .. tostring(scrapCount)
            .. " item(s)"

            .. "\n🎯 Bounties: "
            .. tostring(bountyCount)


        print(
            "[CVP] Railway response:"
        )

        print(response)

    else

        Status.Text =
            "❌ Railway failed"

        Status.TextColor3 =
            Color3.fromRGB(
                220,
                70,
                70
            )

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

print(
    "======================================"
)

print(
    "🐾 CVP NOTIFIER"
)

print(
    "======================================"
)

print(
    "MainGui:",
    MainGui:GetFullName()
)

print(
    "API:",
    API_URL
)

print(
    "Starting scanner..."
)


Status.Text =
    "🟢 Running"


task.spawn(function()

    while ScreenGui.Parent do

        local success,
            errorMessage =
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

        task.wait(
            SCAN_EVERY
        )

    end

end)


print(
    "[CVP] Notifier started."
)
