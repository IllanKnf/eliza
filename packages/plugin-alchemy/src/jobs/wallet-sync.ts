// packages/plugin-alchemy/src/jobs/wallet-sync.ts

export async function startWalletSyncJob(runtime: IAgentRuntime) {
    const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
    
    setInterval(async () => {
        const db = runtime.getDatabaseAdapter();
        
        // 1. Récupérer tous les wallets à surveiller
        const wallets = await db.query(`
            SELECT DISTINCT wallet_address 
            FROM (
                SELECT wallet_address FROM price_alerts WHERE is_active = true
                UNION
                SELECT wallet_address FROM wallet_snapshots 
                WHERE timestamp >= datetime('now', '-1 hour')
            )
        `);

        // 2. Synchroniser chaque wallet
        for (const { wallet_address } of wallets) {
            try {
                await getTokenBalances(wallet_address, db, { saveSnapshot: true });
            } catch (error) {
                console.error(`Error syncing wallet ${wallet_address}:`, error);
            }
        }
    }, SYNC_INTERVAL);
}