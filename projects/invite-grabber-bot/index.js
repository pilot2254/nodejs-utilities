import "dotenv/config"
import { Client, GatewayIntentBits, Partials } from "discord.js"


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
})

const TOKEN = process.env.BOT_TOKEN
// const OWNER_ID = process.env.OWNER_ID // not needed anymore

client.once("clientReady", async () => {
  console.log(`logged in as ${client.user.tag}`)

  for (const guild of client.guilds.cache.values()) {
    try {
      const invites = await guild.invites.fetch()

      if (!invites.size) {
        console.log(`${guild.name} -> no invites`)
        continue
      }

      invites.forEach(inv => {
        console.log(`${guild.name} -> https://discord.gg/${inv.code}`)
      })
    } catch {
      console.log(`${guild.name} -> no perms`)
    }
  }

  process.exit(0)
})

client.login(TOKEN)
