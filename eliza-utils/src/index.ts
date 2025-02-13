import { config } from 'dotenv';
import { CoinMarketCapService } from './services/coinmarketcap';
import { DatabaseService } from './services/database';

config();

const INTERVAL = 30 * 60 * 1000; // 30 minutes en millisecondes

async function main() {
  const apiKey = process.env.COINMARKETCAP_API_KEY;
  if (!apiKey) {
    throw new Error('API key non trouvée dans les variables d\'environnement');
  }

  const cmcService = new CoinMarketCapService(apiKey);
  const dbService = new DatabaseService();
  
  await dbService.init();

  console.log('Service démarré - Mise à jour toutes les 30 minutes');

  async function updatePrices() {
    try {
      const prices = await cmcService.getPrices();
      await dbService.savePrices(prices);
      console.log(`Prix mis à jour à ${new Date().toISOString()}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des prix:', error);
    }
  }

  // Première mise à jour immédiate
  await updatePrices();

  // Mise à jour périodique
  setInterval(updatePrices, INTERVAL);
}

main().catch(console.error); 