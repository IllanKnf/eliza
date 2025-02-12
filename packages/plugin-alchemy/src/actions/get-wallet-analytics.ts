// packages/plugin-alchemy/src/actions/get-wallet-analytics.ts

export const getWalletAnalyticsAction = {
    name: "GET_WALLET_ANALYTICS",
    description: "Get wallet value and token position history",
    handler: async (runtime, message) => {
      const { walletAddress, timeframe } = message.content;
      const db = runtime.getDatabaseAdapter();
  
      const [valueHistory, positions] = await Promise.all([
        getWalletValueHistory(db, walletAddress, timeframe),
        getTokenPositionHistory(db, walletAddress, timeframe)
      ]);
  
      // Calculer les variations
      const variations = calculateVariations(valueHistory, positions);
  
      return {
        success: true,
        response: formatAnalyticsResponse(variations)
      };
    }
  };

export const getWalletEvolutionAction: Action = {
    name: "GET_WALLET_EVOLUTION",
    description: "Get wallet value evolution over time",
    handler: async (
        runtime: IAgentRuntime,
        message: AlchemyRequest,
        state: State
    ) => {
        const { walletAddress, timeframe = '24h' } = message.content;
        const db = runtime.getDatabaseAdapter();

        const evolution = await db.query(`
            WITH hourly_snapshots AS (
                SELECT 
                    strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
                    AVG(total_value_usd) as avg_value_usd,
                    AVG(total_value_eur) as avg_value_eur
                FROM wallet_snapshots
                WHERE wallet_address = ?
                AND timestamp >= datetime('now', '-' || ? || ' hours')
                GROUP BY strftime('%Y-%m-%d %H:00:00', timestamp)
            )
            SELECT 
                hour,
                avg_value_usd,
                avg_value_eur,
                (avg_value_usd - LAG(avg_value_usd) OVER (ORDER BY hour)) / 
                LAG(avg_value_usd) OVER (ORDER BY hour) * 100 as hourly_change_percentage
            FROM hourly_snapshots
            ORDER BY hour DESC
        `, [walletAddress, timeframe === '24h' ? '24' : timeframe === '7d' ? '168' : '720']);

        return {
            success: true,
            response: formatEvolutionResponse(evolution)
        };
    }
};