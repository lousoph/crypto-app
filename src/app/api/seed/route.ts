import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

// Seed initial data from Excel file
export async function POST(req: Request) {
  try {
    // 1. Create admin user
    const existingAdmin = await db.user.findUnique({ where: { email: "admin@cryptotracker.com" } })
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10)
      await db.user.create({
        data: {
          email: "admin@cryptotracker.com",
          name: "Admin",
          passwordHash: hashedPassword,
          role: "admin",
        },
      })
    }

    // 2. Create demo free user
    const existingDemo = await db.user.findUnique({ where: { email: "demo@cryptotracker.com" } })
    if (!existingDemo) {
      const hashedPassword = await bcrypt.hash("demo123", 10)
      await db.user.create({
        data: {
          email: "demo@cryptotracker.com",
          name: "Demo User",
          passwordHash: hashedPassword,
          role: "user_free",
        },
      })
    }

    // 3. Create premium demo user
    const existingPremium = await db.user.findUnique({ where: { email: "premium@cryptotracker.com" } })
    if (!existingPremium) {
      const hashedPassword = await bcrypt.hash("premium123", 10)
      await db.user.create({
        data: {
          email: "premium@cryptotracker.com",
          name: "Premium User",
          passwordHash: hashedPassword,
          role: "user_premium",
        },
      })
    }

    // 4. Create tokens from Excel
    const tokens = [
      { ticker: "BTC", name: "Bitcoin", coingeckoId: "bitcoin", cryptoCompareId: "BTC" },
      { ticker: "ETH", name: "Ethereum", coingeckoId: "ethereum", cryptoCompareId: "ETH" },
      { ticker: "SOL", name: "Solana", coingeckoId: "solana", cryptoCompareId: "SOL" },
      { ticker: "BNB", name: "Binance Coin", coingeckoId: "binancecoin", cryptoCompareId: "BNB" },
      { ticker: "ZEC", name: "Zcash", coingeckoId: "zcash", cryptoCompareId: "ZEC" },
      { ticker: "XRP", name: "Ripple", coingeckoId: "ripple", cryptoCompareId: "XRP" },
      { ticker: "DOGE", name: "Dogecoin", coingeckoId: "dogecoin", cryptoCompareId: "DOGE" },
      { ticker: "ZEN", name: "Horizen", coingeckoId: "zencash", cryptoCompareId: "ZEN" },
      { ticker: "SUI", name: "Sui", coingeckoId: "sui", cryptoCompareId: "SUI" },
      { ticker: "TAO", name: "Bittensor", coingeckoId: "bittensor", cryptoCompareId: "TAO" },
      { ticker: "ADA", name: "Cardano", coingeckoId: "cardano", cryptoCompareId: "ADA" },
      { ticker: "LINK", name: "Chainlink", coingeckoId: "chainlink", cryptoCompareId: "LINK" },
      { ticker: "AVAX", name: "Avalanche", coingeckoId: "avalanche-2", cryptoCompareId: "AVAX" },
      { ticker: "XPL", name: "XPLA", coingeckoId: "xpla", cryptoCompareId: "XPL" },
      { ticker: "VIRTUAL", name: "Virtual Protocol", coingeckoId: "virtual-protocol", cryptoCompareId: "VIRTUAL" },
      { ticker: "PUMP", name: "Pump", coingeckoId: "pump", cryptoCompareId: "PUMP" },
      { ticker: "ENA", name: "Ethena", coingeckoId: "ethena", cryptoCompareId: "ENA" },
      { ticker: "WLD", name: "Worldcoin", coingeckoId: "worldcoin-wld", cryptoCompareId: "WLD" },
      { ticker: "NEAR", name: "NEAR Protocol", coingeckoId: "near", cryptoCompareId: "NEAR" },
      { ticker: "AAVE", name: "Aave", coingeckoId: "aave", cryptoCompareId: "AAVE" },
      { ticker: "ARB", name: "Arbitrum", coingeckoId: "arbitrum", cryptoCompareId: "ARB" },
      { ticker: "PENGU", name: "Pudgy Penguins", coingeckoId: "pudgy-penguins", cryptoCompareId: "PENGU" },
      { ticker: "WLFI", name: "World Liberty Financial", coingeckoId: "world-liberty-financial", cryptoCompareId: "WLFI" },
      { ticker: "ONDO", name: "Ondo Finance", coingeckoId: "ondo-finance", cryptoCompareId: "ONDO" },
      // Nouveaux tokens ajoutés
      { ticker: "ATOM", name: "Cosmos", coingeckoId: "cosmos", cryptoCompareId: "ATOM" },
      { ticker: "AR", name: "Arweave", coingeckoId: "arweave", cryptoCompareId: "AR" },
      { ticker: "TIA", name: "Celestia", coingeckoId: "celestia", cryptoCompareId: "TIA" },
      { ticker: "INJ", name: "Injective", coingeckoId: "injective-protocol", cryptoCompareId: "INJ" },
      { ticker: "FET", name: "Fetch.ai", coingeckoId: "fetch-ai", cryptoCompareId: "FET" },
      { ticker: "RENDER", name: "Render", coingeckoId: "render-token", cryptoCompareId: "RENDER" },
      { ticker: "NMR", name: "Numeraire", coingeckoId: "numeraire", cryptoCompareId: "NMR" },
      { ticker: "PYTH", name: "Pyth Network", coingeckoId: "pyth-network", cryptoCompareId: "PYTH" },
      { ticker: "W", name: "Wormhole", coingeckoId: "wormhole", cryptoCompareId: "W" },
      { ticker: "GRT", name: "The Graph", coingeckoId: "the-graph", cryptoCompareId: "GRT" },
      { ticker: "QNT", name: "Quant", coingeckoId: "quant-network", cryptoCompareId: "QNT" },
      { ticker: "AXL", name: "Axelar", coingeckoId: "axelar", cryptoCompareId: "AXL" },
      { ticker: "ILV", name: "Illuvium", coingeckoId: "illuvium", cryptoCompareId: "ILV" },
      { ticker: "QTUM", name: "Qtum", coingeckoId: "qtum", cryptoCompareId: "QTUM" },
      { ticker: "LTC", name: "Litecoin", coingeckoId: "litecoin", cryptoCompareId: "LTC" },
      { ticker: "PEPE", name: "Pepe", coingeckoId: "pepe", cryptoCompareId: "PEPE" },
      { ticker: "ANKR", name: "Ankr", coingeckoId: "ankr", cryptoCompareId: "ANKR" },
      { ticker: "RSR", name: "Reserve Rights", coingeckoId: "reserve-rights-token", cryptoCompareId: "RSR" },
    ]

    for (const token of tokens) {
      await db.token.upsert({
        where: { ticker: token.ticker },
        update: { name: token.name, coingeckoId: token.coingeckoId, cryptoCompareId: token.cryptoCompareId },
        create: token,
      })
    }

    // 5. Create exchanges from Excel
    const exchanges = ["BINANCE", "BYBIT", "COINBASE", "KRAKEN", "OKX"]

    for (const name of exchanges) {
      await db.exchange.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    }

    return NextResponse.json({ success: true, message: "Database seeded successfully" })
  } catch (error: any) {
    console.error("Seed error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
