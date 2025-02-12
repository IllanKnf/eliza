// packages/plugin-alchemy/src/actions/get-portfolio-analysis.ts

export const getPortfolioAnalysisAction = {
    name: "GET_PORTFOLIO_ANALYSIS",
    description: "Get detailed portfolio analysis with historical data",
    handler: async (runtime: IAgentRuntime, message: AlchemyRequest) => {
      const { walletAddress, timeframe = '24h' } = message.content;
      const db = runtime.getDatabaseAdapter();
  
      // Analyse sur 24h
      const analysis = await db.query(`
        WITH time_comparison AS (
          SELECT 
            ws1.total_value_usd as current_value,
            ws1.total_value_eur as current_value_eur,
            ws2.total_value_usd as previous_value,
            ws2.total_value_eur as previous_value_eur,
            ((ws1.total_value_usd - ws2.total_value_usd) / 
             ws2.total_value_usd * 100) as value_change_percent
          FROM wallet_snapshots ws1
          LEFT JOIN wallet_snapshots ws2 ON 
            ws2.wallet_address = ws1.wallet_address
            AND ws2.timestamp = (
              SELECT timestamp 
              FROM wallet_snapshots 
              WHERE wallet_address = ws1.wallet_address
              AND timestamp <= datetime('now', '-24 hours')
              ORDER BY timestamp DESC 
              LIMIT 1
            )
          WHERE ws1.wallet_address = ?
          ORDER BY ws1.timestamp DESC
          LIMIT 1
        ),
        token_changes AS (
          SELECT 
            tm.name,
            tm.symbol,
            tp1.balance as current_balance,
            tp1.value_usd as current_value,
            tp1.price_usd as current_price,
            ((tp1.price_usd - tp2.price_usd) / tp2.price_usd * 100) as price_change_percent
          FROM token_positions tp1
          JOIN wallet_snapshots ws1 ON tp1.snapshot_id = ws1.id
          LEFT JOIN token_positions tp2 ON 
            tp2.token_address = tp1.token_address
            AND tp2.snapshot_id = (
              SELECT id 
              FROM wallet_snapshots 
              WHERE wallet_address = ws1.wallet_address
              AND timestamp <= datetime('now', '-24 hours')
              ORDER BY timestamp DESC 
              LIMIT 1
            )
          JOIN token_metadata tm ON tp1.token_address = tm.contract_address
          WHERE ws1.wallet_address = ?
          AND ws1.timestamp = (
            SELECT timestamp 
            FROM wallet_snapshots 
            WHERE wallet_address = ?
            ORDER BY timestamp DESC 
            LIMIT 1
          )
        )
        SELECT * FROM time_comparison, token_changes
      `, [walletAddress, walletAddress, walletAddress]);
  
      return {
        success: true,
        response: formatPortfolioAnalysis(analysis)
      };
    }
  };