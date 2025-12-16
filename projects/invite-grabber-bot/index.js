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
const OWNER_ID = process.env.OWNER_ID

client.once("ready", async () => {
  console.log(`logged in as ${client.user.tag}`)

  const owner = await client.users.fetch(OWNER_ID)
  let out = ""

  for (const guild of client.guilds.cache.values()) {
    try {
      const invites = await guild.invites.fetch()
      if (!invites.size) {
        out += `\n${guild.name} -> no invites\n`
        continue
      }

      invites.forEach(inv => {
        out += `${guild.name} -> https://discord.gg/${inv.code}\n`
      })
    } catch {
      out += `\n${guild.name} -> no perms\n`
    }
  }

  if (!out) out = "nothing found"
  await owner.send(out.slice(0, 1900))
  process.exit(0)
})

client.login(TOKEN)
