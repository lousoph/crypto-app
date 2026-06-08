import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

// Seed initial data from Excel file
export async function POST(req: Request) {
  try {
    // 1. Create admin user (real admin account)
    const adminEmail = "unibus93@gmail.com"
    const adminPassword = "#@769891506Fs#@"
    const existingAdmin = await db.user.findUnique({ where: { email: adminEmail } })
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10)
      await db.user.create({
        data: {
          email: adminEmail,
          name: "Admin",
          passwordHash: hashedPassword,
          role: "admin",
          emailVerified: new Date(),
        },
      })
    } else {
      // Ensure existing admin has correct role and password
      const hashedPassword = await bcrypt.hash(adminPassword, 10)
      await db.user.update({
        where: { email: adminEmail },
        data: { role: "admin", passwordHash: hashedPassword, emailVerified: new Date() },
      })
    }

    // 2. Create tokens
    const tokens = [
      // === Top cryptos majeures ===
      { ticker: "BTC", name: "Bitcoin", coingeckoId: "bitcoin", cryptoCompareId: "BTC" },
      { ticker: "ETH", name: "Ethereum", coingeckoId: "ethereum", cryptoCompareId: "ETH" },
      { ticker: "SOL", name: "Solana", coingeckoId: "solana", cryptoCompareId: "SOL" },
      { ticker: "BNB", name: "Binance Coin", coingeckoId: "binancecoin", cryptoCompareId: "BNB" },
      { ticker: "XRP", name: "Ripple", coingeckoId: "ripple", cryptoCompareId: "XRP" },
      { ticker: "ADA", name: "Cardano", coingeckoId: "cardano", cryptoCompareId: "ADA" },
      { ticker: "DOGE", name: "Dogecoin", coingeckoId: "dogecoin", cryptoCompareId: "DOGE" },
      { ticker: "TRX", name: "TRON", coingeckoId: "tron", cryptoCompareId: "TRX" },
      { ticker: "LTC", name: "Litecoin", coingeckoId: "litecoin", cryptoCompareId: "LTC" },
      { ticker: "LINK", name: "Chainlink", coingeckoId: "chainlink", cryptoCompareId: "LINK" },
      { ticker: "AVAX", name: "Avalanche", coingeckoId: "avalanche-2", cryptoCompareId: "AVAX" },
      { ticker: "DOT", name: "Polkadot", coingeckoId: "polkadot", cryptoCompareId: "DOT" },
      { ticker: "MATIC", name: "Polygon", coingeckoId: "matic-network", cryptoCompareId: "MATIC" },
      { ticker: "SHIB", name: "Shiba Inu", coingeckoId: "shiba-inu", cryptoCompareId: "SHIB" },
      { ticker: "BCH", name: "Bitcoin Cash", coingeckoId: "bitcoin-cash", cryptoCompareId: "BCH" },
      { ticker: "XLM", name: "Stellar", coingeckoId: "stellar", cryptoCompareId: "XLM" },
      { ticker: "NEAR", name: "NEAR Protocol", coingeckoId: "near", cryptoCompareId: "NEAR" },
      { ticker: "UNI", name: "Uniswap", coingeckoId: "uniswap", cryptoCompareId: "UNI" },
      { ticker: "APT", name: "Aptos", coingeckoId: "aptos", cryptoCompareId: "APT" },
      { ticker: "ARB", name: "Arbitrum", coingeckoId: "arbitrum", cryptoCompareId: "ARB" },
      { ticker: "OP", name: "Optimism", coingeckoId: "optimism", cryptoCompareId: "OP" },
      { ticker: "SUI", name: "Sui", coingeckoId: "sui", cryptoCompareId: "SUI" },
      { ticker: "ICP", name: "Internet Computer", coingeckoId: "internet-computer", cryptoCompareId: "ICP" },
      { ticker: "FIL", name: "Filecoin", coingeckoId: "filecoin", cryptoCompareId: "FIL" },
      { ticker: "HBAR", name: "Hedera", coingeckoId: "hedera-hashgraph", cryptoCompareId: "HBAR" },
      { ticker: "VET", name: "VeChain", coingeckoId: "vechain", cryptoCompareId: "VET" },
      { ticker: "ALGO", name: "Algorand", coingeckoId: "algorand", cryptoCompareId: "ALGO" },
      { ticker: "FTM", name: "Fantom", coingeckoId: "fantom", cryptoCompareId: "FTM" },
      { ticker: "PEPE", name: "Pepe", coingeckoId: "pepe", cryptoCompareId: "PEPE" },

      // === Stablecoins ===
      { ticker: "USDT", name: "Tether", coingeckoId: "tether", cryptoCompareId: "USDT" },
      { ticker: "USDC", name: "USD Coin", coingeckoId: "usd-coin", cryptoCompareId: "USDC" },

      // === DeFi ===
      { ticker: "AAVE", name: "Aave", coingeckoId: "aave", cryptoCompareId: "AAVE" },
      { ticker: "MKR", name: "Maker", coingeckoId: "maker", cryptoCompareId: "MKR" },
      { ticker: "COMP", name: "Compound", coingeckoId: "compound-governance-token", cryptoCompareId: "COMP" },
      { ticker: "SNX", name: "Synthetix", coingeckoId: "havven", cryptoCompareId: "SNX" },
      { ticker: "CRV", name: "Curve DAO", coingeckoId: "curve-dao-token", cryptoCompareId: "CRV" },
      { ticker: "DYDX", name: "dYdX", coingeckoId: "dydx", cryptoCompareId: "DYDX" },
      { ticker: "GMX", name: "GMX", coingeckoId: "gmx", cryptoCompareId: "GMX" },
      { ticker: "LDO", name: "Lido DAO", coingeckoId: "lido-dao", cryptoCompareId: "LDO" },
      { ticker: "RPL", name: "Rocket Pool", coingeckoId: "rocket-pool", cryptoCompareId: "RPL" },
      { ticker: "RUNE", name: "THORChain", coingeckoId: "thorchain", cryptoCompareId: "RUNE" },
      { ticker: "1INCH", name: "1inch", coingeckoId: "1inch", cryptoCompareId: "1INCH" },
      { ticker: "SUSHI", name: "SushiSwap", coingeckoId: "sushiswap", cryptoCompareId: "SUSHI" },
      { ticker: "BAL", name: "Balancer", coingeckoId: "balancer", cryptoCompareId: "BAL" },
      { ticker: "YFI", name: "yearn.finance", coingeckoId: "yearn-finance", cryptoCompareId: "YFI" },
      { ticker: "PENDLE", name: "Pendle", coingeckoId: "pendle", cryptoCompareId: "PENDLE" },
      { ticker: "ENA", name: "Ethena", coingeckoId: "ethena", cryptoCompareId: "ENA" },
      { ticker: "ONDO", name: "Ondo Finance", coingeckoId: "ondo-finance", cryptoCompareId: "ONDO" },
      { ticker: "JUP", name: "Jupiter", coingeckoId: "jupiter-exchange-solana", cryptoCompareId: "JUP" },

      // === Layer 1 / L1 ===
      { ticker: "ATOM", name: "Cosmos", coingeckoId: "cosmos", cryptoCompareId: "ATOM" },
      { ticker: "KSM", name: "Kusama", coingeckoId: "kusama", cryptoCompareId: "KSM" },
      { ticker: "EGLD", name: "MultiversX", coingeckoId: "multiversx", cryptoCompareId: "EGLD" },
      { ticker: "XTZ", name: "Tezos", coingeckoId: "tezos", cryptoCompareId: "XTZ" },
      { ticker: "NEO", name: "NEO", coingeckoId: "neo", cryptoCompareId: "NEO" },
      { ticker: "QTUM", name: "Qtum", coingeckoId: "qtum", cryptoCompareId: "QTUM" },
      { ticker: "ZIL", name: "Zilliqa", coingeckoId: "zilliqa", cryptoCompareId: "ZIL" },
      { ticker: "FLOW", name: "Flow", coingeckoId: "flow", cryptoCompareId: "FLOW" },
      { ticker: "CELO", name: "Celo", coingeckoId: "celo", cryptoCompareId: "CELO" },
      { ticker: "KAVA", name: "Kava", coingeckoId: "kava", cryptoCompareId: "KAVA" },
      { ticker: "MINA", name: "Mina Protocol", coingeckoId: "mina-protocol", cryptoCompareId: "MINA" },
      { ticker: "ZEC", name: "Zcash", coingeckoId: "zcash", cryptoCompareId: "ZEC" },
      { ticker: "ZEN", name: "Horizen", coingeckoId: "zencash", cryptoCompareId: "ZEN" },

      // === Layer 2 / L2 ===
      { ticker: "POL", name: "Polygon Ecosystem", coingeckoId: "polygon-ecosystem-token", cryptoCompareId: "POL" },
      { ticker: "SEI", name: "Sei", coingeckoId: "sei-network", cryptoCompareId: "SEI" },
      { ticker: "IMX", name: "Immutable", coingeckoId: "immutable-x", cryptoCompareId: "IMX" },
      { ticker: "STX", name: "Stacks", coingeckoId: "blockstack", cryptoCompareId: "STX" },
      { ticker: "CFX", name: "Conflux", coingeckoId: "conflux-network", cryptoCompareId: "CFX" },
      { ticker: "ROSE", name: "Oasis Network", coingeckoId: "oasis-network", cryptoCompareId: "ROSE" },
      { ticker: "METIS", name: "Metis", coingeckoId: "metis-token", cryptoCompareId: "METIS" },

      // === AI / Machine Learning ===
      { ticker: "TAO", name: "Bittensor", coingeckoId: "bittensor", cryptoCompareId: "TAO" },
      { ticker: "FET", name: "Fetch.ai", coingeckoId: "fetch-ai", cryptoCompareId: "FET" },
      { ticker: "RENDER", name: "Render", coingeckoId: "render-token", cryptoCompareId: "RENDER" },
      { ticker: "RNDR", name: "Render (Legacy)", coingeckoId: "render-token", cryptoCompareId: "RNDR" },
      { ticker: "NMR", name: "Numeraire", coingeckoId: "numeraire", cryptoCompareId: "NMR" },
      { ticker: "PYTH", name: "Pyth Network", coingeckoId: "pyth-network", cryptoCompareId: "PYTH" },
      { ticker: "GRT", name: "The Graph", coingeckoId: "the-graph", cryptoCompareId: "GRT" },
      { ticker: "WLD", name: "Worldcoin", coingeckoId: "worldcoin-wld", cryptoCompareId: "WLD" },
      { ticker: "AKT", name: "Akash Network", coingeckoId: "akash-network", cryptoCompareId: "AKT" },
      { ticker: "AGIX", name: "SingularityNET", coingeckoId: "singularitynet", cryptoCompareId: "AGIX" },

      // === Gaming / NFT / Metaverse ===
      { ticker: "AXS", name: "Axie Infinity", coingeckoId: "axie-infinity", cryptoCompareId: "AXS" },
      { ticker: "SAND", name: "The Sandbox", coingeckoId: "the-sandbox", cryptoCompareId: "SAND" },
      { ticker: "MANA", name: "Decentraland", coingeckoId: "decentraland", cryptoCompareId: "MANA" },
      { ticker: "ILV", name: "Illuvium", coingeckoId: "illuvium", cryptoCompareId: "ILV" },
      { ticker: "GALA", name: "Gala Games", coingeckoId: "gala", cryptoCompareId: "GALA" },
      { ticker: "BLUR", name: "Blur", coingeckoId: "blur", cryptoCompareId: "BLUR" },
      { ticker: "PENGU", name: "Pudgy Penguins", coingeckoId: "pudgy-penguins", cryptoCompareId: "PENGU" },

      // === Infrastructure / Interoperabilité ===
      { ticker: "AR", name: "Arweave", coingeckoId: "arweave", cryptoCompareId: "AR" },
      { ticker: "TIA", name: "Celestia", coingeckoId: "celestia", cryptoCompareId: "TIA" },
      { ticker: "INJ", name: "Injective", coingeckoId: "injective-protocol", cryptoCompareId: "INJ" },
      { ticker: "W", name: "Wormhole", coingeckoId: "wormhole", cryptoCompareId: "W" },
      { ticker: "AXL", name: "Axelar", coingeckoId: "axelar", cryptoCompareId: "AXL" },
      { ticker: "QNT", name: "Quant", coingeckoId: "quant-network", cryptoCompareId: "QNT" },
      { ticker: "THETA", name: "Theta Network", coingeckoId: "theta-network", cryptoCompareId: "THETA" },
      { ticker: "ANKR", name: "Ankr", coingeckoId: "ankr", cryptoCompareId: "ANKR" },
      { ticker: "LRC", name: "Loopring", coingeckoId: "loopring", cryptoCompareId: "LRC" },

      // === Memes & Spéciaux ===
      { ticker: "VIRTUAL", name: "Virtual Protocol", coingeckoId: "virtual-protocol", cryptoCompareId: "VIRTUAL" },
      { ticker: "PUMP", name: "Pump", coingeckoId: "pump", cryptoCompareId: "PUMP" },
      { ticker: "WLFI", name: "World Liberty Financial", coingeckoId: "world-liberty-financial", cryptoCompareId: "WLFI" },
      { ticker: "BONK", name: "Bonk", coingeckoId: "bonk", cryptoCompareId: "BONK" },
      { ticker: "WIF", name: "dogwifhat", coingeckoId: "dogwifcoin", cryptoCompareId: "WIF" },
      { ticker: "BRETT", name: "Brett", coingeckoId: "brett", cryptoCompareId: "BRETT" },

      // === Utilitaires / divers ===
      { ticker: "CHZ", name: "Chiliz", coingeckoId: "chiliz", cryptoCompareId: "CHZ" },
      { ticker: "RSR", name: "Reserve Rights", coingeckoId: "reserve-rights-token", cryptoCompareId: "RSR" },
      { ticker: "ENS", name: "Ethereum Name Service", coingeckoId: "ethereum-name-service", cryptoCompareId: "ENS" },
      { ticker: "MASK", name: "Mask Network", coingeckoId: "mask-network", cryptoCompareId: "MASK" },
      { ticker: "WOO", name: "WOO Network", coingeckoId: "woo-network", cryptoCompareId: "WOO" },
      { ticker: "PERP", name: "Perpetual Protocol", coingeckoId: "perpetual-protocol", cryptoCompareId: "PERP" },
      { ticker: "XPL", name: "XPLA", coingeckoId: "xpla", cryptoCompareId: "XPL" },
    ]

    for (const token of tokens) {
      await db.token.upsert({
        where: { ticker: token.ticker },
        update: { name: token.name, coingeckoId: token.coingeckoId, cryptoCompareId: token.cryptoCompareId },
        create: token,
      })
    }

    // 3. Create exchanges
    const exchanges = ["BINANCE", "BYBIT", "COINBASE", "KRAKEN", "OKX", "BITGET", "GATE.IO", "MEXC"]

    for (const name of exchanges) {
      await db.exchange.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    }

    return NextResponse.json({ success: true, message: "Database seeded successfully", tokenCount: tokens.length })
  } catch (error: any) {
    console.error("Seed error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
