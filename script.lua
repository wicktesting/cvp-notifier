-- ================= CONFIG =================
local SERVER_URL = "https://cvp-notifier-production.up.railway.app/api/update"
local API_KEY = "" -- only needed if you set UPDATE_API_KEY on Railway; leave "" otherwise
local POLL_INTERVAL = 10 -- seconds between snapshots

-- ================= HTTP =================
local httpRequest = (syn and syn.request) or (http and http.request) or http_request or request or (fluxus and fluxus.request)
local HttpService = game:GetService("HttpService")

local function postUpdate(payload)
    if not httpRequest then
        warn("No HTTP request function available in this executor.")
        return
    end
    local headers = {["Content-Type"] = "application/json"}
    if API_KEY ~= "" then
        headers["X-Api-Key"] = API_KEY
    end
    local ok, err = pcall(function()
        httpRequest({
            Url = SERVER_URL,
            Method = "POST",
            Headers = headers,
            Body = HttpService:JSONEncode(payload)
        })
    end)
    if not ok then
        warn("POST /api/update failed: " .. tostring(err))
    end
end

-- ================= References =================
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerInfo = ReplicatedStorage:WaitForChild("ServerInfo")

local function getRoot()
    local ok, root = pcall(function()
        return playerGui:WaitForChild("MainGui", 10):WaitForChild("Root", 10):WaitForChild("Frames", 10)
    end)
    if ok then return root end
    return nil
end

-- ================= Readers =================
local function readShopList(root, shopName)
    local items = {}
    local shopFrame = root and root:FindFirstChild(shopName)
    if not shopFrame then return items end
    local list = shopFrame:FindFirstChild("List")
    if not list then return items end

    for _, item in ipairs(list:GetChildren()) do
        if item:IsA("Frame") then
            local titleLabel = item:FindFirstChild("Title")
            local rarityLabel = item:FindFirstChild("Rarity")
            local stockLabel = item:FindFirstChild("Stock")
            if titleLabel then
                table.insert(items, {
                    name = titleLabel.Text,
                    rarity = rarityLabel and rarityLabel.Text or nil,
                    stock = stockLabel and stockLabel.Text or "Unknown",
                })
            end
        end
    end
    return items
end

local function readMerchant(root)
    local active = ServerInfo:FindFirstChild("MERCHANT_ACTIVE")
    if not active or not active.Value then
        return nil
    end

    local shopFrame = root and root:FindFirstChild("MerchantShop")
    if not shopFrame then return nil end

    local merchantName = nil
    local infoLabel = shopFrame:FindFirstChild("Details")
        and shopFrame.Details:FindFirstChild("Background")
        and shopFrame.Details.Background:FindFirstChild("MerchantShopInfo")
    if infoLabel then merchantName = infoLabel.Text end

    local items = readShopList(root, "MerchantShop")

    return {
        name = merchantName or "Unknown",
        timeLeft = nil, -- populated below if a countdown label is found
        items = items,
    }
end

local function readMerchantCountdown()
    local ok, shop = pcall(function()
        return workspace:WaitForChild("World", 2)
            :WaitForChild("Map", 2)
            :FindFirstChild("TravelingMerchantShop")
    end)
    if not ok or not shop then return nil end

    local timerLabel = nil
    local billboardPart = shop:FindFirstChild("BillboardPart")
    if billboardPart then
        local cd = billboardPart:FindFirstChild("TravelingMerchantCountdown")
        local frame = cd and cd:FindFirstChild("Frame")
        timerLabel = frame and frame:FindFirstChild("Timer")
    end
    return timerLabel and timerLabel.Text or nil
end

local function readWeather()
    local weatherValue = ServerInfo:FindFirstChild("ACTIVE_WEATHERS")
    if not weatherValue then return nil end
    local w = weatherValue.Value
    if w == "" then return nil end
    return w
end

-- ================= Main loop =================
local function buildAndSendSnapshot()
    local root = getRoot()

    local eggShop = readShopList(root, "EggShop")
    local gearShop = readShopList(root, "GearShop")
    local merchant = readMerchant(root)
    if merchant then
        merchant.timeLeft = readMerchantCountdown()
    end
    local weather = readWeather()

    local payload = {
        game = "Capybaras vs Plants",
        eggShop = eggShop,
        gearShop = gearShop,
        merchant = merchant,
        weather = weather,
    }

    postUpdate(payload)
end

print("CVP poster started — sending a snapshot every " .. POLL_INTERVAL .. "s.")

while task.wait(POLL_INTERVAL) do
    local ok, err = pcall(buildAndSendSnapshot)
    if not ok then
        warn("Snapshot failed: " .. tostring(err))
    end
end
