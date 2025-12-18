
import fs from 'fs'
import path from 'path'

const log = (msg) => {
  try {
    const logPath = path.resolve(process.cwd(), 'debug-payments.log')
    const line = `[DB-MAINTENANCE] ${new Date().toISOString()} ${msg}\n`
    fs.appendFileSync(logPath, line)
    console.log(`[DB-MAINTENANCE] ${msg}`)
  } catch (_) { }
}

export const ensureDatabaseIntegrity = async (Order, Ticket) => {
  try {
    log('Start database integrity check...')

    // 1. Vind dubbele orders op basis van stripeSessionId
    // We groeperen op stripeSessionId en kijken welke vaker dan 1x voorkomen
    const duplicates = await Order.aggregate([
      { 
        $group: { 
          _id: "$stripeSessionId", 
          count: { $sum: 1 }, 
          ids: { $push: "$_id" } // Verzamel alle _id's van de duplicaten
        } 
      },
      { 
        $match: { 
          count: { $gt: 1 },
          _id: { $ne: null } // Negeer orders zonder session id (zouden er niet moeten zijn)
        } 
      }
    ])

    let removedCount = 0
    
    if (duplicates.length > 0) {
      log(`Found ${duplicates.length} sets of duplicate orders. Cleaning up...`)
      
      for (const dup of duplicates) {
        // Sorteer op ID (MongoDB _id bevat timestamp). De eerste is de oudste.
        // We behouden de oudste (originele) en verwijderen de nieuwere (foutieve duplicaten).
        const [keep, ...remove] = dup.ids.sort() 
        
        if (remove.length > 0) {
          log(`Fixing session ${dup._id}: Keeping ${keep}, removing ${remove.length} duplicates: ${remove.join(', ')}`)
          await Order.deleteMany({ _id: { $in: remove } })
          removedCount += remove.length
        }
      }
      log(`Cleanup complete. Removed ${removedCount} duplicate orders.`)
    } else {
      log('No duplicate orders found.')
    }

    // 2. Forceer indexen nu de duplicaten weg zijn
    log('Syncing indexes to ensure uniqueness guarantees...')
    await Order.syncIndexes()
    await Ticket.syncIndexes()

    // 3. Verificatie
    const indexes = await Order.listIndexes()
    const hasUnique = indexes.some(i => i.key && i.key.stripeSessionId && i.unique)

    if (hasUnique) {
      log('SUCCESS: Unique index on stripeSessionId is active. Future duplicates are impossible.')
    } else {
      log('WARNING: Unique index is STILL NOT active. Check MongoDB logs.')
    }

    return {
      duplicatesFound: duplicates.length,
      removed: removedCount,
      indexVerified: hasUnique
    }

  } catch (error) {
    log(`FATAL ERROR during maintenance: ${error.message}`)
    throw error
  }
}
