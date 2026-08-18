-- CVP Notifier
-- Dr. Carrot Scrap Shop support

local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Player = Players.LocalPlayer
local Remotes = ReplicatedStorage:WaitForChild("Remotes")

local API_URL = "https://cvp-notifier-production.up.railway.app/api/update"
local API_KEY = ""
local SCAN_EVERY = 2

local requestFunction =
    request
    or http_request
    or (syn and syn.request)
    or (http and http.request)

if not requestFunction then
    warn("CVP Notifier: HTTP request function not found")
    return
end

local function post(data)
    data.updatedAt = os.date("!%Y-%m-%dT%H:%M:%SZ")

    local headers = {
        ["Content-Type"] = "application/json"
    }

    if API_KEY ~= "" then
        headers["X-Api-Key"] = API_KEY
    end

    local ok, response = pcall(function()
        return requestFunction({
            Url = API_URL,
            Method = "POST",
            Headers = headers,
            Body = HttpService:JSONEncode(data)
        })
    end)

    if not ok then
        return false, tostring(response)
    end

    local status = tonumber(
        response and (response.StatusCode or response.Status) or 0
    ) or 0

    return status >= 200 and status < 300,
        response and response.Body or ""
end

--------------------------------------------------
-- Generic helpers
--------------------------------------------------

local function copyValue(value, depth, seen)
    depth = depth or 0
    seen = seen or {}

    if depth > 8 then
        return "<max depth>"
    end

    local valueType = typeof(value)

    if valueType == "string"
        or valueType == "number"
        or valueType == "boolean" then
        return value
    end

    if valueType ~= "table" then
        return tostring(value)
    end

    if seen[value] then
        return "<cycle>"
    end

    seen[value] = true

    local result = {}

    for key, child in pairs(value) do
        result[tostring(key)] = copyValue(child, depth + 1, seen)
    end

    seen[value] = nil

    return result
end

--------------------------------------------------
-- Dr. Carrot Event Shop
--------------------------------------------------

local latestDrCarrot = nil
local latestDrCarrotSignature = ""

local eventShopRemote =
    Remotes:FindFirstChild("UpdateEventShopStock")

local function normalizeDrCarrot(payload)
    if typeof(payload) ~= "table" then
        return nil
    end

    local theme =
        payload.Theme
        or payload.theme

    -- Only accept Dr. Carrot's event shop
    if theme and tostring(theme) ~= "DrCarrot" then
        return nil
    end

    local stock =
        payload.Stock
        or payload.stock
        or {}

    local stockList = {}

    if typeof(stock) == "table" then
        for itemName, itemData in pairs(stock) do
            stockList[#stockList + 1] = {
                name = tostring(itemName),
                value = copyValue(itemData)
            }
        end
    end

    return {
        theme = tostring(theme or "DrCarrot"),

        restockUntil =
            payload.RestockUntil
            or payload.restockUntil,

        themePurchases =
            copyValue(
                payload.ThemePurchases
                or payload.themePurchases
                or {}
            ),

        stock = stockList
    }
end

local function pushDrCarrot(payload)
    local shop = normalizeDrCarrot(payload)

    if not shop then
        return
    end

    local signature = HttpService:JSONEncode(shop)

    if signature == latestDrCarrotSignature then
        return
    end

    latestDrCarrot = shop
    latestDrCarrotSignature = signature

    post({
        drCarrot = shop
    })
end

--------------------------------------------------
-- Listen directly to Event Shop stock updates
--------------------------------------------------

if eventShopRemote
    and eventShopRemote:IsA("RemoteEvent") then

    eventShopRemote.OnClientEvent:Connect(function(payload)
        pushDrCarrot(payload)
    end)

    print("CVP Notifier: UpdateEventShopStock connected")
else
    warn(
        "CVP Notifier: UpdateEventShopStock RemoteEvent not found"
    )
end

--------------------------------------------------
-- GUI fallback
--------------------------------------------------

local function scrapeDrCarrotGui()
    local playerGui = Player:FindFirstChild("PlayerGui")

    if not playerGui then
        return nil
    end

    local mainGui =
        playerGui:FindFirstChild("MainGui")

    if not mainGui then
        return nil
    end

    local shop =
        mainGui:FindFirstChild(
            "DrCarrotShop",
            true
        )

    if not shop then
        return nil
    end

    local list =
        shop:FindFirstChild(
            "List",
            true
        )

    if not list then
        return nil
    end

    local items = {}

    for _, card in ipairs(list:GetChildren()) do

        if card:IsA("Frame") then

            local title =
                card:FindFirstChild(
                    "Title",
                    true
                )

            if title
                and title:IsA("TextLabel")
                and title.Text ~= "" then

                local stock =
                    card:FindFirstChild(
                        "Stock",
                        true
                    )

                local rarity =
                    card:FindFirstChild(
                        "Rarity",
                        true
                    )

                local description =
                    card:FindFirstChild(
                        "Description",
                        true
                    )

                local buy =
                    card:FindFirstChild(
                        "Buy",
                        true
                    )

                local cost = nil

                if buy then
                    local details =
                        buy:FindFirstChild(
                            "Details",
                            true
                        )

                    if details then
                        local costLabel =
                            details:FindFirstChild(
                                "Cost"
                            )

                        if costLabel then
                            cost = costLabel.Text
                        end
                    end
                end

                items[#items + 1] = {
                    name = title.Text,

                    stock =
                        stock
                        and stock.Text
                        or nil,

                    rarity =
                        rarity
                        and rarity.Text
                        or nil,

                    description =
                        description
                        and description.Text
                        or nil,

                    cost = cost
                }
            end
        end
    end

    if #items == 0 then
        return nil
    end

    return {
        theme = "DrCarrot",
        stock = items
    }
end

--------------------------------------------------
-- Existing notifier data
--------------------------------------------------

local function textObjects(root)
    local result = {}

    if not root then
        return result
    end

    for _, object in ipairs(
        root:GetDescendants()
    ) do

        if object:IsA("TextLabel")
            or object:IsA("TextButton")
            or object:IsA("TextBox") then

            if object.Text
                and object.Text ~= "" then

                table.insert(
                    result,
                    object
                )
            end
        end
    end

    return result
end

local function stockFromText(text)
    text = tostring(text or "")

    local amount =
        text:match("[xX]%s*(%d+)")
        or text:match(
            "(%d+)%s*[Ii]n [Ss]tock"
        )
        or text:match(
            "[Ss]tock%s*:?%s*(%d+)"
        )

    if amount then
        return tonumber(amount)
    end

    local lower =
        text:lower()

    if lower:find(
        "no stock",
        1,
        true
    )
    or lower:find(
        "out of stock",
        1,
        true
    )
    or lower:find(
        "sold out",
        1,
        true
    ) then

        return 0
    end

    return nil
end

local function findStock(object)
    local current = object

    for _ = 1, 5 do

        if not current then
            break
        end

        for _, child in ipairs(
            current:GetDescendants()
        ) do

            if child:IsA("TextLabel")
                or child:IsA("TextButton") then

                local amount =
                    stockFromText(
                        child.Text
                    )

                if amount ~= nil then
                    return amount
                end
            end
        end

        current =
            current.Parent
    end

    return 0
end

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

local GearNames = {
    "Hatch Hammer",
    "Nametag",
    "Mutation Sponge",
    "Boombox",
    "Bizarre Stopwatch"
}

local function scanNamed(names)
    local result = {}
    local found = {}

    local playerGui =
        Player:FindFirstChild("PlayerGui")

    local mainGui =
        playerGui
        and playerGui:FindFirstChild("MainGui")

    if not mainGui then
        return result
    end

    for _, object in ipairs(
        textObjects(mainGui)
    ) do

        for _, name in ipairs(names) do

            if object.Text:find(
                name,
                1,
                true
            )
            and not found[name] then

                found[name] = true

                result[#result + 1] = {
                    name = name,
                    stock = findStock(object)
                }
            end
        end
    end

    return result
end

--------------------------------------------------
-- Main snapshot
--------------------------------------------------

local lastSnapshot = ""

local function buildSnapshot()
    local playerGui =
        Player:FindFirstChild("PlayerGui")

    local mainGui =
        playerGui
        and playerGui:FindFirstChild("MainGui")

    local drCarrot =
        latestDrCarrot

    if not drCarrot and mainGui then
        drCarrot =
            scrapeDrCarrotGui()
    end

    return {
        eggShop = scanNamed(EggNames),

        gearShop = scanNamed(GearNames),

        drCarrot = drCarrot
    }
end

task.spawn(function()

    while task.wait(SCAN_EVERY) do

        local payload =
            buildSnapshot()

        local signature =
            HttpService:JSONEncode(
                payload
            )

        if signature ~= lastSnapshot then

            local ok, err =
                post(payload)

            if ok then
                lastSnapshot =
                    signature
            else
                warn(
                    "CVP Notifier API error:",
                    err
                )
            end
        end
    end
end)

post({
    drCarrot = latestDrCarrot
})

print(
    "CVP Notifier loaded - Dr. Carrot Scrap Shop enabled"
)
